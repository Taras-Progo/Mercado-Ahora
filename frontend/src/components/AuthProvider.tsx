"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export type Role = "buyer" | "seller" | "admin";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  producer_profile?: { id: number; status: string; business_name?: string } | null;
  producerProfile?: { id: number; status: string; business_name?: string } | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("mercado_token");
    localStorage.removeItem("mercado_user");
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem("mercado_token", nextToken);
    localStorage.setItem("mercado_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const activeToken = token ?? localStorage.getItem("mercado_token");
      const headers = new Headers(init.headers);
      headers.set("Accept", "application/json");

      if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (activeToken) {
        headers.set("Authorization", `Bearer ${activeToken}`);
      }

      return fetch(`${API_BASE}${path}`, { ...init, headers });
    },
    [token],
  );

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("mercado_token");
    if (!storedToken) {
      clearSession();
      setLoading(false);
      return null;
    }

    setToken(storedToken);

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        clearSession();
        return null;
      }

      const nextUser = json.data as AuthUser;
      localStorage.setItem("mercado_user", JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    } catch {
      const storedUser = localStorage.getItem("mercado_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser(parsedUser);
        return parsedUser;
      }
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    const activeToken = token ?? localStorage.getItem("mercado_token");

    if (activeToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      }).catch(() => null);
    }

    clearSession();
  }, [clearSession, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, refreshUser, authFetch }),
    [authFetch, loading, login, logout, refreshUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function ProtectedArea({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <p className="rounded-md bg-white p-4 text-sm text-stone-600">Validando sesion...</p>;
  }

  if (!user) {
    return <p className="rounded-md bg-white p-4 text-sm text-stone-600">Redirigiendo al ingreso...</p>;
  }

  if (!roles.includes(user.role)) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        No tenes permisos para acceder a esta seccion.
      </section>
    );
  }

  return children;
}

export function roleHome(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller";
  return "/dashboard";
}

export async function parseApiMessage(response: Response) {
  const json = await response.json().catch(() => ({}));

  if (json?.errors && typeof json.errors === "object") {
    const messages = Object.values(json.errors).flat().filter(Boolean);
    if (messages.length > 0) return String(messages[0]);
  }

  return json?.message ?? json?.data?.message ?? "No se pudo completar la operacion.";
}
