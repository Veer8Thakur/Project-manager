import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import * as api from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/dashboard" }),
  beforeLoad: async ({ search }) => {
    const u = await api.me();
    if (u) throw redirect({ to: search.redirect as any });
  },
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Teamflow" }, { name: "description", content: "Sign in to your Teamflow workspace." }] }),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email, password);
      navigate({ to: search.redirect as any });
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-surface)] p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-lg)]">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <CheckSquare className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Teamflow workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Demo accounts</p>
              <p>admin@demo.com / demo1234 (Admin)</p>
              <p>member@demo.com / demo1234 (Member)</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
