import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project, Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertTriangle, FolderKanban } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatDate, isOverdue } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Teamflow" }, { name: "description", content: "Overview of your team's projects, tasks, and overdue items." }] }),
});

function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listProjects(), api.listTasks()]).then(([p, t]) => {
      setProjects(p); setTasks(t); setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const myTasks = user ? tasks.filter((t) => t.assigneeId === user.id) : [];
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value={projects.length} icon={<FolderKanban className="h-4 w-4" />} />
        <StatCard label="To do" value={todo} icon={<Circle className="h-4 w-4 text-muted-foreground" />} />
        <StatCard label="In progress" value={inProgress} icon={<Clock className="h-4 w-4 text-[oklch(var(--info))]" />} accent="info" />
        <StatCard label="Completed" value={done} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My tasks</CardTitle>
            <Link to="/tasks" className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>}
            {myTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(t.dueDate)}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Overdue
            </CardTitle>
            <Badge variant="destructive">{overdue.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.length === 0 && <p className="text-sm text-muted-foreground">Nothing overdue. </p>}
            {overdue.slice(0, 5).map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              return (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{project?.name} · Due {formatDate(t.dueDate)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: "success" | "info" }) {
  return (
    <Card className="shadow-[var(--shadow-sm)]">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent === "success" ? "bg-[oklch(var(--success)/0.12)] text-[oklch(var(--success))]" : accent === "info" ? "bg-[oklch(var(--info)/0.12)] text-[oklch(var(--info))]" : "bg-secondary"}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    todo: { label: "To do", cls: "bg-secondary text-secondary-foreground" },
    in_progress: { label: "In progress", cls: "bg-[oklch(var(--info)/0.15)] text-[oklch(var(--info))]" },
    done: { label: "Done", cls: "bg-[oklch(var(--success)/0.15)] text-[oklch(var(--success))]" },
  };
  const m = map[status] || map.todo;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}
