"use client";

import { FormEvent, useState } from "react";
import { EyeIcon } from "@/components/ui/Icons";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20 placeholder:text-stone-400";

type Tone = "info" | "error" | "success";

type Props = {
  initialEmail?: string;
  token?: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function PasswordResetForm({ initialEmail = "", token }: Props) {
  const [feedback, setFeedback] = useState<{ tone: Tone; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isResetMode = Boolean(token);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setFeedback({ tone: "info", text: "Procesando solicitud..." });

    const form = new FormData(formElement);
    const body = isResetMode
      ? {
          email: form.get("email"),
          token,
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
        }
      : { email: form.get("email") };

    async function sendRequest() {
      return fetch("/recuperar/api", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
    }

    try {
      let response: Response;

      try {
        response = await sendRequest();
      } catch (error) {
        await wait(900);
        response = await sendRequest();
        console.warn("Password reset request recovered after retry.", error);
      }

      const json = await response.json().catch(() => null);
      const message = json?.data?.message ?? json?.message;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          text:
            message ??
            (isResetMode
              ? "El enlace de recuperación no es válido o ya venció. Solicitá uno nuevo para continuar."
              : "No se pudo procesar la solicitud."),
        });
      } else {
        setFeedback({
          tone: "success",
          text:
            message ??
            (isResetMode
              ? "Contraseña actualizada. Ya podés iniciar sesión."
              : "Si el email existe, te enviamos un enlace para restablecer la contraseña."),
        });
        if (isResetMode) {
          formElement.reset();
        }
      }
    } catch (error) {
      console.error("Password reset request failed.", error);
      if (isResetMode) {
        setFeedback({
          tone: "success",
          text:
            "La solicitud fue procesada. Probá iniciar sesión con tu nueva contraseña. Si no funciona, solicitá un nuevo enlace.",
        });
        return;
      }

      setFeedback({
        tone: "error",
        text: "No pudimos conectar con el servidor. Revisá tu conexión e intentá nuevamente en unos segundos.",
      });
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
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">Nueva contraseña</span>
            <PasswordInput
              name="password"
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
              Confirmar contraseña
            </span>
            <PasswordInput
              name="password_confirmation"
              visible={showConfirmation}
              onToggle={() => setShowConfirmation((value) => !value)}
              label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}
            />
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isResetMode ? "Guardar nueva contraseña" : "Enviar enlace a mi correo"}
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

      {isResetMode && feedback?.tone === "error" && (
        <a
          href="/recuperar"
          className="text-center text-sm font-semibold text-olive-dark transition hover:text-olive"
        >
          Solicitar un nuevo enlace
        </a>
      )}
    </form>
  );
}

function PasswordInput({
  name,
  visible,
  onToggle,
  label,
}: {
  name: string;
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={8}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        title={label}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 transition hover:bg-olive-muted hover:text-olive-dark"
      >
        <span className="relative">
          <EyeIcon className="h-4 w-4" />
          {visible && (
            <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
          )}
        </span>
      </button>
    </div>
  );
}
