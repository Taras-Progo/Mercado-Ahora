"use client";

import { FormEvent, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export function AuthPanel({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Procesando...");

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json();

      if (!response.ok) {
        setMessage(json.message ?? "No se pudo completar la operación.");
        return;
      }

      localStorage.setItem("mercado_token", json.data.token);
      localStorage.setItem("mercado_user", JSON.stringify(json.data.user));
      setMessage("Listo. Sesión guardada en este navegador.");
    } catch {
      setMessage("No se pudo conectar con la API local.");
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
        Contraseña
        <input name="password" type="password" minLength={8} className="rounded-md border border-stone-300 px-3 py-2" required />
      </label>
      <button className="rounded-md bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900">
        {mode === "login" ? "Ingresar" : "Crear cuenta"}
      </button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </form>
  );
}
