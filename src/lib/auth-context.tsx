import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "./api";
import type { Role, User } from "./types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((u) => { setUser(u); setLoading(false); });
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    login: async (email, password) => { const { user } = await api.login(email, password); setUser(user); },
    signup: async (name, email, password, role) => { const { user } = await api.signup(name, email, password, role); setUser(user); },
    logout: async () => { await api.logout(); setUser(null); },
    refresh: async () => { setUser(await api.me()); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
