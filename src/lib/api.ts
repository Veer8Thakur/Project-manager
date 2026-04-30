/**
 * API client.
 *
 * To connect to your Railway-hosted REST API:
 *   1. Set VITE_API_URL in your environment to your backend base URL
 *      e.g. VITE_API_URL=https://your-app.up.railway.app/api
 *   2. The mock store below will be bypassed automatically.
 *
 * Expected REST endpoints (all JSON):
 *   POST   /auth/signup            { name, email, password }     -> { user, token }
 *   POST   /auth/login             { email, password }           -> { user, token }
 *   GET    /auth/me                                              -> { user }
 *   GET    /projects                                             -> Project[]
 *   POST   /projects               { name, description }         -> Project
 *   PATCH  /projects/:id           { ...partial }                -> Project
 *   DELETE /projects/:id                                         -> { ok: true }
 *   POST   /projects/:id/members   { email }                     -> Project
 *   DELETE /projects/:id/members/:userId                         -> Project
 *   GET    /projects/:id/tasks                                   -> Task[]
 *   GET    /tasks                                                -> Task[]   (across all my projects)
 *   POST   /tasks                  { projectId, title, ... }     -> Task
 *   PATCH  /tasks/:id              { ...partial }                -> Task
 *   DELETE /tasks/:id                                            -> { ok: true }
 *
 * Auth: Authorization: Bearer <token>  (token returned from login/signup)
 */
import type { Project, Role, Task, User } from "./types";

const API_URL = (import.meta as any).env?.VITE_API_URL as string | undefined;
const useMock = !API_URL;

const TOKEN_KEY = "ttm_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

