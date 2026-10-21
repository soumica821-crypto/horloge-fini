# Iteration 3: value parsing (/s only), poll image field, Lua hop/readOverhead/join guard/pictures, dedupe
import os
import subprocess
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BENV = dotenv_values("/app/backend/.env")
FENV = dotenv_values("/app/frontend/.env")
API = FENV["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
BOT = BENV["BOT_API_TOKEN"]
OWNER_KEY = "HJ-3G8A-4U3L-ILM3-R0A7"
OWNER_HWID = "81ed694185a24c0388ef6e644fee3af3f6f50aedae9982f9bd0f5fd04479bc6f"
mdb = MongoClient(BENV["MONGO_URL"])[BENV["DB_NAME"]]
TMP_USERS, TMP_SLOTS = [], []
H = {"X-Bot-Token": BOT}


def job():
    return "TEST_JOB_" + uuid.uuid4().hex


def mk_user(division):
    uid = str(uuid.uuid4())
    key = "TEST-" + uuid.uuid4().hex[:12].upper()
    mdb.users.insert_one({"id": uid, "discord_id": "TEST_" + uid, "username": "TEST_" + uid[:6], "key": key, "hwid": None,
                          "filters": {"blacklist": [], "whitelist": [], "min_value": 0, "auto_join": True, "self_bot": False},
                          "balance": 0.0, "total_spent": 0.0, "banned": False, "created_at": datetime.now(timezone.utc)})
    TMP_USERS.append(uid)
    sid = str(uuid.uuid4())
    mdb.slots.insert_one({"id": sid, "user_id": uid, "division": division, "started_at": datetime.now(timezone.utc),
                          "expires_at": datetime.now(timezone.utc) + timedelta(hours=2), "rented_to": None, "rent_until": None})
    TMP_SLOTS.append(sid)
    return key


@pytest.fixture(scope="module", autouse=True)
def setup_cleanup():
    start = datetime.now(timezone.utc) - timedelta(seconds=5)
    g = mdb.settings.find_one({"_id": "global"}) or {}
    orig_sb = g.get("owner_selfbot", True)
    owner_before = mdb.users.find_one({"key": OWNER_KEY}, {"_id": 0, "key": 1, "hwid": 1})
    mdb.settings.update_one({"_id": "global"}, {"$set": {"min_log_value": 0}}, upsert=True)
    yield
    mdb.users.delete_many({"id": {"$in": TMP_USERS}})
    mdb.slots.delete_many({"id": {"$in": TMP_SLOTS}})
    mdb.logs.delete_many({"created_at": {"$gte": start}})
    mdb.selfbot_runs.delete_many({"created_at": {"$gte": start}})
    mdb.settings.update_one({"_id": "global"}, {"$set": {"owner_selfbot": orig_sb, "min_log_value": 1000000}}, upsert=True)
    assert mdb.users.find_one({"key": OWNER_KEY}, {"_id": 0, "key": 1, "hwid": 1}) == owner_before


def ingest(j, brainrots):
    r = requests.post(API + "/logs/ingest", json={"job_id": j, "players": 5, "brainrots": brainrots}, headers=H, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


def stored(j):
    return list(mdb.logs.find({"job_id": j}, {"_id": 0}))


# ---- value parsing via /logs/ingest ----
@pytest.mark.parametrize("gen,value,text", [
    ("$1/s", 1, "$1/s"),
    ("$1.5M/s", 1.5e6, "$1.50M/s"),
    ("$25K/s", 25000, "$25.00K/s"),
    ("$4.5M", 1, "$1/s"),            # price (no /s) ignored -> base 1
    ("", 1, "$1/s"),                 # empty -> base
    ("19K", 1, "$1/s"),              # wrong label, no /s
])
def test_ingest_value_parsing(gen, value, text):
    j = job()
    assert ingest(j, [{"name": "Noobini Pizzanini", "mutation": "Normal", "generation": gen}])["inserted"] == 1
    d = stored(j)
    assert len(d) == 1
    assert d[0]["value"] == pytest.approx(value)
    assert d[0]["value_text"] == text
    assert d[0]["name"] == "Noobini Pizzanini"


def test_price_ignored_uses_mutation_multiplier():
    j = job()
    ingest(j, [{"name": "Noobini Pizzanini", "mutation": "Gold", "generation": "$4.5M"}])
    d = stored(j)[0]
    assert d["value"] == pytest.approx(1.25)
    assert d["mutation"] == "Gold"


def test_unparseable_slash_s_falls_back():
    j = job()
    ingest(j, [{"name": "Noobini Pizzanini", "mutation": "Normal", "generation": "?/s"}])
    assert stored(j)[0]["value"] == pytest.approx(1)


# ---- value parsing via /script/report (owner) ----
def test_report_value_parsing():
    j = job()
    r = requests.post(API + "/script/report", json={"key": OWNER_KEY, "hwid": OWNER_HWID, "job_id": j, "players": 3,
                                                    "brainrots": [
                                                        {"name": "Noobini Pizzanini", "mutation": "Normal", "generation": "$1/s"},
                                                        {"name": "Noobini Pizzanini", "mutation": "Diamond", "generation": "$4.5M"},
                                                        {"name": "Hydra Dragon Cannelloni", "mutation": "Normal", "generation": "$25K/s"},
                                                    ]}, timeout=20)
    assert r.status_code == 200, r.text
    assert r.json()["inserted"] == 3
    by = {(x["name"], x["mutation"]): x for x in stored(j)}
    assert by[("Noobini Pizzanini", "Normal")]["value"] == 1
    assert by[("Noobini Pizzanini", "Diamond")]["value"] == pytest.approx(1.5)
    assert by[("Hydra Dragon Cannelloni", "Normal")]["value"] == 25000
    assert all(x["source"].startswith("selfbot:") for x in by.values())


# ---- dedupe ----
def test_dedupe_same_job_and_new_job():
    j = job()
    b = [{"name": "Noobini Pizzanini", "mutation": "Normal", "generation": "$1/s"}]
    assert ingest(j, b)["inserted"] == 1
    assert ingest(j, b)["inserted"] == 0
    assert len(stored(j)) == 1
    # different mutation same job -> inserted
    assert ingest(j, [{"name": "Noobini Pizzanini", "mutation": "Gold", "generation": "$1/s"}])["inserted"] == 1
    # different job -> inserted
    j2 = job()
    assert ingest(j2, b)["inserted"] == 1
    assert len(stored(j2)) == 1


def test_dedupe_within_same_batch():
    j = job()
    b = {"name": "Noobini Pizzanini", "mutation": "Normal", "generation": "$1/s"}
    assert ingest(j, [b, b])["inserted"] == 1


def test_dedupe_expires_after_10_min():
    j = job()
    b = [{"name": "Noobini Pizzanini", "mutation": "Normal", "generation": "$1/s"}]
    ingest(j, b)
    mdb.logs.update_many({"job_id": j}, {"$set": {"created_at": datetime.now(timezone.utc) - timedelta(minutes=11)}})
    assert ingest(j, b)["inserted"] == 1
    # cleanup back-dated log (outside fixture window)
    mdb.logs.delete_many({"job_id": j})


# ---- poll returns image ----
def test_poll_includes_image():
    key = mk_user("king")
    hw = "TEST_HWID_" + uuid.uuid4().hex
    a = requests.post(API + "/script/auth", json={"key": key, "hwid": hw}, timeout=20)
    assert a.status_code == 200, a.text
    j = job()
    r = requests.post(API + "/script/report", json={"key": OWNER_KEY, "hwid": OWNER_HWID, "job_id": j,
                                                    "brainrots": [{"name": "Hydra Dragon Cannelloni", "mutation": "Normal", "generation": "$250M/s"},
                                                                  {"name": "Skibidi Toilet", "mutation": "Gold", "generation": ""}]}, timeout=20)
    assert r.json()["inserted"] == 2
    p = requests.post(API + "/script/poll", json={"key": key, "hwid": hw}, timeout=20)
    assert p.status_code == 200
    logs = [x for x in p.json()["logs"] if x["job_id"] == j]
    assert len(logs) == 2, p.json()
    for x in logs:
        assert "image" in x
        assert isinstance(x["image"], str) and x["image"].startswith("http")
        assert set(x) >= {"id", "name", "mutation", "value_text", "tier", "job_id", "place_id", "image"}
    img = requests.get(logs[0]["image"], timeout=20)
    print("image status", img.status_code, img.headers.get("content-type"))


# ---- Lua content ----
@pytest.mark.parametrize("path", ["/script/client.lua", "/script/selfbot.lua", f"/script/bot.lua?token={BOT}"])
def test_lua_valid_and_features(path, tmp_path):
    r = requests.get(API + path, timeout=20)
    assert r.status_code == 200
    src = r.text
    f = tmp_path / "s.lua"
    f.write_text(src)
    p = subprocess.run(["/usr/bin/luac5.1", "-p", str(f)], capture_output=True, text=True)
    assert p.returncode == 0, p.stderr
    assert "TeleportService:Teleport(game.PlaceId, LP)" in src
    assert "hopTry % 2 == 1" in src and "TeleportToPlaceInstance(game.PlaceId, servers" in src
    assert 'string.find(t, "/s", 1, true)' in src
    assert "ViewportFrame" in src and "ReplicatedStorage.Models.Animals" in src and "getcustomasset" in src
    assert "local function addRow(ui, text, color, btnText, onClick, name, image)" in src
    if "client" in path:
        assert "joiningUntil" in src and "if tick() < joiningUntil then return end" in src
        assert "log.name, log.image)" in src


def test_bot_lua_bad_token():
    assert requests.get(API + "/script/bot.lua?token=bad", timeout=20).status_code in (401, 403)
