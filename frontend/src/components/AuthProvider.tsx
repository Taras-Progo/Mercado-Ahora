"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
const TOKEN_KEY = "mercado_token";
const USER_KEY = "mercado_user";
const AUTH_TIMEOUT_MS = 5000;

export type UserRole = "buyer" | "seller" | "admin";

export type ProducerProfileSummary = {
  id: number;
  status: "pending" | "active" | "rejected";
  business_name?: string;
  slug?: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  email_verified_at?: string | null;
  producer_profile?: ProducerProfileSummary | null;
  producerProfile?: ProducerProfileSummary | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  validating: boolean;
  login: (token: string, user: AuthUser, remember?: boolean) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [validating, setValidating] = useState(false);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    const storedToken = readStoredToken();
    const cachedUser = readCachedUser();

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setValidating(false);
      setReady(true);
      return;
    }

    setToken(storedToken);
    if (cachedUser) {
      setUser(cachedUser);
      setReady(true);
    }

    setValidating(true);

    try {
      const response = await fetchWithTimeout(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}`, Accept: "application/json" },
      }, AUTH_TIMEOUT_MS);

      if (response.status === 401 || response.status === 403) {
        clearStoredAuth();
        setUser(null);
        setToken(null);
        setReady(true);
        return;
      }

      if (!response.ok) {
        return;
      }

      const json = await response.json();
      const nextUser: AuthUser = json.data?.user ?? json.data ?? json;
      setUser(nextUser);
      writeStoredUser(nextUser);
    } catch {
      if (cachedUser) {
        setUser(cachedUser);
      }
    } finally {
      setReady(true);
      setValidating(false);
    }
  }, []);

  useEffect(() => {
    // Sync React state with external system (localStorage + /auth/me on mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const login = useCallback((nextToken: string, nextUser: AuthUser, remember = true) => {
    writeStoredAuth(nextToken, nextUser, remember);
    setToken(nextToken);
    setUser(nextUser);
    setReady(true);
    setValidating(false);
  }, []);

  const logout = useCallback(async () => {
    const current = readStoredToken();
    if (current) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${current}`, Accept: "application/json" },
        });
      } catch {}
    }
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setReady(true);
    setValidating(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, ready, validating, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

export function roleHome(role: UserRole | undefined) {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller";
  if (role === "buyer") return "/cuenta";
  return "/";
}

export function producerStatusOf(user: AuthUser | null) {
  return user?.producer_profile?.status ?? user?.producerProfile?.status ?? null;
}

export async function parseApiMessage(response: Response) {
  try {
    const json = await response.json();
    if (json?.errors && typeof json.errors === "object") {
      const messages = Object.values(json.errors).flat().filter(Boolean);
      if (messages.length > 0) return String(messages[0]);
    }
    if (typeof json.message === "string") return json.message;
    if (typeof json.data?.message === "string") return json.data.message;
  } catch {}
  return `Error ${response.status}`;
}

function readCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const cached = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

function writeStoredAuth(nextToken: string, nextUser: AuthUser, remember: boolean) {
  if (typeof window === "undefined") return;
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
  target.setItem(TOKEN_KEY, nextToken);
  target.setItem(USER_KEY, JSON.stringify(nextUser));
}

function writeStoredUser(nextUser: AuthUser) {
  if (typeof window === "undefined") return;
  const target = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  target.setItem(USER_KEY, JSON.stringify(nextUser));
}

function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}
