"""Tests for /events/{id}/vendors — default seeding, sort order, price, paid status, and delete."""


def test_event_creates_default_vendors(auth_client, event_id):
    res = auth_client.get(f"/events/{event_id}/vendors")
    assert res.status_code == 200
    names = [v["name"] for v in res.json()]
    assert "Photographer" in names
    assert "DJ" in names
    assert "Wedding Dress" in names


def test_vendors_ordered_by_sort_order(auth_client, event_id):
    vendors = auth_client.get(f"/events/{event_id}/vendors").json()
    orders = [v["sort_order"] for v in vendors]
    assert orders == sorted(orders)


def test_create_custom_vendor(auth_client, event_id):
    res = auth_client.post(
        f"/events/{event_id}/vendors", json={"name": "Flowers", "sort_order": 0}
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Flowers"


def test_create_vendor_auto_sort_order(auth_client, event_id):
    max_order = max(v["sort_order"] for v in auth_client.get(f"/events/{event_id}/vendors").json())
    res = auth_client.post(f"/events/{event_id}/vendors", json={"name": "Extra", "sort_order": 0})
    assert res.json()["sort_order"] == max_order + 1


def test_update_vendor_price(auth_client, event_id):
    vendor_id = auth_client.get(f"/events/{event_id}/vendors").json()[0]["id"]
    res = auth_client.patch(f"/events/{event_id}/vendors/{vendor_id}", json={"price": 5000})
    assert float(res.json()["price"]) == 5000


def test_mark_vendor_paid(auth_client, event_id):
    vendor_id = auth_client.get(f"/events/{event_id}/vendors").json()[0]["id"]
    res = auth_client.patch(f"/events/{event_id}/vendors/{vendor_id}", json={"is_paid": True})
    assert res.json()["is_paid"] is True


def test_delete_vendor(auth_client, event_id):
    vendor_id = auth_client.get(f"/events/{event_id}/vendors").json()[0]["id"]
    auth_client.delete(f"/events/{event_id}/vendors/{vendor_id}")
    res = auth_client.get(f"/events/{event_id}/vendors/{vendor_id}")
    assert res.status_code == 404
