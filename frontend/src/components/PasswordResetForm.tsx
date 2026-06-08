"use client";

import { FormEvent, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20 placeholder:text-stone-400";

type Tone = "info" | "error" | "success";

type Props = {
  initialEmail?: string;
  token?: string;
};

export function PasswordResetForm({ initialEmail = "", token }: Props) {
  const [feedback, setFeedback] = useState<{ tone: Tone; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const isResetMode = Boolean(token);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback({ tone: "info", text: "Procesando solicitud..." });

    const form = new FormData(event.currentTarget);
    const endpoint = isResetMode ? "/auth/password/reset" : "/auth/password/forgot";
    const body = isResetMode
      ? {
          email: form.get("email"),
          token,
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
        }
      : { email: form.get("email") };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json().catch(() => null);
      const message = json?.data?.message ?? json?.message;

      if (!response.ok) {
        setFeedback({ tone: "error", text: message ?? "No se pudo procesar la solicitud." });
      } else {
        setFeedback({
          tone: "success",
          text:
            message ??
            (isResetMode
              ? "Contrasena actualizada. Ya podes iniciar sesion."
              : "Si el email existe, te enviamos instrucciones para restablecer la contrasena."),
        });
        event.currentTarget.reset();
      }
    } catch {
      setFeedback({ tone: "error", text: "No se pudo conectar con la API." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={initialEmail}
          className={inputClass}
          placeholder="tu@email.com"
        />
      </label>

      {isResetMode && (
        <>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">Nueva contrasena</span>
            <input name="password" type="password" required minLength={8} className={inputClass} />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
              Confirmar contrasena
            </span>
            <input name="password_confirmation" type="password" required minLength={8} className={inputClass} />
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isResetMode ? "Guardar nueva contrasena" : "Enviar instrucciones"}
      </button>

      {feedback && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : feedback.tone === "success"
                ? "border-olive-light/40 bg-olive-muted text-olive-dark"
                : "border-border-soft bg-cream-card text-stone-600"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </form>
  );
}
