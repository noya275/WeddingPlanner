"""Tests for /events — CRUD operations and cross-user access control."""


def test_create_event(auth_client):
    res = auth_client.post("/events/", json={"title": "My Wedding"})
    assert res.status_code == 201
    assert res.json()["title"] == "My Wedding"


def test_create_event_seeds_default_vendors(auth_client, event_id):
    res = auth_client.get(f"/events/{event_id}/vendors")
    assert res.status_code == 200
    names = [v["name"] for v in res.json()]
    assert "Photographer" in names
    assert "DJ" in names


def test_list_events(auth_client):
    auth_client.post("/events/", json={"title": "Event 1"})
    auth_client.post("/events/", json={"title": "Event 2"})
    res = auth_client.get("/events/")
    assert len(res.json()) == 2


def test_update_event_title(auth_client, event_id):
    res = auth_client.patch(f"/events/{event_id}", json={"title": "Updated Title"})
    assert res.json()["title"] == "Updated Title"


def test_update_event_date(auth_client, event_id):
    res = auth_client.patch(f"/events/{event_id}", json={"date": "2027-01-01"})
    assert res.json()["date"] == "2027-01-01"


def test_delete_event(auth_client, event_id):
    auth_client.delete(f"/events/{event_id}")
    res = auth_client.get(f"/events/{event_id}")
    assert res.status_code == 404


def test_cannot_access_other_users_event(client, auth_client, event_id):
    client.post("/auth/register", json={"email": "other@b.com", "name": "Other", "password": "pass"})
    res2 = client.post("/auth/login", data={"username": "other@b.com", "password": "pass"})
    client.headers["Authorization"] = f"Bearer {res2.json()['access_token']}"
    res = client.get(f"/events/{event_id}")
    assert res.status_code == 404
