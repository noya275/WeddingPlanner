# Testing Guide

## Structure

```
WeddingPlanner/
  backend/
    pytest.ini             # tells pytest to look in tests/
    tests/
      conftest.py          # shared fixtures — cannot be renamed, required by pytest
      test_auth.py         # /auth routes
      test_events.py       # /events routes
      test_guests.py       # /events/{id}/guests routes
      test_tasks.py        # /events/{id}/tasks routes
      test_vendors.py      # /events/{id}/vendors routes
  frontend/
    test-setup.ts          # vitest global setup (extends jest-dom matchers)
    tests/
      utils.tsx            # renderWithProviders helper
      EditableCell.test.tsx
      Dashboard.test.tsx
```

---

## Backend (FastAPI + pytest)

### Dependencies

```bash
cd backend
source venv/bin/activate
pip install pytest httpx
```

### Run

```bash
cd backend
source venv/bin/activate
pytest -v
```

### How it works

- Uses an **in-memory SQLite** database (`sqlite:///:memory:` with `StaticPool`) — no files written to disk, fresh schema per test.
- `conftest.py` provides three fixtures available to all test files:
  - `client` — unauthenticated `TestClient` with the real FastAPI app wired to the test DB
  - `auth_client` — same client, pre-registered and logged in with a Bearer token
  - `event_id` — creates an event under the auth user and returns its id

### `backend/tests/conftest.py`

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(fresh_db):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    client.post("/auth/register", json={"email": "test@test.com", "name": "Test", "password": "pass123"})
    res = client.post("/auth/login", data={"username": "test@test.com", "password": "pass123"})
    token = res.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture
def event_id(auth_client):
    res = auth_client.post("/events/", json={"title": "My Wedding", "date": "2026-09-01"})
    return res.json()["id"]
```

---

## Frontend (Vite + Vitest + React Testing Library)

### Dependencies

```bash
cd frontend
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

### Run

```bash
cd frontend
npm test            # watch mode
npm run test:ui     # browser UI
```

### How it works

- Vitest is configured in `frontend/vite.config.ts` with `globals: true` — so `test`, `expect`, `vi`, etc. are available without importing them.
- `test-setup.ts` runs before every suite and extends `expect` with DOM matchers like `toBeInTheDocument()` and `toHaveValue()`.
- `tests/utils.tsx` exports `renderWithProviders` which wraps any component with React Query and React Router — required for components that use `useQuery` or `useNavigate`.
- The axios `api` client is fully mocked in Dashboard tests — no real HTTP requests are made.
- TypeScript knows about the Vitest globals via `"types": ["vitest/globals"]` in `tsconfig.json`.

### `frontend/test-setup.ts`

```ts
import "@testing-library/jest-dom";
```

### `frontend/tests/utils.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}
```

---

## What to test vs. skip

| Worth testing | Skip |
|---|---|
| Auth flows (register, login, bad creds) | CSS/styling |
| CRUD for guests, tasks, vendors | Drag-and-drop internals |
| Cross-user access denied (404) | Third-party component behaviour |
| RSVP token auto-generation | Vite/build config |
| EditableCell save/cancel/Escape logic | TanStack Query internals |
| Dashboard loading, empty, and delete states | |
