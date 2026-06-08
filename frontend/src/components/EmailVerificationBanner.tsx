"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, MessageIcon } from "@/components/ui/Icons";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

type Props = {
  email?: string;
  verified: boolean;
};

export function EmailVerificationBanner({ email, verified }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (verified || dismissed || !email) return null;

  async function resend() {
    setLoading(true);
    setFeedback(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("mercado_token") : null;
      const response = await fetch(`${API_BASE}/auth/email/verify`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setFeedback("Te enviamos un email de verificacion. Revisa tu bandeja de entrada.");
      } else {
        setFeedback("No se pudo procesar la solicitud.");
      }
    } catch {
      setFeedback("No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <MessageIcon className="h-4 w-4" />
        </span>
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Verifica tu email</p>
          <p className="text-amber-800">
            Confirma <span className="font-semibold">{email}</span> para mejorar la seguridad de tu cuenta.
          </p>
          {feedback && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-amber-900">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              {feedback}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={resend}
          disabled={loading}
          className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? "Procesando..." : "Reenviar verificacion"}
        </button>
        <Link
          href="/verificar-email"
          className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          Mas info
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso"
          className="rounded-full px-2 text-amber-700 hover:bg-amber-100"
        >
          x
        </button>
      </div>
    </div>
  );
}
