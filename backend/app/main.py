from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth, events, guests, tasks, vendors, budget, public
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# SQLite-only column migrations (skipped on PostgreSQL where create_all handles it)
from .core.config import settings as _s
with engine.connect() as _conn:
    for _stmt in [
        "ALTER TABLE guests ADD COLUMN side VARCHAR",
    ]:
        try:
            _conn.execute(text(_stmt))
            _conn.commit()
        except Exception:
            pass

if _s.DATABASE_URL.startswith("sqlite"):
    with engine.connect() as _conn:
        for _stmt in [
            "ALTER TABLE events ADD COLUMN budget_total NUMERIC(12,2)",
            "ALTER TABLE guests ADD COLUMN rsvp_token VARCHAR",
            "ALTER TABLE guests ADD COLUMN rsvp_sent BOOLEAN DEFAULT 0",
        ]:
            try:
                _conn.execute(text(_stmt))
                _conn.commit()
            except Exception:
                pass

app = FastAPI(title="Wedding Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(guests.router)
app.include_router(tasks.router)
app.include_router(vendors.router)
app.include_router(budget.router)
app.include_router(public.router)
