# Project Structure

Full-stack wedding planning app. React + TypeScript frontend (Vercel), FastAPI + Python backend (Render), PostgreSQL database (Supabase).

---

## Root

| File | Purpose |
|------|---------|
| `README.md` | Setup instructions, how to run locally, deployment info |
| `start.sh` | One-liner to start both backend and frontend locally |
| `.gitignore` | Tells git which files to ignore (node_modules, .env, dist, etc.) |
| `render.yaml` | Render deployment config — tells Render how to build and run the backend |

---

## Backend (`backend/`)

Python API built with FastAPI. Receives HTTP requests from the frontend, talks to the database, and returns JSON.

### Entry & Config

| File | Purpose |
|------|---------|
| `app/main.py` | App entry point — creates the FastAPI instance, registers all routers, adds CORS middleware, and runs `create_all` to initialise the database schema |
| `app/database.py` | SQLAlchemy engine and session factory; `get_db` dependency yields a DB session per request |
| `app/deps.py` | Shared FastAPI dependencies: `get_current_user` (decodes JWT → user), `get_event_or_404` (checks event ownership) |
| `app/core/config.py` | Reads environment variables (DATABASE_URL, SECRET_KEY, etc.) into a typed `Settings` object |
| `app/core/security.py` | Password hashing (bcrypt), JWT creation and decoding |
| `backend/.env` | Local environment variables — never committed to git |
| `backend/.env.example` | Template showing which env vars are required |
| `backend/Dockerfile` | Docker image definition used by Render to build and run the backend |

### Models (`app/models/`)

SQLAlchemy ORM classes. Each file defines a database table.

| File | Table | Purpose |
|------|-------|---------|
| `user.py` | `users` | Registered user accounts; stores hashed password |
| `event.py` | `events` | A wedding event owned by a user; has title, date, venue, budget |
| `guest.py` | `guests` | A guest on the invite list; tracks RSVP status, table, dietary info, RSVP token |
| `task.py` | `tasks` | A to-do item for an event; has a status (todo / in_progress / done) |
| `vendor.py` | `vendors` | A service provider (photographer, caterer, etc.); tracks cost, payment status, sort order |

### Schemas (`app/schemas/`)

Pydantic models that validate request/response data. Separate from ORM models — these define the shape of JSON in/out.

| File | Purpose |
|------|---------|
| `user.py` | `UserCreate` (register input), `UserOut` (public profile), `Token` (JWT response) |
| `event.py` | `EventCreate`, `EventUpdate`, `EventOut` |
| `guest.py` | `GuestCreate`, `GuestUpdate`, `GuestOut`, `RSVPUpdate` |
| `task.py` | `TaskCreate`, `TaskUpdate`, `TaskOut` |
| `vendor.py` | `VendorCreate`, `VendorUpdate`, `VendorOut` |

### Routers (`app/routers/`)

Each file is a group of related API endpoints. All routes are prefixed with `/events/{event_id}/...` except auth.

| File | Prefix | Endpoints |
|------|--------|-----------|
| `auth.py` | `/auth` | `POST /register`, `POST /login`, `GET /me` |
| `events.py` | `/events` | CRUD for events; also seeds default vendor rows on creation |
| `guests.py` | `/events/{id}/guests` | CRUD for guests + RSVP token generation |
| `tasks.py` | `/events/{id}/tasks` | CRUD for tasks |
| `vendors.py` | `/events/{id}/vendors` | CRUD for vendors |
| `public.py` | `/rsvp` | Public (no auth) endpoints for guest RSVP via token link |

---

## Frontend (`frontend/`)

React + TypeScript SPA built with Vite. All UI lives here.

### Config Files

| File | Purpose |
|------|---------|
| `package.json` | Lists all JS dependencies and defines npm scripts (`dev`, `build`) |
| `package-lock.json` | Locks exact dependency versions so installs are reproducible |
| `vite.config.ts` | Vite build config; sets up the `/api` proxy to the backend in dev |
| `tsconfig.json` | TypeScript compiler settings |
| `tailwind.config.js` | Tailwind CSS config; defines the custom `burgundy` colour palette |
| `postcss.config.js` | PostCSS config required by Tailwind |
| `index.html` | The single HTML file; Vite injects the bundled JS/CSS here |
| `.env.production` | Sets `VITE_API_URL` to the Render backend URL for production builds |

### Source (`src/`)

| File | Purpose |
|------|---------|
| `main.tsx` | App entry point — mounts the React app into `index.html` |
| `App.tsx` | Root component — sets up React Router routes and the `PrivateRoute` auth guard |
| `index.css` | Global styles and Tailwind directives |
| `vite-env.d.ts` | TypeScript types for Vite's `import.meta.env` |

### API (`src/api/`)

| File | Purpose |
|------|---------|
| `client.ts` | Axios instance with base URL, JWT auth header injection, and a 401 interceptor that clears the token and redirects to `/login` |
| `types.ts` | Shared TypeScript interfaces for all data models: `User`, `Event`, `Guest`, `Task`, `Vendor`, `RSVPInfo` |

### Components (`src/components/`)

Reusable UI building blocks used across multiple pages.

| File | Purpose |
|------|---------|
| `Layout.tsx` | Top-level shell with the sidebar navigation (logo, nav links, logout button); wraps all authenticated pages |
| `EventLayout.tsx` | Secondary nav for an event's sub-pages (Guests, Tasks, Vendors, Seating); wraps all event-specific pages |
| `EditableCell.tsx` | Displays a value as text; click to switch to an inline input that saves on Enter/blur and cancels on Escape. Used heavily in the vendor and guest tables |

### Pages (`src/pages/`)

Each file is a full page rendered at a specific URL route.

| File | Route | Purpose |
|------|-------|---------|
| `Login.tsx` | `/login` | Email + password login form with "Remember me" toggle |
| `Register.tsx` | `/register` | New account creation form; redirects to login on success |
| `Dashboard.tsx` | `/` | Lists all of the user's events; create / rename / delete events |
| `GuestList.tsx` | `/events/:id/guests` | Full guest management table — add/edit/delete guests, set RSVP status, side, table, dietary info, send RSVP links |
| `Tasks.tsx` | `/events/:id/tasks` | Kanban board with three columns (To Do / In Progress / Done); add tasks, edit inline, move between columns |
| `Vendors.tsx` | `/events/:id/vendors` | Vendor table grouped by category with drag-and-drop reordering, cost tracking, paid/unpaid toggle, and budget overview |
| `SeatingChart.tsx` | `/events/:id/seating` | Visual seating chart — drag guests onto tables, configure table count and capacity |
| `RSVP.tsx` | `/rsvp/:token` | Public page (no login required) — guests open this from their invite link to confirm/decline attendance |

### Public Assets (`public/`)

| File | Purpose |
|------|---------|
| `WedBG.png` | Background photo used on the Login and Register pages |
| `favicon.ico` | Browser tab icon |
