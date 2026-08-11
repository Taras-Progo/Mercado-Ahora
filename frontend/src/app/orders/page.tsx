"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import type { Order } from "@/lib/api";
import {
  deliveryTypeLabel,
  getOrders,
  money,
  orderStatusColor,
  orderStatusLabel,
  requestReturn,
  returnStatusColor,
  returnStatusLabel,
} from "@/lib/api";
import { ChevronDownIcon, PackageIcon } from "@/components/ui/Icons";

type ReturnDraft = {
  reason: string;
  details: string;
};

export default function OrdersPage() {
  return (
    <RoleGuard roles={["buyer", "seller"]}>
      <OrdersContent />
    </RoleGuard>
  );
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [returnDrafts, setReturnDrafts] = useState<Record<number, ReturnDraft>>({});
  const [submittingReturnId, setSubmittingReturnId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, { tone: "success" | "error"; text: string }>>({});

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateDraft = (orderId: number, field: keyof ReturnDraft, value: string) => {
    setReturnDrafts((prev) => ({
      ...prev,
      [orderId]: {
        reason: prev[orderId]?.reason ?? "",
        details: prev[orderId]?.details ?? "",
        [field]: value,
      },
    }));
  };

  const submitReturn = async (orderId: number) => {
    const draft = returnDrafts[orderId];
    if (!draft?.reason.trim()) {
      setFeedback((prev) => ({
        ...prev,
        [orderId]: { tone: "error", text: "Contanos el motivo de la devolución." },
      }));
      return;
    }

    setSubmittingReturnId(orderId);
    setFeedback((prev) => ({ ...prev, [orderId]: { tone: "success", text: "" } }));
    try {
      const created = await requestReturn(orderId, {
        reason: draft.reason.trim(),
        details: draft.details.trim() || undefined,
      });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, return_requests: [...(order.return_requests ?? []), created] }
            : order,
        ),
      );
      setReturnDrafts((prev) => ({ ...prev, [orderId]: { reason: "", details: "" } }));
      setFeedback((prev) => ({
        ...prev,
        [orderId]: { tone: "success", text: "Solicitud enviada. Administración revisará la devolución." },
      }));
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [orderId]: {
          tone: "error",
          text: err instanceof Error ? err.message : "No se pudo solicitar la devolución.",
        },
      }));
    } finally {
      setSubmittingReturnId(null);
    }
  };

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">Cargando pedidos...</main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">Mis pedidos</h1>
              <p className="text-sm text-brown-muted">Seguí tus compras, estados y devoluciones.</p>
            </div>
            <Link href="/returns" className="text-sm font-semibold text-olive-dark hover:underline">
              Ver mis devoluciones
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-12 text-center">
              <PackageIcon className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">Todavía no tenés pedidos.</p>
              <Link
                href="/categorias"
                className="mt-4 inline-block rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedIds.has(order.id);
                return (
                  <article key={order.id} className="overflow-hidden rounded-2xl border border-border-soft bg-white">
                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-cream-card"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold text-foreground">{order.order_number}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(order.status)}`}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-brown-muted">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : ""}
                          {" · "}
                          {order.items?.length ?? 0} {(order.items?.length ?? 0) === 1 ? "producto" : "productos"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-olive">{money(order.total_cents)}</span>
                        <ChevronDownIcon className={`h-4 w-4 text-brown-icon transition ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <OrderDetails
                        order={order}
                        draft={returnDrafts[order.id]}
                        feedback={feedback[order.id]}
                        submittingReturn={submittingReturnId === order.id}
                        onDraftChange={(field, value) => updateDraft(order.id, field, value)}
                        onSubmitReturn={() => submitReturn(order.id)}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function OrderDetails({
  order,
  draft,
  feedback,
  submittingReturn,
  onDraftChange,
  onSubmitReturn,
}: {
  order: Order;
  draft?: ReturnDraft;
  feedback?: { tone: "success" | "error"; text: string };
  submittingReturn: boolean;
  onDraftChange: (field: keyof ReturnDraft, value: string) => void;
  onSubmitReturn: () => void;
}) {
  const returnRequest = order.return_requests?.[0];
  const canRequestReturn = order.status === "delivered" && !returnRequest;
  const itemCount = useMemo(() => order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [order.items]);

  return (
    <div className="border-t border-border-soft bg-cream-card px-5 py-4">
      <div className="divide-y divide-border-soft">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 py-2 text-sm">
            <div>
              <p className="font-medium text-foreground">{item.product_name}</p>
              <p className="text-xs text-brown-muted">
                {item.quantity} x {money(item.unit_price_cents)}
              </p>
              {item.product && (
                <Link href={`/products/${item.product.slug}`} className="text-xs text-olive transition hover:text-olive-dark">
                  Ver producto
                </Link>
              )}
            </div>
            <span className="font-semibold text-foreground">{money(item.line_total_cents)}</span>
          </div>
        ))}
      </div>

      {order.payment_summary && <PaymentSummaryCard payment={order.payment_summary} allowRetry />}

      {(order.delivery_type || order.delivery_address || order.city || order.province) && (
        <div className="mt-3 rounded-lg border border-border-soft bg-white p-3 text-sm">
          <p className="mb-1 font-medium text-foreground">Datos de entrega</p>
          {order.delivery_type && <p className="text-xs text-brown-muted">Tipo: {deliveryTypeLabel(order.delivery_type) || "A coordinar"}</p>}
          {order.province && <p className="text-xs text-brown-muted">Provincia: {order.province}</p>}
          {order.city && <p className="text-xs text-brown-muted">Ciudad: {order.city}</p>}
          {order.delivery_address && <p className="text-xs text-brown-muted">Dirección: {order.delivery_address}</p>}
          {order.buyer_note && <p className="mt-1 text-xs text-brown-muted">Nota: {order.buyer_note}</p>}
        </div>
      )}

      {order.status_history && order.status_history.length > 0 && (
        <div className="mt-3 rounded-lg border border-border-soft bg-white p-3">
          <p className="mb-2 text-xs font-medium text-foreground">Historial de estados</p>
          <ul className="space-y-1.5">
            {order.status_history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${orderStatusColor(entry.status)}`}>
                  {orderStatusLabel(entry.status)}
                </span>
                {entry.note && <span className="text-brown-muted">{entry.note}</span>}
                <span className="ml-auto text-stone-400">
                  {new Date(entry.created_at).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-border-soft bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Devolución</p>
        {returnRequest ? (
          <div className="mt-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${returnStatusColor(returnRequest.status)}`}>
              {returnStatusLabel(returnRequest.status)}
            </span>
            <p className="mt-2 text-sm font-medium text-foreground">{returnRequest.reason}</p>
            {returnRequest.details && <p className="mt-1 text-xs text-brown-muted">{returnRequest.details}</p>}
          </div>
        ) : canRequestReturn ? (
          <div className="mt-3 grid gap-3">
            <input
              value={draft?.reason ?? ""}
              onChange={(event) => onDraftChange("reason", event.target.value)}
              placeholder="Motivo de la devolución"
              className="rounded-xl border border-border-soft px-4 py-2.5 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <textarea
              value={draft?.details ?? ""}
              onChange={(event) => onDraftChange("details", event.target.value)}
              placeholder="Detalles adicionales (opcional)"
              className="min-h-24 resize-none rounded-xl border border-border-soft px-4 py-2.5 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <button
              type="button"
              onClick={onSubmitReturn}
              disabled={submittingReturn}
              className="justify-self-start rounded-full bg-olive px-5 py-2 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
            >
              {submittingReturn ? "Enviando..." : "Solicitar devolución"}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-brown-muted">La devolución se habilita cuando el pedido figura como entregado.</p>
        )}
        {feedback?.text && (
          <p className={`mt-3 rounded-xl px-4 py-2 text-sm ${feedback.tone === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {feedback.text}
          </p>
        )}
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <span className="text-brown-muted">Productos</span>
        <span className="font-medium text-foreground">{itemCount}</span>
      </div>
      <div className="mt-1 flex justify-between text-sm">
        <span className="text-brown-muted">Subtotal</span>
        <span className="font-medium text-foreground">{money(order.subtotal_cents ?? order.total_cents)}</span>
      </div>
      <div className="mt-1 flex justify-between text-sm">
        <span className="text-brown-muted">Envío</span>
        <span className="text-brown-muted">{order.delivery_cents ? money(order.delivery_cents) : "Sin costo"}</span>
      </div>
      <div className="mt-2 flex justify-between border-t border-border-soft pt-2 text-base font-semibold">
        <span>Total</span>
        <span className="text-olive">{money(order.total_cents)}</span>
      </div>
    </div>
  );
}
