"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { Order } from "@/lib/api";
import { getOrders, money, orderStatusLabel, orderStatusColor } from "@/lib/api";
import { PackageIcon, ChevronDownIcon } from "@/components/ui/Icons";

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

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">
          Cargando pedidos...
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
            Mis pedidos
          </h1>

          {orders.length === 0 ? (
            <div className="mt-12 text-center">
              <PackageIcon className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">
                No tenés pedidos todavía.
              </p>
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
                  <div
                    key={order.id}
                    className="rounded-2xl border border-border-soft bg-white overflow-hidden"
                  >
                    {/* Order header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream-card transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {order.order_number}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(order.status)}`}
                          >
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
                          {order.items?.length ?? 0}{" "}
                          {(order.items?.length ?? 0) === 1 ? "producto" : "productos"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-olive">
                          {money(order.total_cents)}
                        </span>
                        <ChevronDownIcon
                          className={`h-4 w-4 text-brown-icon transition ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-border-soft px-5 py-4 bg-cream-card">
                        {/* Items */}
                        <div className="divide-y divide-border-soft">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between py-2 text-sm">
                              <div>
                                <p className="font-medium text-foreground">
                                  {item.product_name}
                                </p>
                                <p className="text-xs text-brown-muted">
                                  {item.quantity} × {money(item.unit_price_cents)}
                                </p>
                                {item.product && (
                                  <Link
                                    href={`/products/${item.product.slug}`}
                                    className="text-xs text-olive hover:text-olive-dark transition"
                                  >
                                    Ver producto
                                  </Link>
                                )}
                              </div>
                              <span className="font-semibold text-foreground">
                                {money(item.line_total_cents)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery info */}
                        {(order.delivery_type ||
                          order.delivery_address ||
                          order.city ||
                          order.province) && (
                          <div className="mt-3 rounded-lg border border-border-soft bg-white p-3 text-sm">
                            <p className="font-medium text-foreground mb-1">
                              Datos de entrega
                            </p>
                            {order.delivery_type && (
                              <p className="text-brown-muted text-xs">
                                Tipo: {order.delivery_type}
                              </p>
                            )}
                            {order.province && (
                              <p className="text-brown-muted text-xs">
                                Provincia: {order.province}
                              </p>
                            )}
                            {order.city && (
                              <p className="text-brown-muted text-xs">
                                Ciudad: {order.city}
                              </p>
                            )}
                            {order.delivery_address && (
                              <p className="text-brown-muted text-xs">
                                Dirección: {order.delivery_address}
                              </p>
                            )}
                            {order.buyer_note && (
                              <p className="text-brown-muted text-xs mt-1">
                                Nota: {order.buyer_note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Status history */}
                        {order.status_history && order.status_history.length > 0 && (
                          <div className="mt-3 rounded-lg border border-border-soft bg-white p-3">
                            <p className="text-xs font-medium text-foreground mb-2">
                              Historial de estados
                            </p>
                            <ul className="space-y-1.5">
                              {order.status_history.map((entry) => (
                                <li
                                  key={entry.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className={`rounded-full px-2 py-0.5 font-semibold ${orderStatusColor(entry.status)}`}
                                  >
                                    {orderStatusLabel(entry.status)}
                                  </span>
                                  {entry.note && (
                                    <span className="text-brown-muted">
                                      {entry.note}
                                    </span>
                                  )}
                                  <span className="text-stone-400 ml-auto">
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

                        {/* Totals */}
                        <div className="mt-3 flex justify-between text-sm">
                          <span className="text-brown-muted">Subtotal</span>
                          <span className="font-medium text-foreground">
                            {money(order.subtotal_cents ?? order.total_cents)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-brown-muted">Envío</span>
                          <span className="text-brown-muted">
                            {order.delivery_cents ? money(order.delivery_cents) : "Sin costo"}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t border-border-soft">
                          <span>Total</span>
                          <span className="text-olive">{money(order.total_cents)}</span>
                        </div>
                      </div>
                    )}
                  </div>
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