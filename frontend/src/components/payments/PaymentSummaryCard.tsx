"use client";

import { useState } from "react";
import {
  money,
  paymentStatusColor,
  paymentStatusExplanation,
  paymentStatusLabel,
  retryPaymentIntent,
  type PaymentSummary,
} from "@/lib/api";

export function PaymentSummaryCard({ payment, allowRetry = false }: { payment: PaymentSummary; allowRetry?: boolean }) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const handleRetry = async () => {
    if (!payment.retry_allowed || retrying) return;
    setRetrying(true);
    setError("");
    try {
      const next = await retryPaymentIntent(payment.reference);
      window.location.assign(next.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos volver a iniciar el pago.");
      setRetrying(false);
    }
  };

  const paid = payment.status === "approved";

  return (
    <div className="mt-3 rounded-xl border border-border-soft bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">Mercado Pago</p>
          <p className="mt-0.5 text-xs text-brown-muted">{paid ? "Pago validado" : "Pago todavía no habilitado"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusColor(payment.status)}`}>
          {paymentStatusLabel(payment.status)}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-brown-muted">{paymentStatusExplanation(payment.status)}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3">
        <span className="text-xs text-stone-500">Importe</span>
        <span className="font-semibold text-foreground">{money(payment.amount_cents)}</span>
      </div>
      {payment.approved_at && (
        <p className="mt-2 text-xs text-stone-500">
          Aprobado el {new Date(payment.approved_at).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}
      {allowRetry && payment.retry_allowed && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-4 rounded-full bg-olive px-5 py-2 text-xs font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
        >
          {retrying ? "Preparando pago..." : "Reintentar pago"}
        </button>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
