# Project Structure

This is a full-stack web application for planning weddings. It has two separate codebases that work together:
- **Frontend** (React + TypeScript): what the user sees and interacts with in the browser. Deployed on Vercel.
- **Backend** (Python + FastAPI): the server that stores data, enforces rules, and responds to the frontend's requests. Deployed on Render.
- **Database** (PostgreSQL via Supabase): where all the data lives permanently (users, events, guests, etc.).

When a user clicks "Add Guest", the frontend sends an HTTP request to the backend, the backend validates it, writes it to the database, and sends back the saved guest. The frontend then shows it on screen.

---

## Root

| File | Purpose |
|------|---------|
| `README.md` | Instructions for anyone who clones the project — how to install dependencies, run it locally, and deploy it |
| `start.sh` | A shell script that starts both the backend server and the frontend dev server with a single command |
| `.gitignore` | Tells git which files to never commit — things like `node_modules/` (too large), `.env` (contains secrets), `dist/` (generated output) |
| `render.yaml` | Configuration file that tells Render (the hosting platform) how to build and start the backend server |
| `STRUCTURE.md` | This file |

---

## Backend (`backend/`)

The backend is a Python web server. Its only job is to receive HTTP requests from the frontend, check if they're valid and allowed, read/write from the database, and return a JSON response. It never serves HTML — it's pure data.

### Entry & Config

