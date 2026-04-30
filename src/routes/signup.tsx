import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckSquare } from "lucide-react";
import * as api from "@/lib/api";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const u = await api.me();
    if (u) throw redirect({ to: "/dashboard" });
  },
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — Teamflow" }, { name: "description", content: "Create a Teamflow account to manage your team's projects and tasks." }] }),
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setErr("Password must be at least 8 characters"); return; }
    setErr(""); setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password, role);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      setErr(e.message || "Signup failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-surface)] p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-lg)]">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <CheckSquare className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start managing your team's work</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (min. 8 chars)</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-2 gap-2">
                <Label htmlFor="r-member" className="flex cursor-pointer items-center gap-2 rounded-md border bg-card p-3 has-[:checked]:border-foreground has-[:checked]:bg-secondary">
                  <RadioGroupItem id="r-member" value="member" />
                  <span className="text-sm">Member</span>
                </Label>
                <Label htmlFor="r-admin" className="flex cursor-pointer items-center gap-2 rounded-md border bg-card p-3 has-[:checked]:border-foreground has-[:checked]:bg-secondary">
                  <RadioGroupItem id="r-admin" value="admin" />
                  <span className="text-sm">Admin</span>
                </Label>
              </RadioGroup>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" search={{ redirect: "/dashboard" }} className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
