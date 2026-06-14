"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Order } from "@/lib/api";
import {
  ADMIN_ORDER_STATUSES,
  deliveryTypeLabel,
  getAdminOrders,
  money,
  orderStatusColor,
  orderStatusLabel,
  returnStatusColor,
  returnStatusLabel,
  updateAdminOrderStatus,
} from "@/lib/api";
import { ChevronDownIcon, PackageIcon, SearchIcon } from "@/components/ui/Icons";

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
      setDrafts(Object.fromEntries(data.map((order) => [order.id, order.status])));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const values = [
        order.order_number,
        order.status,
        order.buyer?.name,
        order.buyer?.email,
        order.items?.map((item) => item.product_name).join(" "),
      ];
      return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
    });
  }, [orders, query]);

  const handleUpdate = useCallback(
    async (id: number) => {
      const status = drafts[id];
      if (!status) return;
      setBusyId(id);
      setError("");
      setSuccess("");
      try {
        const updated = await updateAdminOrderStatus(id, status, notes[id]?.trim() || undefined);
        setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updated } : order)));
        setNotes((prev) => ({ ...prev, [id]: "" }));
        setSuccess(`Pedido ${updated.order_number} actualizado a ${orderStatusLabel(updated.status)}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
      } finally {
        setBusyId(null);
      }
    },
    [drafts, notes],
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-stone-500">Cargando pedidos...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative max-w-md flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por pedido, comprador, producto o estado"
            className="w-full rounded-full border border-border-soft bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
          />
        </label>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {filteredOrders.length} pedidos
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
          <PackageIcon className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">No hay pedidos para mostrar.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const itemSummary = order.items?.[0]
              ? `${order.items[0].product_name}${(order.items.length ?? 0) > 1 ? ` + ${(order.items.length ?? 1) - 1} más` : ""}`
              : "Sin productos";

            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-border-soft bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-cream-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-stone-900">{order.order_number}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusColor(order.status)}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{order.buyer?.name ?? "Comprador"} · {itemSummary}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString("es-AR") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-olive-dark">{money(order.total_cents)}</span>
                    <ChevronDownIcon className={`h-4 w-4 text-stone-400 transition ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid gap-5 border-t border-border-soft bg-cream-card px-5 py-4">
                    <section className="grid gap-3 rounded-xl bg-white p-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Comprador</p>
                        <p className="mt-1 font-semibold text-stone-900">{order.buyer?.name ?? "-"}</p>
                        {order.buyer?.email && <p className="text-xs text-stone-500">{order.buyer.email}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Entrega</p>
                        <p className="mt-1 text-stone-700">{deliveryTypeLabel(order.delivery_type) || "A coordinar"}</p>
                        <p className="text-xs text-stone-500">
                          {[order.delivery_address, order.city, order.province].filter(Boolean).join(", ") || "Sin dirección cargada"}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Productos</p>
                      <ul className="mt-2 divide-y divide-border-soft">
                        {order.items?.map((item) => (
                          <li key={item.id} className="flex justify-between gap-4 py-2 text-sm">
                            <span className="text-stone-700">{item.product_name} x {item.quantity}</span>
                            <span className="font-semibold text-stone-900">{money(item.line_total_cents)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {order.return_requests && order.return_requests.length > 0 && (
                      <section className="rounded-xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Devoluciones</p>
                        <div className="mt-2 grid gap-2">
                          {order.return_requests.map((returnRequest) => (
                            <div key={returnRequest.id} className="rounded-xl border border-border-soft p-3 text-sm">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${returnStatusColor(returnRequest.status)}`}>
                                {returnStatusLabel(returnRequest.status)}
                              </span>
                              <p className="mt-2 font-medium text-stone-900">{returnRequest.reason}</p>
                              {returnRequest.details && <p className="mt-1 text-xs text-stone-500">{returnRequest.details}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {order.status_history && order.status_history.length > 0 && (
                      <section className="rounded-xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Historial</p>
                        <ul className="mt-2 grid gap-2">
                          {order.status_history.map((entry) => (
                            <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                              <span className={`rounded-full px-2.5 py-0.5 font-semibold ${orderStatusColor(entry.status)}`}>
                                {orderStatusLabel(entry.status)}
                              </span>
                              {entry.note && <span>{entry.note}</span>}
                              <span>{new Date(entry.created_at).toLocaleDateString("es-AR")}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <label className="grid gap-1 text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Estado</span>
                        <select
                          value={drafts[order.id] ?? order.status}
                          onChange={(event) => setDrafts((prev) => ({ ...prev, [order.id]: event.target.value }))}
                          className="rounded-full border border-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-olive/30"
                        >
                          {ADMIN_ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {orderStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Nota interna</span>
                        <input
                          value={notes[order.id] ?? ""}
                          onChange={(event) => setNotes((prev) => ({ ...prev, [order.id]: event.target.value }))}
                          placeholder="Motivo o comentario"
                          className="rounded-full border border-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-olive/30"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busyId === order.id || (drafts[order.id] === order.status && !notes[order.id]?.trim())}
                        onClick={() => handleUpdate(order.id)}
                        className="rounded-full bg-olive px-5 py-2 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-40"
                      >
                        {busyId === order.id ? "Guardando..." : "Guardar"}
                      </button>
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
