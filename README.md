# Teamflow — Team Task Manager

A team task manager built with React + TanStack Start. Features:

- 🔐 Auth (signup / login) with role-based access (Admin / Member)
- 📁 Project & team management (admins create projects, add members)
- ✅ Task creation, assignment, status tracking (To do / In progress / Done)
- 📊 Dashboard with stats + overdue tracking
- 🎨 Slate & Steel design system

## Demo accounts

- `admin@demo.com` / `demo1234` (Admin)
- `member@demo.com` / `demo1234` (Member)

## Connecting to your Railway backend

The frontend ships with a localStorage-backed mock store so it works out of the box.
To connect your real REST API hosted on Railway:

1. Set the env var **`VITE_API_URL`** to your backend base URL, e.g.:
   ```
   VITE_API_URL=https://your-app.up.railway.app/api
   ```
2. The mock store is bypassed automatically and all calls go to your API.

### Expected REST endpoints

See `src/lib/api.ts` for the full contract. Summary:

| Method | Path                                         | Returns           |
| ------ | -------------------------------------------- | ----------------- |
| POST   | `/auth/signup`                               | `{ user, token }` |
| POST   | `/auth/login`                                | `{ user, token }` |
| GET    | `/auth/me`                                   | `{ user }`        |
| GET    | `/projects`                                  | `Project[]`       |
| POST   | `/projects`                                  | `Project`         |
| PATCH  | `/projects/:id`                              | `Project`         |
| DELETE | `/projects/:id`                              | `{ ok: true }`    |
| POST   | `/projects/:id/members` (`{ email }`)        | `Project`         |
| DELETE | `/projects/:id/members/:userId`              | `Project`         |
| GET    | `/projects/:id/tasks`                        | `Task[]`          |
| GET    | `/tasks`                                     | `Task[]`          |
| POST   | `/tasks`                                     | `Task`            |
| PATCH  | `/tasks/:id`                                 | `Task`            |
| DELETE | `/tasks/:id`                                 | `{ ok: true }`    |
| GET    | `/users`                                     | `User[]`          |

Auth: send `Authorization: Bearer <token>` (token comes from login/signup).

Type definitions live in `src/lib/types.ts`.
