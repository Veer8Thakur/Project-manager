# Teamflow Backend (Express + Prisma + Postgres)

Production-ready REST API matching the contract the frontend (`src/lib/api.ts`) already consumes. Deploys to Railway in a few clicks.

## Stack
- **Express** — HTTP server
- **Prisma** — type-safe ORM
- **PostgreSQL** — relational DB (Railway plugin)
- **JWT (jsonwebtoken)** — stateless auth
- **bcryptjs** — password hashing
- **Zod** — request validation

## Local development

```bash
cd backend
cp .env.example .env       # then edit DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed               # optional: creates admin@demo.com / member@demo.com (password: demo1234)
npm run dev
```

API runs at http://localhost:8080.

## Deploy to Railway

1. Push the `backend/` folder to a GitHub repo (can be a subfolder; set Railway's "Root Directory" to `backend`).
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin to the project — Railway auto-injects `DATABASE_URL`.
4. Add env vars:
   - `JWT_SECRET` — long random string
   - `CORS_ORIGIN` — your frontend URL (e.g. `https://your-app.lovable.app`)
5. Deploy. The container runs `prisma migrate deploy` on every boot (idempotent).
6. (Optional, one-off) Run `npm run seed` from the Railway shell to create demo users.

## Wire the frontend
In the Lovable frontend, set the env var:
```
VITE_API_URL=https://your-backend.up.railway.app/api
```
The frontend's mock store is automatically bypassed when this is set.

## REST API

Auth: `Authorization: Bearer <token>` on all routes except signup/login.

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | `{name,email,password,role?}` | First user becomes admin |
| POST | `/api/auth/login` | `{email,password}` | |
| GET | `/api/auth/me` | — | |
| GET | `/api/users` | — | For assignment dropdowns |
| GET | `/api/projects` | — | Member-scoped (admins see all) |
| POST | `/api/projects` | `{name,description}` | Admin only |
| PATCH | `/api/projects/:id` | partial | Admin or owner |
| DELETE | `/api/projects/:id` | — | Admin only |
| POST | `/api/projects/:id/members` | `{email}` | Admin only |
| DELETE | `/api/projects/:id/members/:userId` | — | Admin only |
| GET | `/api/projects/:id/tasks` | — | Members + admins |
| GET | `/api/tasks` | — | All my visible tasks |
| POST | `/api/tasks` | `{projectId,title,...}` | Member of project |
| PATCH | `/api/tasks/:id` | partial | Member of project |
| DELETE | `/api/tasks/:id` | — | Admin or task creator |

## Role-Based Access Control

- **admin** — full access: create/delete projects, manage members, delete any task.
- **member** — sees only projects they belong to; can create/update tasks within those projects; can delete only tasks they created.

Enforced in middleware (`requireAuth`, `requireAdmin`) and per-route ownership checks.

## Schema relationships

- `User 1—N Project` (owner)
- `User N—N Project` via `ProjectMember` (membership)
- `Project 1—N Task`
- `User 1—N Task` (assignee, nullable; creator, required)
- Cascading deletes: deleting a project removes its members + tasks; deleting a user removes owned projects, memberships, and authored tasks.
