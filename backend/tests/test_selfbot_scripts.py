# Self bot / Lua scripts / joiner poll flow tests (iteration 2)
import os
import re
import subprocess
import time
import uuid
from datetime import datetime, timezone, timedelta

import jwt
import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BENV = dotenv_values("/app/backend/.env")
FENV = dotenv_values("/app/frontend/.env")
BASE_URL = FENV["REACT_APP_BACKEND_URL"].rstrip("/")
API = BASE_URL + "/api"
BOT = BENV["BOT_API_TOKEN"]
OWNER_KEY = "HJ-3G8A-4U3L-ILM3-R0A7"
OWNER_HWID = "81ed694185a24c0388ef6e644fee3af3f6f50aedae9982f9bd0f5fd04479bc6f"
OWNER_DID = BENV["OWNER_DISCORD_ID"]

mdb = MongoClient(BENV["MONGO_URL"])[BENV["DB_NAME"]]
TMP_USERS, TMP_SLOTS = [], []


def tok(uid):
    return jwt.encode({"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, BENV["JWT_SECRET"], "HS256")


def mk_user(slot=None):
    uid = str(uuid.uuid4())
    key = "TEST-" + uuid.uuid4().hex[:12].upper()
    mdb.users.insert_one({"id": uid, "discord_id": "TEST_" + uid, "username": "TEST_" + uid[:6], "key": key, "hwid": None,
                          "filters": {"blacklist": [], "whitelist": [], "min_value": 0, "auto_join": True, "self_bot": False},
                          "balance": 0.0, "total_spent": 0.0, "banned": False, "created_at": datetime.now(timezone.utc)})
    TMP_USERS.append(uid)
    if slot:
        sid = str(uuid.uuid4())
        mdb.slots.insert_one({"id": sid, "user_id": uid, "division": slot, "started_at": datetime.now(timezone.utc),
                              "expires_at": datetime.now(timezone.utc) + timedelta(hours=2), "rented_to": None, "rent_until": None})
        TMP_SLOTS.append(sid)
    return uid, key


@pytest.fixture(scope="module", autouse=True)
def cleanup():
    start = datetime.now(timezone.utc) - timedelta(seconds=5)
    orig = (mdb.settings.find_one({"_id": "global"}) or {}).get("owner_selfbot", True)
    yield
    mdb.users.delete_many({"id": {"$in": TMP_USERS}})
    mdb.slots.delete_many({"id": {"$in": TMP_SLOTS}})
    mdb.logs.delete_many({"created_at": {"$gte": start}})
    mdb.selfbot_runs.delete_many({"created_at": {"$gte": start}})
    mdb.settings.update_one({"_id": "global"}, {"$set": {"owner_selfbot": orig, "min_log_value": 1000000}}, upsert=True)


@pytest.fixture(scope="module")
def owner_jwt():
    u = mdb.users.find_one({"discord_id": OWNER_DID})
    return tok(u["id"])


# ---- Lua scripts served + syntax ----
@pytest.mark.parametrize("path", ["/script/client.lua", "/script/selfbot.lua", f"/script/bot.lua?token={BOT}"])
def test_lua_served_and_valid(path, tmp_path):
    r = requests.get(API + path, timeout=20)
    assert r.status_code == 200
    src = r.text
    assert "__API__" not in src and "__BOT_TOKEN__" not in src
    assert API in src
    for needle in ["buildUI(", "ScreenGui", "local function scan()", "AnimalPodiums", "AnimalOverhead",
                   "DisplayName", "Mutation", "Generation", "local function deepScan()", "4.5", "local function hop()"]:
        assert needle in src, f"{needle} missing in {path}"
    if "client" not in path:
        assert "qot(LOADER)" in src and "queue_on_teleport" in src
    f = tmp_path / "s.lua"
    f.write_text(src)
    p = subprocess.run(["luac5.1", "-p", str(f)], capture_output=True, text=True)
    assert p.returncode == 0, p.stderr


def test_bot_lua_bad_token():
    assert requests.get(API + "/script/bot.lua?token=bad", timeout=15).status_code == 401


def test_bot_lua_contains_token():
    assert BOT in requests.get(API + f"/script/bot.lua?token={BOT}", timeout=15).text


# ---- Owner self bot status/set ----
def test_selfbot_status_set_owner():
    r = requests.post(API + "/script/selfbot/status", json={"key": OWNER_KEY, "hwid": OWNER_HWID})
    assert r.status_code == 200, r.text
    d = r.json()
    assert {"enabled", "runs", "logged"} <= set(d)
    r = requests.post(API + "/script/selfbot/set", json={"key": OWNER_KEY, "hwid": OWNER_HWID, "enabled": False})
    assert r.status_code == 200 and r.json()["enabled"] is False
    assert requests.post(API + "/script/selfbot/status", json={"key": OWNER_KEY, "hwid": OWNER_HWID}).json()["enabled"] is False
    r = requests.post(API + "/script/selfbot/set", json={"key": OWNER_KEY, "hwid": OWNER_HWID, "enabled": True})
    assert r.json()["enabled"] is True
    assert mdb.settings.find_one({"_id": "global"})["owner_selfbot"] is True


def test_selfbot_wrong_hwid_owner():
    r = requests.post(API + "/script/selfbot/status", json={"key": OWNER_KEY, "hwid": "wrong"})
    assert r.status_code == 403


def test_selfbot_non_owner_forbidden():
    _, key = mk_user("king")
    assert requests.post(API + "/script/selfbot/status", json={"key": key, "hwid": "h1"}).status_code == 403
    assert requests.post(API + "/script/selfbot/set", json={"key": key, "hwid": "h1", "enabled": False}).status_code == 403
    assert mdb.settings.find_one({"_id": "global"})["owner_selfbot"] is True


# ---- Report -> Poll flow ----
def test_report_then_poll_delivers():
    uid, key = mk_user("king")
    # bind hwid
    a = requests.post(API + "/script/auth", json={"key": key, "hwid": "hw-joiner"})
    assert a.status_code == 200, a.text
    before = requests.post(API + "/script/selfbot/status", json={"key": OWNER_KEY, "hwid": OWNER_HWID}).json()
    job = "TEST-JOB-" + uuid.uuid4().hex[:8]
    body = {"key": OWNER_KEY, "hwid": OWNER_HWID, "job_id": job, "place_id": 109983668079237, "players": 7, "selfbot": True,
            "brainrots": [{"name": "Skibidi Toilet", "mutation": "Gold", "generation": ""},
                          {"name": "Dragon Cannelloni", "mutation": "Normal", "generation": "$250M/s"},
                          {"name": "Noobini Pizzanini", "mutation": "Normal", "generation": "$1/s"}]}
    t0 = time.time()
    r = requests.post(API + "/script/report", json=body)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["inserted"] == 2
    assert d["runs"] == before["runs"] + 1
    assert d["logged"] == before["logged"] + 2
    logs = list(mdb.logs.find({"job_id": job}))
    names = {x["name"]: x for x in logs}
    assert "Noobini Pizzanini" not in names
    assert names["Skibidi Toilet"]["tier"] == "og"
    dc = [x for x in logs if "Cannelloni" in x["name"]][0]
    assert dc["value"] == 250e6 and dc["tier"] == "peak"
    run = mdb.selfbot_runs.find_one({"job_id": job})
    assert run and run["scanned"] == 3 and run["logged"] == 2
    p = requests.post(API + "/script/poll", json={"key": key, "hwid": "hw-joiner"})
    assert p.status_code == 200
    got = [x for x in p.json()["logs"] if x["job_id"] == job]
    assert len(got) == 2
    assert all(x["place_id"] == 109983668079237 for x in got)
    assert time.time() - t0 < 8
    # with since = auth server_time from before report
    p2 = requests.post(API + "/script/poll", json={"key": key, "hwid": "hw-joiner", "since": a.json()["server_time"]})
    assert len([x for x in p2.json()["logs"] if x["job_id"] == job]) == 2


def test_report_non_owner_selfbot_no_run():
    _, key = mk_user("king")
    job = "TEST-JOB-" + uuid.uuid4().hex[:8]
    r = requests.post(API + "/script/report", json={"key": key, "hwid": "hx", "job_id": job, "selfbot": True,
                                                    "brainrots": [{"name": "Skibidi Toilet"}]})
    assert r.status_code == 200 and r.json() == {"inserted": 1}
    assert mdb.selfbot_runs.find_one({"job_id": job}) is None


def test_poll_no_slot_user():
    _, key = mk_user(None)
    r = requests.post(API + "/script/poll", json={"key": key, "hwid": "hn"})
    assert r.status_code == 200 and r.json()["logs"] == []
    assert requests.post(API + "/script/auth", json={"key": key, "hwid": "hn"}).status_code == 402


def test_russian_user_doesnt_get_og():
    _, key = mk_user("russian")
    job = "TEST-JOB-" + uuid.uuid4().hex[:8]
    requests.post(API + "/script/report", json={"key": OWNER_KEY, "hwid": OWNER_HWID, "job_id": job, "selfbot": True,
                                                "brainrots": [{"name": "Skibidi Toilet"}]})
    logs = requests.post(API + "/script/poll", json={"key": key, "hwid": "hr"}).json()["logs"]
    assert not any(x["job_id"] == job for x in logs)


# ---- Script settings ----
def test_script_settings_auto_join():
    uid, key = mk_user("slave")
    r = requests.post(API + "/script/settings", json={"key": key, "hwid": "hs", "auto_join": False})
    assert r.status_code == 200 and r.json()["auto_join"] is False
    assert mdb.users.find_one({"id": uid})["filters"]["auto_join"] is False
    a = requests.post(API + "/script/auth", json={"key": key, "hwid": "hs"}).json()
    assert a["auto_join"] is False
    assert requests.post(API + "/script/poll", json={"key": key, "hwid": "hs"}).json()["auto_join"] is False
    assert requests.post(API + "/script/settings", json={"key": key, "hwid": "bad", "auto_join": True}).status_code == 403


# ---- Bot ingest + admin ----
def test_ingest_and_admin_runs(owner_jwt):
    job = "TEST-BOT-" + uuid.uuid4().hex[:8]
    r = requests.post(API + "/logs/ingest", headers={"X-Bot-Token": BOT},
                      json={"job_id": job, "players": 3, "brainrots": [{"name": "Skibidi Toilet"}, {"name": "Noobini Pizzanini"}]})
    assert r.status_code == 200 and r.json()["inserted"] == 1
    assert requests.post(API + "/logs/ingest", headers={"X-Bot-Token": "x"}, json={"job_id": job}).status_code == 401
    ov = requests.get(API + "/admin/overview", headers={"Authorization": f"Bearer {owner_jwt}"})
    assert ov.status_code == 200
    runs = [x for x in ov.json()["selfbot_runs"] if x["job_id"] == job]
    assert runs and runs[0]["source"] == "bot" and runs[0]["scanned"] == 2 and runs[0]["logged"] == 1


def test_min_log_value_lowered(owner_jwt):
    h = {"Authorization": f"Bearer {owner_jwt}"}
    r = requests.put(API + "/admin/settings", headers=h, json={"min_log_value": 0})
    assert r.status_code == 200 and r.json()["min_log_value"] == 0
    job = "TEST-LOW-" + uuid.uuid4().hex[:8]
    r = requests.post(API + "/logs/ingest", headers={"X-Bot-Token": BOT},
                      json={"job_id": job, "brainrots": [{"name": "Noobini Pizzanini", "generation": "$5/s"}]})
    assert r.json()["inserted"] == 1
    lg = mdb.logs.find_one({"job_id": job})
    assert lg["tier"] == "low" and lg["value"] == 5
    r = requests.put(API + "/admin/settings", headers=h, json={"min_log_value": 1000000})
    assert r.json()["min_log_value"] == 1000000


def test_owner_hwid_untouched():
    u = mdb.users.find_one({"discord_id": OWNER_DID})
    assert u["key"] == OWNER_KEY and u["hwid"] == OWNER_HWID
