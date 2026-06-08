# Wedding Planner — Claude Instructions

## Stack
- **Backend**: FastAPI + SQLAlchemy + SQLite, runs on port 8000
- **Frontend**: React + Vite + TypeScript + Tailwind, runs on port 5173
- **Auth**: JWT tokens via OAuth2PasswordBearer

## Project Structure
```
WeddingPlanner/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # SQLAlchemy engine + get_db
│   │   ├── deps.py          # Auth dependency (get_current_user)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # One file per domain (auth, events, guests, tasks, vendors)
│   │   └── core/            # JWT / security
│   └── tests/               # pytest test suite
├── frontend/
│   ├── src/
│   │   ├── pages/           # One component per page
│   │   ├── components/      # Shared components (EditableCell, Layout, EventLayout)
│   │   └── api/             # Axios client
│   └── tests/               # Vitest test suite
└── .claude/
    └── skills/test/         # /test skill for running tests
```

## How to Run
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

## Git Rules
- Never use `git add .` — always stage files explicitly by name
- Commit after each meaningful unit of work with a concise descriptive message
- Always push after committing so there is a remote backup

## Code Conventions
- No hardcoded fallback logic or placeholder data — surface real failures
- Prefer data/label-driven code over hardcoded sections
- No comments unless the WHY is non-obvious
- No verbose docstrings

## Formatting
Prettier (frontend) and Black + Ruff (backend) are hooked to run automatically after every file edit via PostToolUse hooks. Do not add manual format calls.

## Tests
- Backend: `cd backend && source venv/bin/activate && pytest -v` — uses in-memory SQLite, no disk files
- Frontend: `cd frontend && npx vitest run`
- Or use the `/test` skill for both

## Structure Rules
If a requested folder/file layout cannot be followed due to a real technical constraint, stop and explain the constraint before deviating — do not silently substitute an alternative structure.

## Verify Before Asserting
Before claiming a file, config, or directory does not exist, read the filesystem first.
