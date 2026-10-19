# Horloge Joiner backend regression tests (auth, giftcards, slots, key, market, logs, script API, admin)
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = BASE_URL + "/api"
BOT_TOKEN = os.environ.get("BOT_API_TOKEN")
RUN = uuid.uuid4().hex[:6]


def login(name):
    r = requests.post(f"{API}/auth/mock-login", json={"username": name})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def me(h):
    return requests.get(f"{API}/auth/me", headers=h).json()


def settings(owner, **kw):
    r = requests.put(f"{API}/admin/settings", headers=owner, json=kw)
    assert r.status_code == 200, r.text
    return r.json()


def gift(owner, amount):
    r = requests.post(f"{API}/admin/giftcards", headers=owner, json={"amount": amount, "count": 1})
    assert r.status_code == 200, r.text
    return r.json()[0]["code"]


def fund(owner, h, amount):
    code = gift(owner, amount)
    r = requests.post(f"{API}/giftcards/redeem", headers=h, json={"code": code})
    assert r.status_code == 200, r.text


@pytest.fixture(scope="module")
def owner():
    h = login("czr")
    settings(h, system_frozen=False, frozen_divisions=[], whitelist_only=False, global_blacklist=[])
    yield h
    settings(h, system_frozen=False, frozen_divisions=[], whitelist_only=False, demo_feed=True,
             global_blacklist=[], owner_selfbot=False)


@pytest.fixture(scope="module")
def alice():
    return login(f"TEST_alice_{RUN}")


@pytest.fixture(scope="module")
def bob():
    return login(f"TEST_bob_{RUN}")


# --- Auth ---
def test_owner_is_admin(owner):
    m = me(owner)
    assert m["is_admin"] is True
    assert len(m["access"]) == 3 and all(a["infinite"] for a in m["access"])
    assert requests.get(f"{API}/admin/overview", headers=owner).status_code == 200


def test_normal_not_admin(alice):
    m = me(alice)
    assert m["is_admin"] is False and m["access"] == []
    assert requests.get(f"{API}/admin/overview", headers=alice).status_code == 403
    assert requests.post(f"{API}/admin/giftcards", headers=alice, json={"amount": 5}).status_code == 403


# --- Gift cards ---
def test_giftcard_redeem_once(owner, alice):
    code = gift(owner, 50)
    b0 = me(alice)["balance"]
    r = requests.post(f"{API}/giftcards/redeem", headers=alice, json={"code": code.lower()})
    assert r.status_code == 200 and r.json()["amount"] == 50
    assert me(alice)["balance"] == pytest.approx(b0 + 50)
    r2 = requests.post(f"{API}/giftcards/redeem", headers=alice, json={"code": code})
    assert r2.status_code == 404


# --- Slots ---
def test_purchase_king_2h(alice):
    b0 = me(alice)["balance"]
    r = requests.post(f"{API}/slots/purchase", headers=alice, json={"division": "king", "hours": 2})
    assert r.status_code == 200, r.text
    assert r.json()["cost"] == 10
    m = me(alice)
    assert m["balance"] == pytest.approx(b0 - 10)
    assert [a["division"] for a in m["access"]] == ["king"]
    assert m["key"]
    divs = {d["id"]: d for d in requests.get(f"{API}/divisions", headers=alice).json()}
    assert any(o["username"].startswith("TEST_alice") for o in divs["king"]["occupants"])
    s = requests.get(f"{API}/script", headers=alice).json()
    assert s["locked"] is False and m["key"] in s["loader"]


def test_purchase_exceed_24h(alice):
    r = requests.post(f"{API}/slots/purchase", headers=alice, json={"division": "king", "hours": 23})
    assert r.status_code == 400 and "24" in r.json()["detail"]
    r = requests.post(f"{API}/slots/purchase", headers=alice, json={"division": "king", "hours": 25})
    assert r.status_code == 422


def test_purchase_insufficient(bob):
    r = requests.post(f"{API}/slots/purchase", headers=bob, json={"division": "russian", "hours": 1})
    assert r.status_code == 400 and "Insufficient" in r.json()["detail"]


