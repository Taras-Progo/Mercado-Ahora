"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { parseApiMessage, producerStatusOf, roleHome, useAuth } from "@/components/AuthProvider";
import { applyAsSeller, type SellerApplyPayload } from "@/lib/api";
import { CheckCircleIcon, ClockIcon, EyeIcon, LeafIcon } from "@/components/ui/Icons";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

type Mode = "login" | "register" | "seller-apply";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20 placeholder:text-stone-400";

export function AuthPanel({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, user, ready, refresh } = useAuth();

  // A logged-in user reaching the producer application upgrades their existing
  // account instead of registering a brand-new one (no second email needed).
  const loggedIn = ready && !!user;
  const sellerUpgrade = mode === "seller-apply" && loggedIn;
  const producerStatus = producerStatusOf(user);

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

    // Existing account becoming a producer: authenticated upgrade.
    if (sellerUpgrade) {
      try {
        const result = await applyAsSeller(body as unknown as SellerApplyPayload);
        await refresh();
        setMessage({
          tone: "success",
          text: result.message ?? "Postulación enviada. Te avisaremos al aprobarla.",
        });
        router.push("/seller");
      } catch (err) {
        setMessage({ tone: "error", text: err instanceof Error ? err.message : "No se pudo enviar la postulación." });
      } finally {
        setLoading(false);
      }
      return;
    }

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

  // Avoid flashing the anonymous (email/password) form while auth state loads.
  if (mode === "seller-apply" && !ready) {
    return (
      <div className="grid gap-3">
        <div className="h-12 animate-pulse rounded-xl bg-cream-card" />
        <div className="h-12 animate-pulse rounded-xl bg-cream-card" />
        <div className="h-12 animate-pulse rounded-xl bg-cream-card" />
      </div>
    );
  }

  // Already applied / already a producer: show status instead of the form.
  if (sellerUpgrade && (producerStatus === "pending" || producerStatus === "active")) {
    return <ProducerStatusPanel status={producerStatus} />;
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {sellerUpgrade && (
        <div className="rounded-xl border border-olive-light/40 bg-olive-muted px-4 py-3 text-sm text-olive-dark">
          {producerStatus === "rejected" ? (
            <p>Tu postulación anterior fue rechazada. Podés volver a postularte con tu cuenta actual.</p>
          ) : (
            <p>
              Vas a postularte como productor con tu cuenta actual{user?.email ? ` (${user.email})` : ""}. Vas a poder
              comprar y vender desde la misma cuenta.
            </p>
          )}
        </div>
      )}

      {(mode === "register" || (mode === "seller-apply" && !sellerUpgrade)) && (
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

      {!sellerUpgrade && (
        <>
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
        </>
      )}

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
        className="btn-primary mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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

function ProducerStatusPanel({ status }: { status: "pending" | "active" }) {
  const pending = status === "pending";
  return (
    <div className="grid gap-4">
      <div
        className={`flex items-start gap-3 rounded-2xl border p-5 ${
          pending ? "border-amber-300 bg-amber-50" : "border-olive-light/40 bg-olive-muted"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            pending ? "bg-amber-100 text-amber-700" : "bg-white text-olive-dark"
          }`}
        >
          {pending ? <ClockIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
        </span>
        <div>
          <p className={`text-sm font-semibold ${pending ? "text-amber-900" : "text-olive-dark"}`}>
            {pending ? "Tu postulación está en revisión" : "¡Tu cuenta ya es productora!"}
          </p>
          <p className={`mt-1 text-sm ${pending ? "text-amber-800" : "text-olive-dark/80"}`}>
            {pending
              ? "Un administrador la evaluará pronto. Mientras tanto seguís pudiendo comprar con tu cuenta."
              : "Podés gestionar tus productos y pedidos desde el panel del productor, y seguir comprando normalmente."}
          </p>
        </div>
      </div>
      <Link
        href="/seller"
        className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
      >
        <LeafIcon className="h-4 w-4" />
        Ir a mi panel de productor
      </Link>
    </div>
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
      <h3 className="text-sm font-semibold text-stone-800">Acceso seguro</h3>
      <p className="text-xs leading-relaxed text-stone-600">
        La verificacion de email y la recuperacion de contrasena ya envian correos reales mediante Resend.
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
      <p className="mt-6 text-center text-sm text-stone-600">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-olive-dark hover:text-olive">
          Crear cuenta
        </Link>
      </p>
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
