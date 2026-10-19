# Edge cases: marketplace remaining-hours rounding
import os
import uuid
import requests

API = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/") + "/api"
RUN = uuid.uuid4().hex[:6]


def login(n):
    return {"Authorization": "Bearer " + requests.post(f"{API}/auth/mock-login", json={"username": n}).json()["token"]}


def test_rent_full_purchased_hours():
    o = login("czr")
    u = login(f"TEST_edge_{RUN}")
    code = requests.post(f"{API}/admin/giftcards", headers=o, json={"amount": 10}).json()[0]["code"]
    requests.post(f"{API}/giftcards/redeem", headers=u, json={"code": code})
    assert requests.post(f"{API}/slots/purchase", headers=u, json={"division": "russian", "hours": 2}).status_code == 200
    r = requests.post(f"{API}/market/listings", headers=u, json={"division": "russian", "type": "rent", "price": 1, "hours": 2})
    print(r.status_code, r.text)
    assert r.status_code == 200, f"Can't rent out the full 2h just bought: {r.text}"
