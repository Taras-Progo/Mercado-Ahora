"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { SellerBackLink } from "@/components/seller/SellerBackLink";
import { getSellerOrders, type Order, type PaymentSummary } from "@/lib/api";

type SellerPayment = PaymentSummary & { linkedOrders: Order[] };

export default function SellerPaymentsPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="min-h-[60vh] bg-background py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerPaymentsView />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SellerPaymentsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSellerOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const payments = useMemo(() => {
    const grouped = new Map<string, SellerPayment>();
    for (const order of orders) {
      const payment = order.payment_summary;
      if (!payment || payment.provider !== "mercado_pago") continue;
      const existing = grouped.get(payment.reference);
      if (existing) {
        existing.linkedOrders.push(order);
      } else {
        grouped.set(payment.reference, { ...payment, linkedOrders: [order] });
      }
    }
    return Array.from(grouped.values());
  }, [orders]);

  return (
    <div className="grid gap-6">
      <div>
        <SellerBackLink className="mb-6" />
        <h1 className="font-serif text-3xl font-bold text-stone-900">Pagos y cobros</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Consultá el estado validado de los pagos de Mercado Pago asociados a tus pedidos.
        </p>
      </div>

      <div className="rounded-xl border border-border-soft bg-cream-card px-4 py-3 text-sm text-stone-700">
        Mercado Ahora confirma los pagos desde el servidor. Prepará y enviá un pedido únicamente cuando figure como pago aprobado.
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-12 text-center text-sm text-stone-500">Cargando pagos...</p>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-white p-10 text-center">
          <h2 className="font-serif text-xl font-semibold text-stone-800">Todavía no hay pagos online</h2>
          <p className="mt-2 text-sm text-stone-500">Los pagos aparecerán acá cuando un comprador inicie Mercado Pago.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <article key={payment.reference} className="rounded-2xl border border-border-soft bg-white p-4">
              <PaymentSummaryCard payment={payment} />
              <div className="mt-4 border-t border-border-soft pt-4">
                <p className="text-xs font-semibold uppercase text-stone-500">Pedidos asociados</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {payment.linkedOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={"/seller/orders?order=" + order.id}
                      className="rounded-full border border-olive/30 px-3 py-1.5 text-xs font-semibold text-olive-dark transition hover:bg-olive-muted"
                    >
                      {order.order_number}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
