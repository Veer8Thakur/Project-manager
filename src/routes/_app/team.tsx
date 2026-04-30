import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_app/team")({
  beforeLoad: async () => {
    const u = await api.me();
    if (!u || u.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — Teamflow" }, { name: "description", content: "All users in your workspace." }] }),
});

function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { api.listUsers().then(setUsers); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">All users in your workspace.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{users.length} member{users.length === 1 ? "" : "s"}</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                {u.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {u.role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                {u.role}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
