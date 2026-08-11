"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@/components/ui/Icons";
import {
  getPaymentIntent,
  money,
  paymentStatusColor,
  paymentStatusExplanation,
  paymentStatusLabel,
  retryPaymentIntent,
  type PaymentSummary,
} from "@/lib/api";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export function PaymentReturn({ initialView }: { initialView: "approved" | "pending" | "failed" }) {
  return (
    <RoleGuard roles={["buyer", "seller"]}>
      <PaymentReturnContent initialView={initialView} />
    </RoleGuard>
  );
}

function PaymentReturnContent({ initialView }: { initialView: "approved" | "pending" | "failed" }) {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference")?.trim() ?? "";
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollFinished, setPollFinished] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!reference) {
      setError("No encontramos la referencia interna de este pago.");
      setLoading(false);
      return null;
    }

    try {
      const current = await getPaymentIntent(reference);
      setPayment(current);
      setError("");
      return current;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos consultar el estado del pago.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    const poll = async () => {
      const current = await fetchStatus();
      if (cancelled) return;
      attempts += 1;

      if (current && current.status !== "pending") {
        setPollFinished(true);
        return;
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setPollFinished(true);
        return;
      }

      timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [fetchStatus]);

  const handleRetry = async () => {
    if (!payment?.retry_allowed || retrying) return;
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

  const status = payment?.status;
  const confirming = loading || (!pollFinished && (!status || status === "pending"));
  const displayStatus = status ?? (initialView === "approved" ? "pending" : initialView === "failed" ? "failed" : "pending");
  const Icon = displayStatus === "approved" ? CheckCircleIcon : displayStatus === "pending" ? ClockIcon : XCircleIcon;

  return (
    <>
      <SiteHeader />
      <main className="min-h-[65vh] bg-background px-4 py-12 sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl border border-border-soft bg-white p-6 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive-muted text-olive-dark">
            <Icon className="h-7 w-7" />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-olive-dark">Mercado Pago</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-foreground">
            {confirming ? "Estamos confirmando tu pago" : paymentStatusLabel(displayStatus)}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brown-muted">
            {confirming
              ? "La confirmación se realiza con la información segura de Mercado Pago. Puede tardar unos instantes."
              : paymentStatusExplanation(displayStatus)}
          </p>

          {payment && (
            <div className="mt-6 rounded-xl border border-border-soft bg-cream-card p-4 text-left text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-brown-muted">Estado</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusColor(payment.status)}`}>
                  {paymentStatusLabel(payment.status)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-brown-muted">Importe</span>
                <span className="font-semibold text-foreground">{money(payment.amount_cents)}</span>
              </div>
              <p className="mt-3 break-all text-xs text-stone-500">Referencia: {payment.reference}</p>
            </div>
          )}

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {payment?.retry_allowed && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
              >
                {retrying ? "Preparando pago..." : "Reintentar pago"}
              </button>
            )}
            <Link href="/orders" className="rounded-full border border-olive px-6 py-3 text-sm font-semibold text-olive-dark transition hover:bg-olive-muted">
              Ver mis pedidos
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
