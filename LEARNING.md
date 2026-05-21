# Web App Learning Notes
### Project: Wedding Planner (FastAPI + React + TypeScript)

---

## Table of Contents
1. [The Big Picture](#1-the-big-picture)
2. [database.py — Line by Line](#2-databasepy--line-by-line)
3. [Models — SQLAlchemy](#3-models--sqlalchemy)
4. [Schemas — Pydantic](#4-schemas--pydantic)
5. [Dependencies — deps.py](#5-dependencies--depspy)
6. [Routers — FastAPI Routes](#6-routers--fastapi-routes)
7. [Auth — JWT Security](#7-auth--jwt-security)
8. [How a Real Request Flows](#8-how-a-real-request-flows)

---

## 1. The Big Picture

A web app has three layers:

```
Browser (React / TypeScript)
        ↕  HTTP requests (JSON)
Server (FastAPI / Python)
        ↕  SQL queries
Database (SQLite locally / PostgreSQL in production)
```

- **Frontend (React)** — what the user sees. Runs entirely in the browser.
- **Backend (FastAPI)** — the brain. Handles logic, authentication, and data.
- **Database** — stores everything permanently.

They never touch each other directly.
The frontend and backend only communicate through **HTTP requests**.

### HTTP — the protocol

HTTP is the protocol the browser and server use to talk. Every request has a **verb** (what to do) and a **URL** (where to do it):

| Verb     | Meaning          | Example                  |
|----------|------------------|--------------------------|
| `GET`    | Read data        | `GET /events/` → list all events |
| `POST`   | Create new data  | `POST /events/` → create event |
| `PATCH`  | Update partially | `PATCH /events/5` → edit event #5 |
| `DELETE` | Delete data      | `DELETE /events/5` → delete event #5 |

### REST — a convention on top of HTTP

REST is a *convention* on top of HTTP. The rule: URLs are **nouns** (resources), verbs are **actions**.

- ✅ `DELETE /events/5` — noun + verb, REST style
- ❌ `POST /deleteEvent` — action in the URL, not REST

REST also says requests are **stateless** — the server remembers nothing between requests. Every request must carry all the info it needs (e.g. the auth token).

Your API follows REST conventions, which is why it's called a **REST API**.

---

## 2. `database.py` — Line by Line

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .core.config import settings
```

### Imports

**`sqlalchemy`** — a Python library that lets you talk to a database using Python objects instead of raw SQL.
- Without SQLAlchemy: `cursor.execute("SELECT * FROM events WHERE user_id = 1")`
- With SQLAlchemy: `db.query(Event).filter(Event.user_id == 1).all()`

**`create_engine`** — a function that creates the "connection point" to your database. Call it once at startup.
> ⚠️ Required name — it's the actual function name in the SQLAlchemy library.

**`declarative_base`** — returns a base class. Any Python class that inherits from it becomes a database table.
> ⚠️ Required name.

**`sessionmaker`** — returns a *factory* (a class that creates sessions). A session is one "conversation" with the database.
> ⚠️ Required name.

**`from .core.config import settings`**
- The `.` means "current package" — look inside `backend/app/`
- `settings` is an instance of the `Settings` class from `config.py`. It holds all config values like `DATABASE_URL`, `SECRET_KEY`.
- > 💡 `settings` is an **arbitrary name** (convention). You could call it `config` or `env`.

---

```python
_kwargs = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
```

**`_kwargs`** — arbitrary name. The `_` prefix is a Python convention meaning "internal/private, not meant to be used outside this file."

**`{"check_same_thread": False}`** — a SQLite-specific fix.
- SQLite was designed for single-thread use
- FastAPI handles requests across multiple threads concurrently
- Without this, SQLite would crash when two requests hit at the same time
- Setting it to `False` tells SQLite "trust me, I'll handle thread safety"

**Why only for SQLite?** PostgreSQL handles multiple threads natively, so it doesn't need this.

**Python ternary expression:**
```python
x = A if condition else B
# Same as:
if condition:
    x = A
else:
    x = B
```

---

```python
engine = create_engine(settings.DATABASE_URL, connect_args=_kwargs)
```

**`engine`** — arbitrary name, but an extremely strong convention. Almost every SQLAlchemy project calls it `engine`.
It's the core object that knows *how* and *where* to connect to your database.

**`settings.DATABASE_URL`** — a connection string. Format: `dialect://user:password@host:port/database`
- SQLite (local file): `"sqlite:///./wedding_planner.db"`
- PostgreSQL (production): `"postgresql://user:password@host:5432/dbname"`

**`connect_args=_kwargs`** — passes extra options to the database driver.
> ⚠️ `connect_args` is the actual parameter name in `create_engine` — required.

---

```python
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

**`SessionLocal`** — arbitrary name, but a very strong convention in FastAPI projects.
Capital letters hint it's a class/factory, not a plain variable.
It is NOT a session — it's a **factory that produces sessions** when called: `SessionLocal()`.

**`autocommit=False`** — don't automatically save changes to the database.
You must explicitly call `db.commit()`. This is intentional — if something goes wrong mid-request, nothing gets accidentally saved.

**`autoflush=False`** — don't automatically send pending SQL before each query. You control timing.

**`bind=engine`** — tells the factory which database to use when creating sessions.
> ⚠️ `autocommit`, `autoflush`, `bind` are required parameter names of `sessionmaker`.

---

```python
Base = declarative_base()
```

**`Base`** — arbitrary name (capital letter by convention, since it's a class).
`declarative_base()` creates an empty base class — no tables yet.
Any class that *inherits* from `Base` will be treated as a database table.

```python
class Event(Base):   # ← this means "Event is a database table"
    ...
```

Think of `Base` as the blueprint factory. Models are blueprints that inherit from it.

---

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**`get_db`** — arbitrary name, but a universal convention in FastAPI. Almost every project calls this `get_db`.

**`db = SessionLocal()`** — creates a new session by calling the factory.
`db` is an arbitrary name (convention). Could be `session`, `conn`, etc.

**`try / finally`** — guarantees the session is always closed, even if an error happens.
`finally` runs no matter what — success or exception.

**`yield db`** — the unusual part. `yield` makes this a *generator function*.

The difference between `return` and `yield`:
- `return db` → gives the session and immediately moves on. No cleanup possible.
- `yield db` → pauses here, hands the session out, waits. When the caller is done, resumes — and `finally` runs to close the session.

**Why does FastAPI use generators for dependencies?**
FastAPI's `Depends()` system is built around this pattern. When you write `db: Session = Depends(get_db)` in a route:
1. FastAPI calls `get_db()`
2. Gets the session from the `yield`
3. Runs your route function with the session
4. After the route finishes, resumes `get_db()` after the `yield`
5. `finally` closes the session

This is called the **setup → use → teardown** pattern. `yield` is what makes teardown possible.

### Full file in plain English:
> "Connect to the database specified in config. If it's SQLite, make it thread-safe. Create a session factory. Create the base class that all models will inherit from. Define a function that opens a session, hands it to whoever needs it, and closes it when they're done."

---

## 3. `config.py` — Settings & Environment Variables

```python
from pydantic_settings import BaseSettings
```

**`pydantic_settings`** — a separate package (not included in plain Pydantic). It extends Pydantic to load values from environment variables and `.env` files, not just from Python code.

> ⚠️ Required name — it's the actual package name.

---

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./wedding_planner.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALLOWED_ORIGINS: list[str] = ["*"]
```

**`Settings`** — arbitrary name (a very strong convention though). This is just a regular Python class that inherits from `BaseSettings`.

**`BaseSettings`** — required name. The magic base class that makes this work: any class that inherits from it automatically reads matching environment variables. If you define `DATABASE_URL: str = "..."`, Pydantic will check if a `DATABASE_URL` env var exists and use it; if not, it falls back to your default.

**Each field** — arbitrary names (they're yours). The types (`str`, `int`, `list[str]`) and defaults are defined here. The defaults are what's used when running locally without a `.env` file.

**`"HS256"`** — a specific algorithm name for JWT signing. Not arbitrary — this string must match what the JWT library expects.

**`60 * 24 * 7`** — Python evaluates this at parse time. It equals 10080 (minutes in 7 days). Writing it this way is intentional — makes the intention readable.

**`["*"]`** — a wildcard: allow requests from *any* origin. Fine for development, dangerous in production (you'd list specific domains instead).

---

```python
    model_config = {"env_file": ".env"}
```

**`model_config`** — a special Pydantic V2 attribute name. Required name — Pydantic looks for exactly this. (In Pydantic V1 it was called `class Config`.)

**`{"env_file": ".env"}`** — tells Pydantic: "also look for a file called `.env` in the project root and load variables from it." A `.env` file looks like:
```
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=my-very-secret-key
```

When you deploy, you set real environment variables instead. The `.env` file is for local development only — it's in `.gitignore` so secrets never get committed to git.

---

```python
settings = Settings()
```

**`settings`** — arbitrary name (convention). This creates one instance of the `Settings` class at import time. All other files import this single object: `from .core.config import settings`. That way the config is read once, not every time a route runs.

### Full file in plain English:
> "Define all configuration values the app needs. Provide sensible defaults for local development. If environment variables (or a `.env` file) exist with the same names, use those instead. Export a single instance called `settings` for everyone to import."

---

## 4. Models — SQLAlchemy

A **model** is a Python class that represents a database table. Each class = one table. Each class attribute = one column.

All models inherit from `Base` (defined in `database.py`). That's how SQLAlchemy knows they're tables.

---

### `user.py`

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
```

**`Column`** — required name. The SQLAlchemy function that defines a table column.

**`Integer`, `String`, `DateTime`** — required names. SQLAlchemy column types. They map to SQL types (`INTEGER`, `VARCHAR`, `TIMESTAMP`).

**`relationship`** — required name. Tells SQLAlchemy how two models are connected. It does *not* create a column — it's a Python-level shortcut that lets you write `user.events` instead of a manual query.

**`func`** — required name. A SQLAlchemy object for calling SQL functions. Here used for `func.now()` — the SQL function that returns the current timestamp.

**`from ..database import Base`**
- `..` means "go up one level" — from `models/` up to `app/`
- Then import `Base` from `database.py`

---

```python
class User(Base):
    __tablename__ = "users"
```

**`User`** — arbitrary name (convention: singular, PascalCase).

**`__tablename__`** — required name (SQLAlchemy looks for exactly this). Its *value* (`"users"`) is arbitrary — it's what the table will be named in the database.

---

```python
    id = Column(Integer, primary_key=True, index=True)
```

**`id`** — arbitrary name (but `id` is the universal convention for a primary key).

**`primary_key=True`** — required parameter name. Marks this as the primary key: the unique identifier for each row. The database auto-increments it (1, 2, 3…).

**`index=True`** — required parameter name. Tells the database to build an index on this column, making lookups by `id` fast.

---

```python
    email = Column(String, unique=True, index=True, nullable=False)
```

**`unique=True`** — no two rows can have the same email. The database enforces this at the storage level.

**`nullable=False`** — this column cannot be empty. If you try to insert a row without an email, the database rejects it.

---

```python
    password_hash = Column(String, nullable=False)
```

**`password_hash`** — arbitrary name. The raw password is *never* stored. Only the hash (a one-way transformation). We'll cover this in the Auth section.

---

```python
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**`DateTime(timezone=True)`** — store timestamp with timezone info.

**`server_default=func.now()`** — the *database* fills this in automatically when a row is inserted. You never set it manually.

- `server_default` = required parameter name (the database sets it)
- vs `default` = Python sets it before sending to the database

---

```python
    events = relationship("Event", back_populates="owner", cascade="all, delete-orphan")
```

**`events`** — arbitrary name. Lets you write `user.events` to get all events belonging to that user. No column is created for this.

**`"Event"`** — the string name of the target model class. SQLAlchemy resolves it lazily (so import order doesn't matter).

**`back_populates="owner"`** — required parameter name. Tells SQLAlchemy this is a two-way link. The other side (on `Event`) has `back_populates="events"`. They mirror each other.

**`cascade="all, delete-orphan"`** — required parameter name, specific value string. When a `User` is deleted, automatically delete all their `Event` rows too. Without this, you'd have orphaned rows with no owner.

---

### `event.py`

Most concepts are the same as above. New things:

```python
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
```

**`ForeignKey("users.id")`** — required name. This is the actual column that stores the link. It holds an integer — the `id` of the user who owns this event. The string `"users.id"` is the table name + column name in the database.

> Note: `user_id` is the column (stores the integer). `owner` (the `relationship`) is the Python shortcut that loads the full `User` object.

```python
    budget_total = Column(Numeric(12, 2))
```

**`Numeric(12, 2)`** — stores decimal numbers precisely. `12` = total digits, `2` = digits after decimal. Used for money so floating-point errors don't occur.

---

### `guest.py` — adds two new concepts

```python
import enum
import secrets
```

**`enum`** — Python's built-in module for defining a fixed set of allowed values.

**`secrets`** — Python's built-in module for generating cryptographically secure random tokens.

---

```python
def _gen_token() -> str:
    return secrets.token_urlsafe(16)
```

**`_gen_token`** — arbitrary name. The `_` prefix signals "internal, don't import this elsewhere."

**`secrets.token_urlsafe(16)`** — generates a random 16-byte string, URL-safe encoded. Used as the RSVP link token — each guest gets a unique unguessable token.

---

```python
class RSVPStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"
    maybe = "maybe"
```

**`RSVPStatus`** — arbitrary name.

**`str, enum.Enum`** — inheriting from *both* makes this a string enum. Each value is both a string (`"confirmed"`) and an enum member (`RSVPStatus.confirmed`). The `str` part means it serializes naturally to/from JSON.

**Why use an enum?** The database only ever stores one of exactly these four strings. If you tried to save `"maybe_later"`, Python would raise an error before it ever hit the database.

---

```python
    rsvp_status = Column(Enum(RSVPStatus), default=RSVPStatus.pending)
```

**`Enum(RSVPStatus)`** — required name. SQLAlchemy column type that stores the enum in the database.

**`default=RSVPStatus.pending`** — Python sets this before insert (different from `server_default`, which the database sets). New guests start as "pending" automatically.

---

### Full section in plain English:
> "Models are Python classes that describe database tables. Each attribute is a column. SQLAlchemy reads them and creates/queries real SQL tables. `ForeignKey` links tables together at the column level; `relationship` is a Python convenience to navigate those links. Enums restrict a column to a fixed set of values."

---

## 5. Schemas — Pydantic

*(Coming next)*

---

## 4. Schemas — Pydantic

*(Coming next)*

---

## 5. Dependencies — `deps.py`

*(Coming next)*

---

## 6. Routers — FastAPI Routes

*(Coming next)*

---

## 7. Auth — JWT Security

*(Coming next)*

---

## 8. How a Real Request Flows

*(Coming next)*

---

## Key Naming Reference

| Name | Required or Convention? | Notes |
|------|------------------------|-------|
| `create_engine` | Required | SQLAlchemy function name |
| `declarative_base` | Required | SQLAlchemy function name |
| `sessionmaker` | Required | SQLAlchemy function name |
| `Base` | Convention | Could be `MyBase`, `DBBase`, etc. |
| `engine` | Convention | Almost universal in SQLAlchemy projects |
| `SessionLocal` | Convention | Common FastAPI pattern |
| `get_db` | Convention | Common FastAPI pattern |
| `db` | Arbitrary | Could be `session`, `conn`, etc. |
| `settings` | Arbitrary | Could be `config`, `env`, etc. |
| `_kwargs` | Arbitrary | `_` prefix = "private/internal" by convention |
| `autocommit` | Required | Parameter name of `sessionmaker` |
| `autoflush` | Required | Parameter name of `sessionmaker` |
| `bind` | Required | Parameter name of `sessionmaker` |
| `connect_args` | Required | Parameter name of `create_engine` |
| `Settings` | Convention | Name of the settings class; could be `Config`, `AppConfig`, etc. |
| `BaseSettings` | Required | Pydantic class that enables env-var loading |
| `model_config` | Required | Pydantic V2 attribute for class-level config |
| `__tablename__` | Required | SQLAlchemy looks for exactly this attribute |
| `Column` | Required | SQLAlchemy function to define a table column |
| `ForeignKey` | Required | SQLAlchemy type linking one table to another |
| `relationship` | Required | SQLAlchemy ORM navigation (not a real column) |
| `back_populates` | Required | Parameter linking two `relationship` declarations |
| `cascade` | Required | Parameter controlling what happens on delete |
| `primary_key` | Required | Parameter marking the row identifier column |
| `server_default` | Required | Database fills the value on insert |
| `default` | Required | Python fills the value before insert |
| `nullable` | Required | Parameter allowing/disallowing NULL values |
| `unique` | Required | Parameter enforcing uniqueness at DB level |
| `RSVPStatus` | Arbitrary | Could be `GuestStatus`, `InviteState`, etc. |
| `_gen_token` | Arbitrary | `_` prefix = "private/internal" |
