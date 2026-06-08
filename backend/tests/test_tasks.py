"""Tests for /events/{id}/tasks — create, update title/status, and delete."""


def test_create_and_list_tasks(auth_client, event_id):
    auth_client.post(f"/events/{event_id}/tasks", json={"title": "Book venue", "status": "todo"})
    res = auth_client.get(f"/events/{event_id}/tasks")
    assert res.status_code == 200
    assert res.json()[0]["title"] == "Book venue"


def test_update_task_status(auth_client, event_id):
    task_id = auth_client.post(
        f"/events/{event_id}/tasks", json={"title": "Hire DJ", "status": "todo"}
    ).json()["id"]
    res = auth_client.patch(f"/events/{event_id}/tasks/{task_id}", json={"status": "done"})
    assert res.json()["status"] == "done"


def test_update_task_title(auth_client, event_id):
    task_id = auth_client.post(
        f"/events/{event_id}/tasks", json={"title": "Old title", "status": "todo"}
    ).json()["id"]
    res = auth_client.patch(f"/events/{event_id}/tasks/{task_id}", json={"title": "New title"})
    assert res.json()["title"] == "New title"


def test_delete_task(auth_client, event_id):
    task_id = auth_client.post(
        f"/events/{event_id}/tasks", json={"title": "Temporary", "status": "todo"}
    ).json()["id"]
    auth_client.delete(f"/events/{event_id}/tasks/{task_id}")
    res = auth_client.get(f"/events/{event_id}/tasks/{task_id}")
    assert res.status_code == 404


def test_task_not_found_returns_404(auth_client, event_id):
    res = auth_client.get(f"/events/{event_id}/tasks/99999")
    assert res.status_code == 404
