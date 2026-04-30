import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderKanban, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects/")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projects — Teamflow" }, { name: "description", content: "Browse and manage your team's projects." }] }),
});

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = () => api.listProjects().then(setProjects);
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    try {
      await api.createProject({ name: name.trim(), description: desc.trim() });
      setName(""); setDesc(""); setOpen(false); load();
      toast.success("Project created");
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this project and all its tasks?")) return;
    try { await api.deleteProject(id); load(); toast.success("Project deleted"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">All projects you have access to.</p>
        </div>
        {user?.role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>Add a new project for your team.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="pn">Name</Label>
                  <Input id="pn" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pd">Description</Label>
                  <Textarea id="pd" maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No projects yet.</p>
            {user?.role !== "admin" && (
              <p className="text-xs text-muted-foreground">Ask an admin to add you to a project.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="group transition-shadow hover:shadow-[var(--shadow-md)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">
                        {p.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{p.description || "No description"}</CardDescription>
                  </div>
                  {user?.role === "admin" && (
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.memberIds.length} member{p.memberIds.length === 1 ? "" : "s"}</span>
                <span>Created {formatDate(p.createdAt)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