def test_frozen_system(owner, bob):
    settings(owner, system_frozen=True)
    try:
        r = requests.post(f"{API}/slots/purchase", headers=bob, json={"division": "russian", "hours": 1})
        assert r.status_code == 423
        assert requests.get(f"{API}/settings/public").json()["system_frozen"] is True
        assert all(d["frozen"] for d in requests.get(f"{API}/divisions", headers=bob).json())
    finally:
        settings(owner, system_frozen=False)
    settings(owner, frozen_divisions=["slave"])
    try:
        r = requests.post(f"{API}/slots/purchase", headers=bob, json={"division": "slave", "hours": 1})
        assert r.status_code == 423
    finally:
        settings(owner, frozen_divisions=[])


# --- Script API ---
def test_script_auth_hwid(alice):
    key = me(alice)["key"]
    r = requests.post(f"{API}/script/auth", json={"key": key, "hwid": "HW-A"})
    assert r.status_code == 200 and r.json()["divisions"] == ["king"]
    r = requests.post(f"{API}/script/auth", json={"key": key, "hwid": "HW-B"})
    assert r.status_code == 403
    assert requests.post(f"{API}/script/auth", json={"key": "bad", "hwid": "x"}).status_code == 401
    p = requests.post(f"{API}/script/poll", json={"key": key, "hwid": "HW-A"})
    assert p.status_code == 200 and isinstance(p.json()["logs"], list)


def test_ingest_and_report(owner, alice):
    hdr = {"X-Bot-Token": BOT_TOKEN}
    job = f"TEST_job_{RUN}"
    body = {"job_id": job, "players": 5, "brainrots": [
        {"name": "Strawberry Elephant", "mutation": "Gold"}, {"name": "Noobini Pizzanini", "mutation": "Normal"}]}
    r = requests.post(f"{API}/logs/ingest", json=body, headers=hdr)
    assert r.status_code == 200 and r.json()["inserted"] == 1, r.text
    assert requests.post(f"{API}/logs/ingest", json=body, headers={"X-Bot-Token": "nope"}).status_code == 401
    logs = requests.get(f"{API}/logs", headers=alice).json()
    mine = [x for x in logs if x["job_id"] == job]
    assert mine and mine[0]["locked"] is False
    key = me(alice)["key"]
    rep = requests.post(f"{API}/script/report", json={"key": key, "hwid": "HW-A", "job_id": job + "r",
                                                      "brainrots": [{"name": "Strawberry Elephant"}]})
    assert rep.status_code == 200 and rep.json()["inserted"] == 1


def test_locked_logs_for_no_slot(bob):
    logs = requests.get(f"{API}/logs", headers=bob).json()
    assert logs and all(x["locked"] and x["job_id"] is None for x in logs)


def test_selfbot_status(owner, alice):
    okey = me(owner)["key"]
    requests.post(f"{API}/key/reset-hwid", headers=owner)
    settings(owner, owner_selfbot=True)
    r = requests.post(f"{API}/script/selfbot/status", json={"key": okey, "hwid": "OWNER-HW"})
    assert r.status_code == 200 and r.json()["enabled"] is True
    settings(owner, owner_selfbot=False)
    r = requests.post(f"{API}/script/selfbot/status", json={"key": okey, "hwid": "OWNER-HW"})
    assert r.json()["enabled"] is False
    r = requests.post(f"{API}/script/selfbot/status", json={"key": me(alice)["key"], "hwid": "HW-A"})
    assert r.status_code == 403
    requests.post(f"{API}/key/reset-hwid", headers=owner)


def test_global_blacklist(owner):
    settings(owner, global_blacklist=["Strawberry Elephant"])
    try:
        r = requests.post(f"{API}/logs/ingest", headers={"X-Bot-Token": BOT_TOKEN},
                          json={"job_id": "TEST_bl", "brainrots": [{"name": "strawberry elephant", "mutation": "Gold"}]})
        assert r.json()["inserted"] == 0
    finally:
        settings(owner, global_blacklist=[])


# --- Key actions ---
def test_key_actions(alice, bob):
    assert requests.post(f"{API}/key/reset-hwid", headers=alice).status_code == 200
    assert me(alice)["hwid"] is None
    assert requests.post(f"{API}/key/reset-hwid", headers=alice).status_code == 429
    old = me(alice)["key"]
    r = requests.post(f"{API}/key/regen", headers=alice)
    assert r.status_code == 200 and r.json()["key"] != old and me(alice)["key"] == r.json()["key"]


