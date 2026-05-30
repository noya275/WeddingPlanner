# Wedding Planner — How It Works

---

## The Stack

```
Browser (React / TypeScript)   ← what the user sees
        ↕  HTTP (JSON)
Server (FastAPI / Python)      ← business logic, auth, data
        ↕  SQL
Database (SQLite / PostgreSQL) ← permanent storage
```

They only talk through HTTP. The frontend never touches the database directly.

---

## Backend Files

### `database.py`
Sets up the connection to the database. Creates:
- `engine` — the actual connection to the DB file
- `SessionLocal` — a factory that opens/closes DB sessions (one per request)
- `Base` — the class all models inherit from to become DB tables
- `get_db()` — a function FastAPI calls to hand a session to each route, then close it after

### `core/config.py`
Holds all app settings (DB URL, secret key, token expiry, allowed origins). Values come from a `.env` file in production — so secrets never live in code. Everything imports the single `settings` object.

### `core/security.py`
Two jobs:
- **Passwords** — hashes them with bcrypt before storing (one-way, can't be reversed). Verifies a guess against the hash on login.
- **JWT tokens** — creates a signed token containing the user's ID on login. Verifies and decodes that token on every subsequent request.

### `deps.py`
Reusable logic that routes need before they can run:
- `get_current_user` — reads the token from the request header, decodes it, returns the logged-in `User`
- `get_event_or_404` — fetches an event, confirms it belongs to the current user, or returns 404

Routes declare these as dependencies and FastAPI injects them automatically.

### `models/`
Python classes that map to database tables. Each class = one table, each attribute = one column. Relationships (`user.events`, `event.guests`) are Python shortcuts to navigate between tables without writing manual queries.

| File | Table | Purpose |
|------|-------|---------|
| `user.py` | `users` | Account (email, hashed password) |
| `event.py` | `events` | A wedding/event owned by a user |
| `guest.py` | `guests` | A guest with RSVP status and seating |
| `task.py` | `tasks` | A to-do item on the event checklist |
| `vendor.py` | `vendors` | A vendor with price and booking status |

### `schemas/`
Pydantic classes that define what the API accepts and returns — separate from models because the DB and the API don't need to expose the same fields (e.g. `password_hash` is in the model but never in a response).

Each resource has three schemas:
- `Create` — fields the client sends to create something
- `Update` — same fields but all optional (for partial edits)
- `Out` — what the API returns (includes `id`, `created_at`, etc.)

Pydantic validates incoming data automatically. Wrong type or missing required field → `422` error before your code even runs.

### `routers/`
One file per resource. Each file groups the CRUD routes for that resource (`GET`, `POST`, `PATCH`, `DELETE`). Registered in `main.py` with a URL prefix (`/events`, `/guests`, etc.).

### `main.py`
The app entry point. Creates the FastAPI app, adds CORS middleware (allows the frontend to call the API), and registers all routers. Also runs schema migrations on startup (adding columns that were added after the initial DB was created).

---

## Auth Flow (JWT)

1. User logs in → server verifies password → issues a signed JWT token
2. Frontend stores the token and sends it in every request header
3. Server decodes the token on every request to identify the user
4. No sessions stored on the server — the token is self-contained

---

## A Request, Step by Step

`PATCH /events/5  {"title": "New Title"}`

1. FastAPI matches the URL to `update_event()`
2. Dependencies run: open DB session → decode JWT → fetch current user
3. Request body validated against `EventUpdate` schema
4. Route function runs: fetch event, check ownership, apply changes, save
5. Return value serialized through `EventOut` schema → JSON response
6. DB session closed

---

## Key Concepts at a Glance

| Concept | What it is |
|---------|-----------|
| SQLAlchemy model | Python class = database table |
| Pydantic schema | Validates what goes in/out of the API |
| `Depends()` | FastAPI injects a dependency into a route automatically |
| JWT | Signed token proving who you are — no server-side session needed |
| bcrypt | One-way password hash — intentionally slow to resist brute force |
| `cascade` | Deleting a parent (event) auto-deletes its children (guests, tasks, vendors) |
| `exclude_unset` | On PATCH, only update fields the client actually sent |
| `from_attributes` | Lets Pydantic read SQLAlchemy objects (not just dicts) |
