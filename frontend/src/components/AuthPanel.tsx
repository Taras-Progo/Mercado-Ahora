"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { parseApiMessage, roleHome, useAuth } from "@/components/AuthProvider";
import { EyeIcon, LeafIcon } from "@/components/ui/Icons";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type Mode = "login" | "register" | "seller-apply";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20 placeholder:text-stone-400";

export function AuthPanel({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const endpoint =
    mode === "login"
      ? "/auth/login"
      : mode === "register"
        ? "/auth/register"
        : "/auth/register-seller";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage({ tone: "info", text: "Procesando..." });

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await parseApiMessage(response) });
        setLoading(false);
        return;
      }

      const json = await response.json();
      const data = json.data ?? json;
      if (data.token && data.user) {
        login(data.token, data.user);
        setMessage({ tone: "success", text: "¡Listo! Redirigiendo..." });
        router.push(roleHome(data.user.role));
      } else {
        setMessage({ tone: "success", text: "Postulación recibida. Te avisaremos al aprobarla." });
      }
    } catch {
      setMessage({ tone: "error", text: "No se pudo conectar con la API." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {(mode === "register" || mode === "seller-apply") && (
        <Field label="Nombre completo">
          <input name="name" className={inputClass} placeholder="Tu nombre" required />
        </Field>
      )}

      {mode === "seller-apply" && (
        <>
          <Field label="Nombre del emprendimiento">
            <input name="business_name" className={inputClass} placeholder="Ej: La Colmena Natural" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provincia">
              <input name="province" className={inputClass} placeholder="Ej: Córdoba" required />
            </Field>
            <Field label="Ciudad">
              <input name="city" className={inputClass} placeholder="Ej: Alta Gracia" required />
            </Field>
          </div>
        </>
      )}

      <Field label="Email">
        <input name="email" type="email" className={inputClass} placeholder="tu@email.com" required />
      </Field>

      <Field label="Contraseña" hint={mode !== "login" ? "Mínimo 8 caracteres" : undefined}>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            className={`${inputClass} pr-12`}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 hover:bg-olive-muted hover:text-olive"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      </Field>

      {mode === "login" && (
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-stone-600">
            <input type="checkbox" name="remember" className="h-4 w-4 rounded border-border-soft accent-olive" />
            Recordarme
          </label>
          <Link href="/recuperar" className="font-semibold text-olive-dark hover:text-olive">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-olive-dark px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mode === "login" && "Ingresar"}
        {mode === "register" && "Crear cuenta"}
        {mode === "seller-apply" && (
          <>
            <LeafIcon className="h-4 w-4" />
            Enviar postulación
          </>
        )}
      </button>

      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : message.tone === "success"
                ? "border-olive-light/40 bg-olive-muted text-olive-dark"
                : "border-border-soft bg-cream-card text-stone-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function AuthPreparedFlows() {
  return (
    <section className="mt-8 grid gap-2 rounded-2xl border border-border-soft bg-cream-card p-5">
      <h3 className="text-sm font-semibold text-stone-800">Accesos preparados</h3>
      <p className="text-xs leading-relaxed text-stone-600">
        Verificación de email y recuperación de contraseña quedan preparadas como base técnica en Milestone 2.
        La integración completa de envío de correos se entrega en fases posteriores.
      </p>
      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        <Link
          href="/recuperar"
          className="rounded-full border border-olive bg-white px-3 py-1.5 font-semibold text-olive-dark hover:bg-olive hover:text-white"
        >
          Recuperar contraseña
        </Link>
        <Link
          href="/verificar-email"
          className="rounded-full border border-olive bg-white px-3 py-1.5 font-semibold text-olive-dark hover:bg-olive hover:text-white"
        >
          Verificar email
        </Link>
      </div>
    </section>
  );
}

export function AuthFooterLinks({ mode }: { mode: Mode }) {
  if (mode === "login") {
    return (
      <div className="mt-6 grid gap-3 text-center text-sm text-stone-600">
        <p>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-semibold text-olive-dark hover:text-olive">
            Crear cuenta comprador
          </Link>
        </p>
        <p>
          ¿Sos productor o emprendedor?{" "}
          <Link href="/seller/apply" className="font-semibold text-olive-dark hover:text-olive">
            Postulate aquí
          </Link>
        </p>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <p className="mt-6 text-center text-sm text-stone-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-olive-dark hover:text-olive">
          Ingresar
        </Link>
      </p>
    );
  }

  return (
    <p className="mt-6 text-center text-sm text-stone-600">
      ¿Ya postulaste antes?{" "}
      <Link href="/login" className="font-semibold text-olive-dark hover:text-olive">
        Ingresar a tu cuenta
      </Link>
    </p>
  );
}
