---
description: Launch the Wedding Planner app (FastAPI backend + React/Vite frontend)
---

# Run the Wedding Planner app

Two servers must be started: the FastAPI backend on port 8000 and the Vite frontend on port 5173.

## 1. Backend (FastAPI + uvicorn)

```bash
cd /Users/noya/Downloads/Personal/Personal\ Projects/WeddingPlanner/backend

# Create venv if it doesn't exist, then activate and install deps
source venv/bin/activate 2>/dev/null || (python -m venv venv && source venv/bin/activate)
pip install -r requirements.txt -q

# Start in background with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &> /tmp/backend.log &
echo "Backend PID: $!"
```

Verify it's up:
```bash
sleep 2 && curl -s http://localhost:8000/docs | head -3
```

## 2. Frontend (React + Vite)

```bash
cd /Users/noya/Downloads/Personal/Personal\ Projects/WeddingPlanner/frontend
npm run dev -- --host &> /tmp/frontend.log &
echo "Frontend PID: $!"
```

Verify it's up:
```bash
sleep 4 && cat /tmp/frontend.log
```

## Access

- **App**: http://localhost:5173
- **API docs**: http://localhost:8000/docs

## Logs

- Backend: `/tmp/backend.log`
- Frontend: `/tmp/frontend.log`

## Notes

- The SQLite database is at `backend/wedding_planner.db` — it persists between runs.
- The venv is at `backend/venv/` — only needs to be created once.
- CORS is configured for `http://localhost:5173` only.
