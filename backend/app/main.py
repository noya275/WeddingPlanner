from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth, events, guests, tasks, vendors, budget

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wedding Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
