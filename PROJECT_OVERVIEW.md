# Wedding Planner — Full Project Overview

## The Big Picture

The app has 3 parts that talk to each other:

```
Browser (React) ←→ Backend (FastAPI) ←→ Database (PostgreSQL on Supabase)
```

- The **browser** shows the UI and lets users click things
- The **backend** handles logic and data
- The **database** stores everything permanently

---

## Frontend (React + TypeScript + Vite)

### React
A JavaScript library for building UIs. Instead of writing HTML directly, you write **components** — reusable building blocks. `Dashboard.tsx`, `Vendors.tsx`, `GuestList.tsx` are each a component (a page in the app).

React automatically updates the page when data changes — you don't manually touch the HTML.

### TypeScript
JavaScript but with **types**. Instead of just `let name = "noya"` you write `let name: string = "noya"`. This catches bugs before you even run the code. All `.tsx` files are TypeScript.

### Vite
The dev server that runs the React app locally on `localhost:5173`. In production (Vercel), it compiles everything into plain static files that the browser can read.

### Tailwind CSS
Instead of writing a separate CSS file, you style directly in the HTML with class names like `className="text-red-500 font-bold px-4"`. All the class names in the components are Tailwind.

### React Query (`@tanstack/react-query`)
Handles fetching data from the backend. It automatically:
- Fetches when the page loads
- Caches results
- Refetches every 5 seconds (`refetchInterval: 5000`)
- Updates the UI when data changes

### React Router
Handles navigation between pages without reloading. The URLs like `/events/2/vendors` are managed by React Router — it decides which component to show based on the URL.

### Axios (`api/client.ts`)
The library that actually makes HTTP requests to the backend. When you see `api.get('/events/')` or `api.post('/vendors')` — that's Axios sending a request to FastAPI.

---

## Backend (FastAPI + Python)

### FastAPI
A Python framework for building APIs. It receives requests from the frontend and sends back data as JSON. For example:
- Frontend asks `GET /events/` → FastAPI returns a list of events
- Frontend sends `POST /vendors` → FastAPI saves the new vendor

### Uvicorn
The server that **runs** FastAPI, like how Vite runs React. FastAPI is just code — uvicorn is what actually listens on `localhost:8000` and handles incoming requests.

### SQLAlchemy
Python library for talking to the database. Instead of writing raw SQL like `SELECT * FROM vendors`, you write Python: `db.query(Vendor).filter(...)`. It translates Python into SQL automatically.

### Pydantic (schemas)
Validates data coming into the API. When the frontend sends a new vendor, Pydantic checks it has the right fields and types before it touches the database. That's what `VendorCreate`, `VendorUpdate` in `schemas/vendor.py` are.

### JWT (JSON Web Tokens)
How login works. When you log in, the backend generates a token (a long encrypted string). The frontend stores it and sends it with every request to prove who you are. That's the `Authorization: Bearer ...` header you'd see in the network tab.

---

## Database

### SQL vs PostgreSQL vs Supabase — what's the difference?

- **SQL** is not a database — it's a **language**. The syntax you use to talk to a database:
  ```sql
  SELECT * FROM vendors WHERE event_id = 2
  ```
- **SQLite** is a database stored in a single file. No server needed. Great for local development, bad for production (data can be wiped if the server restarts).
- **PostgreSQL** is a full database server. Handles many users at once, reliable, used in production.
- **Supabase** is not a database itself — it's a cloud service that **hosts PostgreSQL** for you and gives you a nice dashboard.

### Local vs Production

| | Local (your laptop) | Production (Render server) |
|---|---|---|
| Database | SQLite file (`wedding_planner.db`) | PostgreSQL on Supabase |
| Set in | `backend/.env` | Render dashboard (environment variable) |

The switch is just one line — the `DATABASE_URL`:
- Local: `sqlite:///./wedding_planner.db`
- Production: `postgresql://...supabase.co/postgres`

SQLAlchemy handles both transparently. No code changes needed.

### How the app talks to Supabase

Through the `DATABASE_URL`. When the app starts on Render, SQLAlchemy reads it:

```python
engine = create_engine(settings.DATABASE_URL)
```

From that point, all database calls go over the internet to Supabase. Your Python code doesn't change at all — SQLAlchemy generates the right SQL and sends it to whichever database is on the other end.

```
Browser → Render (FastAPI) → Supabase (PostgreSQL)
           reads DATABASE_URL
           from environment variable
```

Your laptop never talks to Supabase directly — only the Render server does.

### Tables in the database

| Table | What it stores |
|---|---|
| `users` | Accounts (email, hashed password) |
| `events` | Weddings |
| `guests` | Guest list per event |
| `vendors` | Vendors per event (with `sort_order`, `vendor_name`, etc.) |
| `tasks` | To-do items per event |

---

## How a request flows end to end

Example: you open the Vendors page.

**1. React Router sees `/events/2/vendors`, renders `Vendors.tsx`**

