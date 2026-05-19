"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { parseApiMessage, roleHome, useAuth } from "@/components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export function AuthPanel({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Procesando...");

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setMessage(await parseApiMessage(response));
        return;
      }

      const json = await response.json();
      login(json.data.token, json.data.user);
      setMessage("Listo. Sesion guardada en este navegador.");
      router.push(roleHome(json.data.user.role));
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {mode === "register" && (
        <label className="grid gap-1 text-sm font-medium text-stone-700">
          Nombre
          <input name="name" className="rounded-md border border-stone-300 px-3 py-2" required />
        </label>
      )}
      <label className="grid gap-1 text-sm font-medium text-stone-700">
        Email
        <input name="email" type="email" className="rounded-md border border-stone-300 px-3 py-2" required />
      </label>
      <label className="grid gap-1 text-sm font-medium text-stone-700">
        Contrasena
        <input name="password" type="password" minLength={8} className="rounded-md border border-stone-300 px-3 py-2" required />
      </label>
      <button className="rounded-md bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900">
        {mode === "login" ? "Ingresar" : "Crear cuenta"}
      </button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </form>
  );
}

export function AuthPreparedFlows() {
  const [message, setMessage] = useState("");

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_BASE}/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });

      setMessage(response.ok ? "Recuperacion preparada para una fase posterior." : await parseApiMessage(response));
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }

  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Accesos preparados</h2>
      <p className="text-sm text-stone-600">
        Verificacion de email y recuperacion de contrasena quedan preparadas como base tecnica en Fase 1.
      </p>
      <form onSubmit={requestPasswordReset} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input name="email" type="email" placeholder="Email" className="rounded-md border border-stone-300 px-3 py-2" required />
        <button className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
          Probar base
        </button>
      </form>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </section>
  );
}
