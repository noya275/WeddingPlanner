---
description: Run the Wedding Planner test suites (backend and/or frontend)
---

# Run tests

If the user specifies `backend`, run only the backend. If they specify `frontend`, run only the frontend. Otherwise run both.

## Backend (pytest)

```bash
cd /Users/noya/Downloads/Personal/Personal\ Projects/WeddingPlanner/backend
source venv/bin/activate
pytest -v
```

## Frontend (vitest)

```bash
cd /Users/noya/Downloads/Personal/Personal\ Projects/WeddingPlanner/frontend
npx vitest run
```

## Both

Run backend first, then frontend.

## Notes

- Backend uses an in-memory SQLite database — no files are created on disk.
- Frontend tests run once and exit (`vitest run`). For watch mode use `npm test`.
- All test files live in `backend/tests/` and `frontend/tests/`.
