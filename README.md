# Wedding Planner

A full-stack wedding planning app for managing guests, vendors, tasks, and seating.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS (deployed on Vercel)
- **Backend:** FastAPI + Python (deployed on Render)
- **Database:** SQLite locally, PostgreSQL (Supabase) in production

## First-time setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## Running locally

```bash
./start.sh
```

This starts the backend on `localhost:8000`, the frontend on `localhost:5173`, and a temporary Cloudflare tunnel (public URL copied to clipboard).

## Deployment

Pushing to the `main` branch on GitHub automatically deploys:
- Frontend → Vercel
- Backend → Render

Set `DATABASE_URL` and `SECRET_KEY` as environment variables in the Render dashboard.
