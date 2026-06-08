"""Tests for /events/{id}/guests — CRUD, RSVP status, table assignment, and access control."""


def test_create_and_list_guests(auth_client, event_id):
    auth_client.post(f"/events/{event_id}/guests", json={"name": "Alice", "rsvp_status": "pending"})
    res = auth_client.get(f"/events/{event_id}/guests")
    assert res.status_code == 200
    assert res.json()[0]["name"] == "Alice"


def test_guest_gets_rsvp_token(auth_client, event_id):
    res = auth_client.post(f"/events/{event_id}/guests", json={"name": "Bob", "rsvp_status": "pending"})
    assert res.json()["rsvp_token"] is not None


def test_update_rsvp_status(auth_client, event_id):
    guest_id = auth_client.post(
        f"/events/{event_id}/guests", json={"name": "Carol", "rsvp_status": "pending"}
    ).json()["id"]
    res = auth_client.patch(f"/events/{event_id}/guests/{guest_id}", json={"rsvp_status": "confirmed"})
    assert res.json()["rsvp_status"] == "confirmed"


def test_assign_table_number(auth_client, event_id):
    guest_id = auth_client.post(
        f"/events/{event_id}/guests", json={"name": "Dave", "rsvp_status": "pending"}
    ).json()["id"]
    res = auth_client.patch(f"/events/{event_id}/guests/{guest_id}", json={"table_number": 3})
    assert res.json()["table_number"] == 3


def test_delete_guest(auth_client, event_id):
    guest_id = auth_client.post(
        f"/events/{event_id}/guests", json={"name": "Eve", "rsvp_status": "pending"}
    ).json()["id"]
    auth_client.delete(f"/events/{event_id}/guests/{guest_id}")
    res = auth_client.get(f"/events/{event_id}/guests/{guest_id}")
    assert res.status_code == 404


def test_cannot_access_other_users_guests(client, auth_client, event_id):
    client.post("/auth/register", json={"email": "eve@b.com", "name": "Eve", "password": "pass"})
    res2 = client.post("/auth/login", data={"username": "eve@b.com", "password": "pass"})
    client.headers["Authorization"] = f"Bearer {res2.json()['access_token']}"
    res = client.get(f"/events/{event_id}/guests")
    assert res.status_code == 404
