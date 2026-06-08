"""Tests for /auth — registration, login, and the /me endpoint."""


def test_register(client):
    res = client.post("/auth/register", json={"email": "a@b.com", "name": "A", "password": "abc123"})
    assert res.status_code == 201
    assert res.json()["email"] == "a@b.com"


def test_register_duplicate_email(client):
    client.post("/auth/register", json={"email": "a@b.com", "name": "A", "password": "abc123"})
    res = client.post("/auth/register", json={"email": "a@b.com", "name": "B", "password": "xyz"})
    assert res.status_code == 400


def test_login(client):
    client.post("/auth/register", json={"email": "a@b.com", "name": "A", "password": "abc123"})
    res = client.post("/auth/login", data={"username": "a@b.com", "password": "abc123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "a@b.com", "name": "A", "password": "abc123"})
    res = client.post("/auth/login", data={"username": "a@b.com", "password": "wrong"})
    assert res.status_code == 401


def test_me(auth_client):
    res = auth_client.get("/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "test@test.com"


def test_me_unauthenticated(client):
    res = client.get("/auth/me")
    assert res.status_code == 401
