"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SellerBackLink } from "@/components/seller/SellerBackLink";
import type { Order } from "@/lib/api";
import {
  getSellerOrders,
  getSellerOrder,
  updateSellerOrderStatus,
  createSellerOrderConversation,
  money,
  orderStatusLabel,
  orderStatusColor,
  deliveryTypeLabel,
  SELLER_ORDER_STATUSES,
} from "@/lib/api";
import { PackageIcon, ChevronDownIcon, MapPinIcon, MessageIcon, CheckCircleIcon } from "@/components/ui/Icons";

export default function SellerOrdersPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerOrdersView />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SellerOrdersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedOrderId = searchParams.get("order") ? Number(searchParams.get("order")) : null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [creatingConversationId, setCreatingConversationId] = useState<number | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const autoOpenedOrderRef = useRef<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSellerOrders();
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = useCallback(
    async (order: Order) => {
      if (expandedId === order.id) {
        setExpandedId(null);
        setDetail(null);
        return;
      }
      setExpandedId(order.id);
      setDetail(null);
      setStatusDraft(order.status);
      setDetailLoading(true);
      try {
        const full = await getSellerOrder(order.id);
        setDetail(full);
        setStatusDraft(full.status);
      } catch {
        setDetail(order);
      } finally {
        setDetailLoading(false);
      }
    },
    [expandedId],
  );

  useEffect(() => {
    if (!requestedOrderId || loading || autoOpenedOrderRef.current === requestedOrderId) return;
    const order = orders.find((item) => item.id === requestedOrderId);
    if (!order) return;

    autoOpenedOrderRef.current = requestedOrderId;
    const timeout = window.setTimeout(() => {
      void toggleExpand(order);
      document.getElementById(`seller-order-${requestedOrderId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    return () => window.clearTimeout(timeout);
  }, [loading, orders, requestedOrderId, toggleExpand]);

  const handleUpdateStatus = useCallback(
    async (orderId: number) => {
      if (!statusDraft) return;
      setSavingStatus(true);
      setError("");
      setSuccess("");
      try {
        const updated = await updateSellerOrderStatus(orderId, statusDraft);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)),
        );
        setDetail((prev) =>
          prev
            ? { ...prev, status: updated.status, status_history: updated.status_history ?? prev.status_history }
            : prev,
        );
        setStatusDraft(updated.status);
        setSuccess(`Estado actualizado a ${orderStatusLabel(updated.status)}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
      } finally {
        setSavingStatus(false);
      }
    },
    [statusDraft],
  );

  const handleStartConversation = useCallback(
    async (orderId: number) => {
      setCreatingConversationId(orderId);
      setError("");
      setSuccess("");
      try {
        const conversation = await createSellerOrderConversation(orderId);
        router.push(`/chat?id=${conversation.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo abrir el chat del pedido.");
      } finally {
        setCreatingConversationId(null);
      }
    },
    [router],
  );

  if (loading) {
    return <div className="py-16 text-center text-sm text-stone-500">Cargando pedidos...</div>;
  }

  return (
    <div>
      <SellerBackLink className="mb-6" />
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Pedidos recibidos</h1>
        <p className="mt-1 text-sm text-stone-600">
          Gestioná los pedidos de tus productos y actualizá su estado de entrega.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-full bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-olive-muted px-4 py-2 text-center text-sm font-semibold text-olive-dark">
          <CheckCircleIcon className="h-4 w-4" />
          {success}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border-soft bg-white p-12 text-center">
          <PackageIcon className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-4 text-lg font-semibold text-stone-700">No tenés pedidos todavía</h3>
          <p className="mt-1 text-sm text-stone-500">
            Cuando un comprador realice un pedido de tus productos, aparecerá acá.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const itemCount = order.items?.reduce((sum, it) => sum + it.quantity, 0) ?? 0;
            return (
              <div
                key={order.id}
                id={`seller-order-${order.id}`}
                className="overflow-hidden rounded-2xl border border-border-soft bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(order)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-cream-card"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Pedido {order.order_number}
                    </p>
                    <p className="mt-0.5 text-xs text-brown-muted">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                      {" · "}
                      {itemCount} {itemCount === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(order.status)}`}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                    <span className="text-sm font-bold text-olive">
                      {money(order.total_cents)}
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-stone-400 transition ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border-soft px-5 py-4">
                    {detailLoading ? (
                      <p className="py-4 text-center text-sm text-stone-500">Cargando detalle...</p>
                    ) : (
                      <div className="space-y-5">
                        {/* Buyer */}
                        {detail?.buyer && (
                          <div className="text-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                              Comprador
                            </p>
                            <p className="mt-1 font-medium text-foreground">{detail.buyer.name}</p>
                            {detail.buyer.email && (
                              <p className="text-xs text-brown-muted">{detail.buyer.email}</p>
                            )}
                          </div>
                        )}

                        {/* Items */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Productos
                          </p>
                          <ul className="mt-2 divide-y divide-border-soft">
                            {(detail?.items ?? order.items)?.map((item) => (
                              <li key={item.id} className="flex justify-between py-2 text-sm">
                                <span className="text-brown-muted">
                                  {item.product?.slug ? (
                                    <Link
                                      href={`/products/${item.product.slug}`}
                                      className="hover:text-olive transition"
                                    >
                                      {item.product_name}
                                    </Link>
                                  ) : (
                                    item.product_name
                                  )}{" "}
                                  × {item.quantity}
                                </span>
                                <span className="font-medium text-foreground">
                                  {money(item.line_total_cents)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Delivery */}
                        {(detail?.delivery_type || detail?.delivery_address || detail?.city) && (
                          <div className="rounded-xl bg-cream-card p-3 text-sm">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                              <MapPinIcon className="h-3.5 w-3.5" />
                              Entrega
                            </p>
                            <p className="mt-1 text-brown-muted">
                              {deliveryTypeLabel(detail?.delivery_type) || "A coordinar"}
                              {detail?.delivery_address ? ` · ${detail.delivery_address}` : ""}
                              {detail?.city ? `, ${detail.city}` : ""}
                              {detail?.province ? `, ${detail.province}` : ""}
                            </p>
                            {detail?.buyer_note && (
                              <p className="mt-1 text-xs text-brown-muted italic">
                                Nota: {detail.buyer_note}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-3 rounded-xl border border-border-soft bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Comunicación con el comprador</p>
                            <p className="text-xs text-brown-muted">
                              Usá este chat para coordinar entrega, consultas y detalles del pedido.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartConversation(order.id)}
                            disabled={creatingConversationId === order.id}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-olive bg-white px-4 py-2 text-sm font-semibold text-olive transition hover:bg-olive-muted disabled:opacity-50"
                          >
                            <MessageIcon className="h-4 w-4" />
                            {creatingConversationId === order.id ? "Abriendo chat..." : "Enviar mensaje al comprador"}
                          </button>
                        </div>

                        {/* Status update */}
                        <div className="flex flex-col gap-2 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-stone-700">Estado:</label>
                            <select
                              value={statusDraft}
                              onChange={(e) => setStatusDraft(e.target.value)}
                              className="rounded-full border border-border-soft px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-olive/30"
                            >
                              {SELLER_ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {orderStatusLabel(s)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id)}
                            disabled={savingStatus || statusDraft === detail?.status}
                            className="rounded-full bg-olive px-5 py-2 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
                          >
                            {savingStatus ? "Guardando..." : "Actualizar estado"}
                          </button>
                        </div>

                        {/* Status history */}
                        {detail?.status_history && detail.status_history.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                              Historial
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {detail.status_history.map((h) => (
                                <li key={h.id} className="flex items-center gap-2 text-xs text-brown-muted">
                                  <span
                                    className={`rounded-full px-2 py-0.5 font-semibold ${orderStatusColor(h.status)}`}
                                  >
                                    {orderStatusLabel(h.status)}
                                  </span>
                                  {h.note && <span>{h.note}</span>}
                                  <span className="text-stone-400">
                                    {new Date(h.created_at).toLocaleDateString("es-AR", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
