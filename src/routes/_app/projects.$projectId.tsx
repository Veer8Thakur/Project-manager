import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project, Task, User, TaskStatus, TaskPriority } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, UserPlus, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatDate, isOverdue } from "@/lib/utils";
import { toast } from "sonner";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectDetail,
  head: () => ({ meta: [{ title: "Project — Teamflow" }] }),
});

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const STATUS_LABEL: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  // task form
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tStatus, setTStatus] = useState<TaskStatus>("todo");
  const [tPriority, setTPriority] = useState<TaskPriority>("medium");
  const [tAssignee, setTAssignee] = useState<string>("unassigned");
  const [tDue, setTDue] = useState<string>("");
  const [memberEmail, setMemberEmail] = useState("");

  const load = async () => {
    const [projects, ts, us] = await Promise.all([api.listProjects(), api.listTasks(projectId), api.listUsers()]);
    setProject(projects.find((p) => p.id === projectId) || null);
    setTasks(ts);
    setUsers(us);
  };
  useEffect(() => { load(); }, [projectId]);

  if (!project) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const isAdmin = user?.role === "admin";
  const members = users.filter((u) => project.memberIds.includes(u.id));
  const assignableUsers = members;

  async function createTask() {
    if (!tTitle.trim()) return;
    try {
      await api.createTask({
        projectId, title: tTitle.trim(), description: tDesc.trim(),
        status: tStatus, priority: tPriority,
        assigneeId: tAssignee === "unassigned" ? null : tAssignee,
        dueDate: tDue ? new Date(tDue).toISOString() : null,
      });
      setTTitle(""); setTDesc(""); setTStatus("todo"); setTPriority("medium"); setTAssignee("unassigned"); setTDue("");
      setTaskOpen(false); load(); toast.success("Task created");
    } catch (e: any) { toast.error(e.message); }
  }

  async function updateTaskStatus(id: string, status: TaskStatus) {
    try { await api.updateTask(id, { status }); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  async function updateTaskAssignee(id: string, assigneeId: string) {
    try { await api.updateTask(id, { assigneeId: assigneeId === "unassigned" ? null : assigneeId }); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  async function removeTask(id: string) {
    if (!confirm("Delete this task?")) return;
    try { await api.deleteTask(id); load(); toast.success("Task deleted"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function addMember() {
    if (!memberEmail.trim()) return;
    try { await api.addProjectMember(projectId, memberEmail.trim()); setMemberEmail(""); setMemberOpen(false); load(); toast.success("Member added"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function removeMember(userId: string) {
    try { await api.removeProjectMember(projectId, userId); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{project.description || "No description"}</p>
          </div>
          <Button onClick={() => setTaskOpen(true)}><Plus className="mr-2 h-4 w-4" /> New task</Button>
        </div>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setMemberOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add member
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-full border bg-secondary/50 py-1 pl-2 pr-1 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="font-medium">{m.name}</span>
              <span className="text-muted-foreground">({m.role})</span>
              {isAdmin && m.id !== project.ownerId && (
                <button onClick={() => removeMember(m.id)} className="rounded-full p-0.5 hover:bg-background">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tasks board */}
      <div className="grid gap-4 lg:grid-cols-3">
        {STATUSES.map((s) => {
          const list = tasks.filter((t) => t.status === s);
          return (
            <Card key={s}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{STATUS_LABEL[s]}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{list.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Nothing here</p>}
                {list.map((t) => {
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const overdue = isOverdue(t.dueDate, t.status);
                  return (
                    <div key={t.id} className={`group rounded-lg border bg-card p-3 shadow-[var(--shadow-sm)] ${overdue ? "border-destructive/40" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{t.title}</p>
                        <button onClick={() => removeTask(t.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      {t.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <PriorityChip p={t.priority} />
                        {t.dueDate && (
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${overdue ? "bg-destructive/10 text-destructive" : "text-muted-foreground"}`}>
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Select value={t.status} onValueChange={(v) => updateTaskStatus(t.id, v as TaskStatus)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={t.assigneeId || "unassigned"} onValueChange={(v) => updateTaskAssignee(t.id, v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {assignableUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {assignee && (
                        <p className="mt-2 text-[11px] text-muted-foreground">Assigned to {assignee.name}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New task dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input maxLength={120} value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea maxLength={1000} value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={tStatus} onValueChange={(v) => setTStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={tPriority} onValueChange={(v) => setTPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={tAssignee} onValueChange={setTAssignee}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignableUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button onClick={createTask}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add member</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="user@example.com" />
            <p className="text-xs text-muted-foreground">User must already have an account.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberOpen(false)}>Cancel</Button>
            <Button onClick={addMember}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriorityChip({ p }: { p: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    low: "bg-secondary text-muted-foreground",
    medium: "bg-[oklch(var(--warning)/0.18)] text-[oklch(0.45_0.12_75)]",
    high: "bg-destructive/15 text-destructive",
  };
  return <span className={`rounded px-1.5 py-0.5 font-medium ${map[p]}`}>{p}</span>;
}

// re-export StatusBadge so route generator picks the file up cleanly
export { StatusBadge };
