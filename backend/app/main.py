from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import Base, engine
from .core.config import settings
from .routers import auth, events, guests, tasks, vendors, public

# Columns added after initial schema — safe to run on every startup (errors are swallowed)
_MIGRATIONS = [
    "ALTER TABLE guests ADD COLUMN side VARCHAR",
    "ALTER TABLE vendors ADD COLUMN actual NUMERIC(10,2)",
    "ALTER TABLE vendors ADD COLUMN is_paid BOOLEAN DEFAULT FALSE",
    "ALTER TABLE events ADD COLUMN budget_total NUMERIC(12,2)",
    "ALTER TABLE guests ADD COLUMN rsvp_token VARCHAR",
    "ALTER TABLE guests ADD COLUMN rsvp_sent BOOLEAN DEFAULT 0",
]


def run_migrations() -> None:
    with engine.connect() as conn:
        for stmt in _MIGRATIONS:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass


Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="Wedding Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(guests.router)
app.include_router(tasks.router)
app.include_router(vendors.router)
app.include_router(public.router)