// ---------- Mock store (used until VITE_API_URL is set) ----------
const STORE_KEY = "ttm_store_v1";
interface Store {
  users: (User & { password: string })[];
  projects: Project[];
  tasks: Task[];
  sessions: Record<string, string>; // token -> userId
}
const uid = () => Math.random().toString(36).slice(2, 10);
function readStore(): Store {
  if (typeof window === "undefined")
    return { users: [], projects: [], tasks: [], sessions: {} };
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) return JSON.parse(raw);
  // Seed with demo admin
  const adminId = uid();
  const memberId = uid();
  const projectId = uid();
  const seed: Store = {
    users: [
      { id: adminId, name: "Admin User", email: "admin@demo.com", password: "demo1234", role: "admin" },
      { id: memberId, name: "Member User", email: "member@demo.com", password: "demo1234", role: "member" },
    ],
    projects: [
      {
        id: projectId,
        name: "Website Redesign",
        description: "Marketing site refresh for Q2 launch.",
        ownerId: adminId,
        memberIds: [adminId, memberId],
        createdAt: new Date().toISOString(),
      },
    ],
    tasks: [
      {
        id: uid(), projectId, title: "Wireframes", description: "Low-fi wireframes for hero & pricing.",
        status: "done", priority: "high", assigneeId: memberId,
        dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        createdAt: new Date().toISOString(), createdBy: adminId,
      },
      {
        id: uid(), projectId, title: "Brand tokens", description: "Define color & type tokens.",
        status: "in_progress", priority: "medium", assigneeId: adminId,
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        createdAt: new Date().toISOString(), createdBy: adminId,
      },
      {
        id: uid(), projectId, title: "QA pass", description: "Cross-browser QA.",
        status: "todo", priority: "low", assigneeId: null,
        dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
        createdAt: new Date().toISOString(), createdBy: adminId,
      },
    ],
    sessions: {},
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(seed));
  return seed;
}
function writeStore(s: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}
const stripPw = (u: User & { password: string }): User => {
  const { password, ...rest } = u;
  return rest;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Auth ----------
export async function signup(name: string, email: string, password: string, role: Role = "member") {
  if (!useMock) return http<{ user: User; token: string }>("/auth/signup", {
    method: "POST", body: JSON.stringify({ name, email, password, role }),
  });
  const s = readStore();
  if (s.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("Email already registered");
  const user = { id: uid(), name, email, password, role };
  s.users.push(user);
  const token = uid() + uid();
  s.sessions[token] = user.id;
  writeStore(s);
  setToken(token);
  return { user: stripPw(user), token };
}

export async function login(email: string, password: string) {
  if (!useMock) return http<{ user: User; token: string }>("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  });
  const s = readStore();
  const user = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error("Invalid email or password");
  const token = uid() + uid();
  s.sessions[token] = user.id;
  writeStore(s);
  setToken(token);
  return { user: stripPw(user), token };
}

export async function me(): Promise<User | null> {
  if (!useMock) {
    if (!getToken()) return null;
    try {
      const { user } = await http<{ user: User }>("/auth/me");
      return user;
    } catch {
      setToken(null);
      return null;
    }
  }
  const token = getToken();
  if (!token) return null;
  const s = readStore();
  const userId = s.sessions[token];
  const u = s.users.find((x) => x.id === userId);
  return u ? stripPw(u) : null;
}

export async function logout() {
  if (!useMock) {
    setToken(null);
    return;
  }
  const token = getToken();
  if (token) {
    const s = readStore();
    delete s.sessions[token];
    writeStore(s);
  }
  setToken(null);
}

// ---------- Projects ----------
export async function listProjects(): Promise<Project[]> {
  if (!useMock) return http<Project[]>("/projects");
  const u = await me();
  if (!u) return [];
  const s = readStore();
  return s.projects.filter((p) => p.memberIds.includes(u.id) || u.role === "admin");
}

export async function createProject(input: { name: string; description: string }): Promise<Project> {
  if (!useMock) return http<Project>("/projects", { method: "POST", body: JSON.stringify(input) });
  const u = await me();
  if (!u) throw new Error("Not authenticated");
  if (u.role !== "admin") throw new Error("Only admins can create projects");
  const s = readStore();
  const project: Project = {
    id: uid(), name: input.name, description: input.description,
    ownerId: u.id, memberIds: [u.id], createdAt: new Date().toISOString(),
  };
  s.projects.push(project);
  writeStore(s);
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project> {
  if (!useMock) return http<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  const s = readStore();
  const idx = s.projects.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Project not found");
  s.projects[idx] = { ...s.projects[idx], ...patch };
  writeStore(s);
  return s.projects[idx];
}

export async function deleteProject(id: string): Promise<void> {
  if (!useMock) { await http(`/projects/${id}`, { method: "DELETE" }); return; }
  const u = await me();
  if (!u || u.role !== "admin") throw new Error("Only admins can delete projects");
  const s = readStore();
  s.projects = s.projects.filter((p) => p.id !== id);
  s.tasks = s.tasks.filter((t) => t.projectId !== id);
  writeStore(s);
}

export async function addProjectMember(projectId: string, email: string): Promise<Project> {
  if (!useMock) return http<Project>(`/projects/${projectId}/members`, {
    method: "POST", body: JSON.stringify({ email }),
  });
  const s = readStore();
  const user = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("No user with that email");
  const idx = s.projects.findIndex((p) => p.id === projectId);
  if (idx < 0) throw new Error("Project not found");
  if (!s.projects[idx].memberIds.includes(user.id))
    s.projects[idx].memberIds.push(user.id);
  writeStore(s);
  return s.projects[idx];
}

export async function removeProjectMember(projectId: string, userId: string): Promise<Project> {
  if (!useMock) return http<Project>(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });
  const s = readStore();
  const idx = s.projects.findIndex((p) => p.id === projectId);
  if (idx < 0) throw new Error("Project not found");
  s.projects[idx].memberIds = s.projects[idx].memberIds.filter((id) => id !== userId);
  writeStore(s);
  return s.projects[idx];
}

// ---------- Users (for assignment dropdowns) ----------
export async function listUsers(): Promise<User[]> {
  if (!useMock) return http<User[]>("/users");
  const s = readStore();
  return s.users.map(stripPw);
}

// ---------- Tasks ----------
export async function listTasks(projectId?: string): Promise<Task[]> {
  if (!useMock) return http<Task[]>(projectId ? `/projects/${projectId}/tasks` : "/tasks");
  const u = await me();
  if (!u) return [];
  const s = readStore();
  const visibleProjects = s.projects
    .filter((p) => p.memberIds.includes(u.id) || u.role === "admin")
    .map((p) => p.id);
  return s.tasks.filter(
    (t) => visibleProjects.includes(t.projectId) && (!projectId || t.projectId === projectId),
  );
}

export async function createTask(input: Omit<Task, "id" | "createdAt" | "createdBy">): Promise<Task> {
  if (!useMock) return http<Task>("/tasks", { method: "POST", body: JSON.stringify(input) });
  const u = await me();
  if (!u) throw new Error("Not authenticated");
  const s = readStore();
  const task: Task = { ...input, id: uid(), createdAt: new Date().toISOString(), createdBy: u.id };
  s.tasks.push(task);
  writeStore(s);
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  if (!useMock) return http<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  const s = readStore();
  const idx = s.tasks.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error("Task not found");
  s.tasks[idx] = { ...s.tasks[idx], ...patch };
  writeStore(s);
  return s.tasks[idx];
}

export async function deleteTask(id: string): Promise<void> {
  if (!useMock) { await http(`/tasks/${id}`, { method: "DELETE" }); return; }
  const s = readStore();
  s.tasks = s.tasks.filter((t) => t.id !== id);
  writeStore(s);
}