Your app is one single HTML page. React Router watches the URL in the browser — when it sees `/events/2/vendors` it knows "show the Vendors page" and puts `Vendors.tsx` on screen. No page reload, just swapping what's visible.

**2. React Query runs `api.get('/events/2/vendors')`**

React Query is like a manager that says "this component needs data — go fetch it." It triggers the fetch automatically when the page loads. You don't have to manually say "fetch now."

**3. Axios sends an HTTP GET to `localhost:8000/events/2/vendors`**

**HTTP** is the protocol browsers use to request things from servers — the same way your browser fetches a webpage, your app fetches data. There are different types of HTTP requests:
- `GET` — "give me data"
- `POST` — "save new data"
- `PATCH` — "update existing data"
- `DELETE` — "delete data"

**Axios** is the library that actually sends this request. Think of it as the messenger that carries the request from the frontend to the backend.

**4. FastAPI receives it, checks your JWT token, runs the handler in `routers/vendors.py`**

The backend receives the request. First it checks the JWT token (proves you're logged in). Then it runs the matching function in `routers/vendors.py` — the function that's registered for `GET /events/{event_id}/vendors`.

**5. SQLAlchemy runs `SELECT * FROM vendors WHERE event_id=2 ORDER BY sort_order`**

That function tells SQLAlchemy "get all vendors for event 2, sorted by sort_order." SQLAlchemy translates that into SQL and sends it to the database. The database finds the matching rows and returns them.

**6. FastAPI returns JSON: `[{id: 2, name: "DJ", ...}]`**

**JSON** is just a text format for sending data — looks like a Python dictionary. It's the universal language between frontend and backend. FastAPI takes the database rows and converts them to JSON to send back over HTTP:
```json
[
  { "id": 2, "name": "DJ", "category": "Must-Have Vendors" },
  { "id": 3, "name": "Photographer", "category": "Must-Have Vendors" }
]
```

**7. React Query stores it, passes it to the component**

React Query receives the JSON response, stores it in memory (cache), and gives it to `Vendors.tsx` as a variable called `vendors`. It also sets a timer to re-fetch every 5 seconds to keep the data fresh.

**8. React renders the table**

`Vendors.tsx` now has the data. React loops through the `vendors` array and draws a table row for each one on screen. If the data changes (someone adds a vendor), React automatically redraws only the parts that changed — not the whole page.

---

**The full picture in one line:**
> URL changes → fetch data from backend → backend reads database → sends back JSON → frontend draws it on screen

---

## Deployment

| Part | Service | How |
|---|---|---|
| Frontend | Vercel | Auto-deploys from GitHub `main` branch |
| Backend | Render | Auto-deploys from GitHub `main` branch |
| Database | Supabase (PostgreSQL) | Always on, independent of Render |

Every time you push to GitHub → Vercel and Render automatically rebuild and redeploy.

The Cloudflare tunnel in `start.sh` is only for sharing your **local** version temporarily — it gives a random public URL that dies when you close the terminal. It has nothing to do with the deployed production app.

---

## Running locally

```bash
./start.sh
```

This starts:
1. **Backend** — uvicorn on `localhost:8000`
2. **Frontend** — Vite on `localhost:5173`
3. **Cloudflare tunnel** — temporary public URL (copied to clipboard)

If you only start one:
- **Backend only** → API works but no UI, useless for normal use
- **Frontend only** → UI loads but every action fails, no data

---

## File structure

```
WeddingPlanner/
├── frontend/
│   └── src/
│       ├── pages/          ← one file per page (Dashboard, Vendors, etc.)
│       ├── components/     ← reusable UI pieces (Layout, EditableCell)
│       ├── api/
│       │   ├── client.ts   ← Axios setup
│       │   └── types.ts    ← TypeScript types (Vendor, Guest, Event...)
│       └── App.tsx         ← routing setup
└── backend/
    └── app/
        ├── models/         ← database table definitions (SQLAlchemy)
        ├── schemas/        ← request/response validation (Pydantic)
        ├── routers/        ← API endpoints (one file per feature)
        ├── database.py     ← database connection
        └── main.py         ← app entry point, ties everything together
```

---

## Docker — what it is and why it's not used here

Docker packs your app together with everything it needs (Python version, libraries, config) into a sealed box called a **container** so it runs identically anywhere. Render does this for you automatically, so Docker is unnecessary here.

### Docker files in this project (all unused)

- `backend/Dockerfile` — recipe for building the backend container
- `frontend/Dockerfile` — recipe for building the frontend container
- `docker-compose.yml` — starts all containers (frontend, backend, database) together with one command: `docker-compose up`

### Dockerfile vs docker-compose

- **Dockerfile** = recipe for one service
- **docker-compose.yml** = runs all services together and connects them

---

## Redundant files (can be ignored)

- `fly.toml` — for Fly.io deployment, never used
- `docker-compose.yml` — for Docker, never used
- `backend/Dockerfile`, `frontend/Dockerfile` — never used (see Docker section above)
