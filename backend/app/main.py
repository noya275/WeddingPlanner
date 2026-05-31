"""Entry point for the Wedding Planner FastAPI application: creates the app, configures CORS, and registers all routers."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .core.config import settings
from .routers import auth, events, guests, tasks, vendors, public

Base.metadata.create_all(bind=engine)

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
