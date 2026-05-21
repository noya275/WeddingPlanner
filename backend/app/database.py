"""Database engine, session factory, and declarative base shared across the app."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .core.config import settings

# SQLite requires this flag because FastAPI serves concurrent requests across threads.
_kwargs = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=_kwargs)

# Factory that produces Sessions; autocommit/autoflush off so we control transaction boundaries.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All model classes inherit from Base so SQLAlchemy knows they map to tables.
Base = declarative_base()


def get_db():
    """FastAPI dependency: open a DB session, yield it to the route, always close it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