# --- Market ---
def test_market_rent_and_sell(owner, alice, bob):
    # carol buys slave 3h, lists rent; bob rents
    carol = login(f"TEST_carol_{RUN}")
    fund(owner, carol, 30)
    fund(owner, bob, 30)
    assert requests.post(f"{API}/slots/purchase", headers=carol, json={"division": "slave", "hours": 3}).status_code == 200
    r = requests.post(f"{API}/market/listings", headers=carol, json={"division": "slave", "type": "rent", "price": 6, "hours": 1})
    assert r.status_code == 400
    r = requests.post(f"{API}/market/listings", headers=carol, json={"division": "slave", "type": "rent", "price": 2, "hours": 1})
    assert r.status_code == 200, r.text
    lid = r.json()["id"]
    assert any(x["id"] == lid for x in requests.get(f"{API}/market/listings?type=rent", headers=bob).json())
    cb, bb = me(carol)["balance"], me(bob)["balance"]
    r = requests.post(f"{API}/market/listings/{lid}/buy", headers=bob, json={"hours": 1})
    assert r.status_code == 200, r.text
    assert me(bob)["balance"] == pytest.approx(bb - 2)
    assert me(carol)["balance"] == pytest.approx(cb + 2)
    assert "slave" in [a["division"] for a in me(bob)["access"]]
    assert "slave" not in [a["division"] for a in me(carol)["access"]]
    assert any(t["type"] == "market_buy" for t in requests.get(f"{API}/me/transactions", headers=bob).json())
    # alice sells king slot to bob
    r = requests.post(f"{API}/market/listings", headers=alice, json={"division": "king", "type": "sell", "price": 4})
    assert r.status_code == 200, r.text
    sid = r.json()["id"]
    r = requests.post(f"{API}/market/listings/{sid}/buy", headers=bob, json={})
    assert r.status_code == 200, r.text
    assert "king" in [a["division"] for a in me(bob)["access"]]
    assert "king" not in [a["division"] for a in me(alice)["access"]]


def test_transfer(owner, bob):
    dave = login(f"TEST_dave_{RUN}")
    r = requests.post(f"{API}/key/transfer", headers=bob, json={"username": f"TEST_dave_{RUN}", "division": "king"})
    assert r.status_code == 200, r.text
    assert "king" in [a["division"] for a in me(dave)["access"]]
    assert requests.post(f"{API}/key/transfer", headers=bob,
                         json={"username": "nobody_x_zz", "division": "king"}).status_code == 404


# --- Stats / leaderboard ---
def test_stats_leaderboard(alice):
    s = requests.get(f"{API}/stats", headers=alice).json()
    assert len(s["chart"]) == 24 and "og" in s["counts"]
    lb = requests.get(f"{API}/leaderboard", headers=alice).json()
    assert lb["spenders"] and lb["spenders"][0]["total_spent"] >= lb["spenders"][-1]["total_spent"]


# --- Admin users ---
def test_admin_users_whitelist_ban(owner):
    eve_h = login(f"TEST_eve_{RUN}")
    eve = me(eve_h)
    r = requests.patch(f"{API}/admin/users/{eve['id']}", headers=owner, json={"add_balance": 20})
    assert r.status_code == 200 and r.json()["balance"] == 20
    settings(owner, whitelist_only=True)
    try:
        r = requests.post(f"{API}/slots/purchase", headers=eve_h, json={"division": "russian", "hours": 1})
        assert r.status_code == 403
        requests.patch(f"{API}/admin/users/{eve['id']}", headers=owner, json={"whitelisted": True})
        r = requests.post(f"{API}/slots/purchase", headers=eve_h, json={"division": "russian", "hours": 1})
        assert r.status_code == 200, r.text
    finally:
        settings(owner, whitelist_only=False)
    requests.patch(f"{API}/admin/users/{eve['id']}", headers=owner, json={"banned": True})
    assert requests.get(f"{API}/auth/me", headers=eve_h).status_code == 403
    requests.patch(f"{API}/admin/users/{eve['id']}", headers=owner, json={"banned": False})
    assert requests.get(f"{API}/auth/me", headers=eve_h).status_code == 200