| File | Purpose |
|------|---------|
| `app/main.py` | The starting point of the backend. Creates the FastAPI application, plugs in all the route groups (auth, events, guests, etc.), and configures CORS (which tells the server to accept requests from the frontend's domain). This is the file that runs when the server starts. |
| `app/database.py` | Sets up the connection to the database. Creates the SQLAlchemy "engine" (the connection), the "session" (a temporary workspace for reading/writing), and the "Base" class that all models inherit from. The `get_db` function is a FastAPI dependency that opens a session for each request and closes it when done. |
| `app/deps.py` | Contains two reusable functions that protect routes: `get_current_user` reads the JWT token from the request header, decodes it, and returns the logged-in user (or raises a 401 if invalid). `get_event_or_404` checks that the requested event exists AND belongs to the current user (or raises a 404). Every protected route uses these. |
| `app/core/config.py` | Reads environment variables (like `DATABASE_URL` and `SECRET_KEY`) from the `.env` file and exposes them as a typed Python object called `settings`. This means the rest of the app can do `settings.SECRET_KEY` instead of `os.environ.get(...)` everywhere. |
| `app/core/security.py` | Contains all the security logic: hashing passwords with bcrypt before storing them, verifying a plain password against a stored hash on login, creating JWTs (the tokens given to users after login), and decoding/validating JWTs on each request. A JWT (JSON Web Token) is a signed string the server gives the user after login. The frontend stores it in localStorage and sends it with every request. The server decodes it to know who the user is — no session or cookie needed. |
| `backend/.env` | A local-only file containing secret values: the database URL, the JWT secret key, etc. Never committed to git. Each developer has their own. Render has its own copy in the dashboard. |
| `backend/.env.example` | A safe template version of `.env` with placeholder values. Committed to git so new developers know what variables they need to set up. |
| `backend/Dockerfile` | Instructions for building a Docker container image of the backend. Render uses this to package and run the app in a consistent environment. |

### Models (`app/models/`)

Models define the shape of the database. Each model is a Python class that maps directly to one table in the database. SQLAlchemy uses these classes to create the tables and to read/write rows without you writing raw SQL.

| File | Table | What it represents |
|------|-------|--------------------|
| `user.py` | `users` | A registered account. Stores the user's name, email, and hashed password. Every event belongs to a user. |
| `event.py` | `events` | A wedding event. Has a title, optional date/venue/description, and a total budget field. Belongs to a user. |
| `guest.py` | `guests` | One person on the guest list. Stores their name, phone, RSVP status (pending/confirmed/maybe/declined), which side they're on (bride/groom), their table number, dietary restrictions, and a unique RSVP token used for the public RSVP link. Belongs to an event. |
| `task.py` | `tasks` | A to-do item for the wedding (e.g. "Book florist"). Has a title and a status: todo, in_progress, or done. Belongs to an event. |
| `vendor.py` | `vendors` | A service provider (photographer, caterer, DJ, etc.). Stores the type of service, vendor company name, contact details, estimated price, actual cost, whether it's been paid, and a sort order for drag-and-drop ordering. Belongs to an event. |

### Schemas (`app/schemas/`)

Schemas are separate from models. While models define how data is stored in the database, schemas define the shape of data going into and out of the API as JSON. They are written using **Pydantic** — a Python library that validates data automatically. FastAPI integrates with Pydantic so that when a request arrives, the body is validated against the schema before your code even runs. If a required field is missing or has the wrong type, FastAPI returns a 422 error automatically.

The key reason models and schemas are separate is that **what you store and what you expose aren't always the same**. For example: the `users` table stores a `password_hash` column — but `UserOut` (the response schema) deliberately doesn't include it, so the hash is never sent to the frontend. Similarly, `EventCreate` only requires a `title` — fields like `id`, `created_at`, and `user_id` are assigned by the server and don't need to come from the user.

Each resource follows the same three-schema pattern: `XCreate` (what the frontend sends to create), `XUpdate` (what the frontend sends to edit — all fields optional), `XOut` (what the API returns).

| File | Purpose |
|------|---------|
| `user.py` | `UserCreate` — what the register form sends (name, email, password). `UserOut` — what the API returns about a user (never includes the password hash). `Token` — the JWT response after login. |
| `event.py` | `EventCreate` — fields required to create an event (just title). `EventUpdate` — all fields optional (for partial updates). `EventOut` — the full event object returned to the frontend. |
| `guest.py` | `GuestCreate` — minimum fields to add a guest. `GuestUpdate` — all fields optional for editing. `GuestOut` — full guest object returned to the frontend. `RSVPUpdate` — the specific schema used by the public RSVP page. |
| `task.py` | `TaskCreate`, `TaskUpdate`, `TaskOut` — same pattern as above for tasks. |
| `vendor.py` | `VendorCreate`, `VendorUpdate`, `VendorOut` — same pattern for vendors. |

### How a request flows through the backend

When the frontend does something like "add a guest", this is the exact sequence:

1. **Frontend** sends `POST /events/3/guests` with `{ "name": "Sarah", "phone": "054..." }` and the JWT token in the header
2. **`deps.py` → `get_current_user`** decodes the JWT token and returns the logged-in user. If the token is missing or expired, returns 401 immediately.
3. **`deps.py` → `get_event_or_404`** checks that event 3 exists AND belongs to this user. If not, returns 404.
4. **Schema (`GuestCreate`)** validates the request body via Pydantic — is `name` present? Are types correct? If not, returns 422 automatically.
5. **Router (`guests.py`)** runs the function body — creates a `Guest(...)` model object and saves it to the database.
6. **Schema (`GuestOut`)** formats the saved guest as JSON (excluding any internal fields) and sends it back as the response.

This pattern applies to every endpoint in the app.

### Routers (`app/routers/`)

Routers contain the actual endpoint logic — what happens when the frontend calls a specific URL. Each router is a group of related endpoints. When a request comes in, FastAPI matches the URL to the right function, runs the dependencies (auth checks), validates the body against the schema, and executes the function.

| File | URL prefix | What it handles |
|------|-----------|-----------------|
| `auth.py` | `/auth` | Three endpoints: `POST /register` creates a new user, `POST /login` checks credentials and returns a JWT, `GET /me` returns the logged-in user's profile. |
| `events.py` | `/events` | CRUD for events (list, create, get, update, delete). Also seeds 36 default vendor rows when a new event is created, so every user starts with a pre-filled vendor template. |
| `guests.py` | `/events/{id}/guests` | CRUD for guests (list, create, get, update, delete), plus an endpoint that generates a unique RSVP token link for a specific guest. |
| `tasks.py` | `/events/{id}/tasks` | CRUD for tasks. |
| `vendors.py` | `/events/{id}/vendors` | CRUD for vendors, including updating `sort_order` for drag-and-drop reordering. |
| `public.py` | `/rsvp` | Two endpoints with no authentication: one to look up a guest by their RSVP token, one to submit their RSVP response. These are called by the public RSVP page that guests open from their invite link. |

---

## Frontend (`frontend/`)

The frontend is a React application — a collection of components that render HTML in the browser. It communicates with the backend via HTTP requests (using **Axios**), caches and syncs server data (using **React Query**), and handles navigation between pages (using **React Router**). **Vite** is the tool that bundles all the TypeScript/React code into plain JavaScript that browsers can run.

**React Query** is worth understanding specifically: it manages all the data fetching. When a page needs data (e.g. the guest list), React Query fetches it, caches it, and re-fetches it on a 5-second interval to stay fresh. It also handles **optimistic updates** — when you add a guest, it immediately shows the guest in the UI (using a temporary fake ID) before the server responds. If the server fails, it rolls back to the previous state. This makes the app feel instant even over a slow connection.

### Config Files

| File | Purpose |
|------|---------|
| `package.json` | Lists all JavaScript dependencies (React, Axios, Tailwind, etc.) and defines the npm scripts: `npm run dev` starts the local dev server, `npm run build` compiles the app for production. |
| `package-lock.json` | Automatically generated by npm. Locks the exact version of every dependency so that `npm install` gives the same result on every machine. Never edit this by hand. |
| `vite.config.ts` | Configuration for Vite. The key setting is the `/api` proxy: in development, any request to `/api/...` is forwarded to `http://localhost:8000` (the local backend), so the frontend doesn't need to hardcode the backend URL in development. |
| `tsconfig.json` | TypeScript configuration — tells the TypeScript compiler which files to check, how strict to be, and which JS features to support. |
| `tailwind.config.js` | Tailwind CSS configuration. Defines the custom `burgundy` colour palette used throughout the app (the dark red colour on buttons, links, etc.). |
| `postcss.config.js` | Required by Tailwind. PostCSS is the tool that processes Tailwind's CSS directives and generates the final stylesheet. |
| `index.html` | The single HTML page for the entire app. Vite injects the compiled JavaScript bundle here. React takes over the page and renders all UI dynamically without any page reloads. |
| `.env.production` | Sets `VITE_API_URL` to the Render backend URL. Vite reads this during `npm run build` so the production build points to the real server instead of localhost. |

### Source (`src/`)

| File | Purpose |
|------|---------|
| `main.tsx` | The JavaScript entry point. Mounts the root `<App />` component into the `index.html` div. Also wraps everything in `QueryClientProvider` (makes React Query available app-wide). |
| `App.tsx` | Defines all the routes — which URL path renders which page component. Also contains `PrivateRoute`, a wrapper that checks if a JWT token exists; if not, it redirects unauthenticated users to `/login`. |
| `index.css` | Global stylesheet. Contains Tailwind's base directives and a few custom CSS rules (e.g. hiding the underline on the guest add input). |
| `vite-env.d.ts` | A TypeScript declaration file that gives type information for `import.meta.env` (Vite's way of reading environment variables). Not business logic — just makes TypeScript happy. |

### API (`src/api/`)

| File | Purpose |
|------|---------|
| `client.ts` | Creates the Axios HTTP client used by every page to talk to the backend. Configured with the base URL, an interceptor that attaches the JWT token to every outgoing request as an `Authorization` header, and a response interceptor that automatically logs the user out (clears token, redirects to `/login`) whenever the server returns a 401. |
| `types.ts` | TypeScript interfaces for every data model: `User`, `Event`, `Guest`, `Task`, `Vendor`, `RSVPInfo`. These are used throughout the frontend to get type safety — if the backend changes a field name, TypeScript will show errors everywhere that field is used. |

### Components (`src/components/`)

Reusable pieces of UI that appear on multiple pages.

| File | Purpose |
|------|---------|
| `Layout.tsx` | The main app shell. Renders the sidebar with the "Wedding Planner" logo and navigation links (shown on every authenticated page). The actual page content is rendered inside it via React Router's `<Outlet />`. |
| `EventLayout.tsx` | A secondary navigation bar that appears on all event-specific pages, showing the tabs: Guests, Tasks, Vendors, Seating Chart. Also fetches and displays the event title at the top. |
| `EditableCell.tsx` | A reusable component used in the vendor and guest tables. It displays a value as styled text, but when you click on it, it turns into an input field. Pressing Enter or clicking away saves the value; pressing Escape cancels the edit. This is how inline editing works throughout the app without separate edit forms. |

### Pages (`src/pages/`)

Each file is a self-contained page. Pages fetch their own data (using React Query), manage their own local state, and render the full UI for that screen.

| File | URL | What the user sees and can do |
|------|-----|-------------------------------|
| `Login.tsx` | `/login` | The login screen with email, password, and a "Remember me" checkbox. On success, stores the JWT token and redirects to the dashboard. |
| `Register.tsx` | `/register` | New account creation. Sends name, email, and password to the backend. On success, redirects to login. Clears any stale token on mount to prevent auth conflicts. |
| `Dashboard.tsx` | `/` | The home screen after login. Lists all the user's events. You can create a new event (optimistic — appears instantly before the server confirms), rename one, or delete one. Clicking an event name navigates into that event's guest list. |
| `GuestList.tsx` | `/events/:id/guests` | The main guest management page. Shows a table of all guests with inline-editable cells. You can add guests, edit their name/phone/RSVP status/side/table/dietary info, generate and copy RSVP links, and delete guests. Has a search bar and summary stats (total, confirmed, pending, etc.). |
| `Tasks.tsx` | `/events/:id/tasks` | A kanban board with three columns: To Do, In Progress, Done. Add tasks by typing in the input at the bottom of any column. Edit task text inline. Move tasks left/right between columns with arrow buttons. Delete with the × button. |
| `Vendors.tsx` | `/events/:id/vendors` | A table of all vendors grouped by category (Bride, Groom, Venue, etc.). Each row is draggable to reorder within its category. Fields are inline-editable. Each vendor has an actual cost field and a paid/unpaid toggle. At the top: total budget, amount spent, and remaining. |
| `SeatingChart.tsx` | `/events/:id/seating` | A visual seating chart. Configure the number of tables and seats per table. Drag guests from the unassigned list onto tables. The table assignments sync back to the guest records. |
| `RSVP.tsx` | `/rsvp/:token` | A public page — no login required. When a guest receives their invite link (containing a unique token), they open this page to see their name and the event details, then click Attending or Declining. The token acts as authentication so no account is needed. |

### Public Assets (`public/`)

| File | Purpose |
|------|---------|
| `WedBG.png` | The background photo used on the Login and Register pages |
| `favicon.ico` | The small icon shown in the browser tab |
