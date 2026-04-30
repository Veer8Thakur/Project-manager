import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project, Task, TaskStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { formatDate, isOverdue } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "My Tasks — Teamflow" }, { name: "description", content: "All tasks assigned to you across projects." }] }),
});

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const LABEL: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | TaskStatus | "overdue">("all");

  const load = () => Promise.all([api.listTasks(), api.listProjects()]).then(([t, p]) => { setTasks(t); setProjects(p); });
  useEffect(() => { load(); }, []);

  const mine = tasks.filter((t) => t.assigneeId === user?.id);
  const filtered = mine.filter((t) =>
    filter === "all" ? true : filter === "overdue" ? isOverdue(t.dueDate, t.status) : t.status === filter,
  );

  async function setStatus(id: string, status: TaskStatus) {
    try { await api.updateTask(id, { status }); load(); toast.success("Updated"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground">Tasks assigned to you across all projects.</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="todo">To do</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No tasks here.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            const overdue = isOverdue(t.dueDate, t.status);
            return (
              <Card key={t.id} className={overdue ? "border-destructive/40" : ""}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {project && (
                        <Link to="/projects/$projectId" params={{ projectId: project.id }} className="hover:underline">
                          {project.name}
                        </Link>
                      )}
                      {" · "}
                      <span className={overdue ? "text-destructive" : ""}>
                        {overdue && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                        Due {formatDate(t.dueDate)}
                      </span>
                    </p>
                  </div>
                  <Select value={t.status} onValueChange={(v) => setStatus(t.id, v as TaskStatus)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
