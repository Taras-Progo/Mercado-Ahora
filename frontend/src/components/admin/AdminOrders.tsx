"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/lib/api";
import {
  getAdminOrders,
  updateAdminOrderStatus,
  money,
  orderStatusLabel,
  orderStatusColor,
  SELLER_ORDER_STATUSES,
} from "@/lib/api";
import { PackageIcon } from "@/components/ui/Icons";

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
      setDrafts(Object.fromEntries(data.map((o) => [o.id, o.status])));
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

  const handleUpdate = useCallback(
    async (id: number) => {
      const status = drafts[id];
      if (!status) return;
      setBusyId(id);
      setError("");
      try {
        const updated = await updateAdminOrderStatus(id, status);
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
      } finally {
        setBusyId(null);
      }
    },
    [drafts],
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-stone-500">Cargando pedidos...</div>;
  }

  return (
    <div className="grid gap-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
          <PackageIcon className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">No hay pedidos todavía</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-soft bg-cream-card text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Comprador</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Cambiar estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-card/50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-800">{order.order_number}</p>
                      <p className="text-xs text-stone-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("es-AR")
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{order.buyer?.name ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-olive-dark">{money(order.total_cents)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${orderStatusColor(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={drafts[order.id] ?? order.status}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          className="rounded-full border border-border-soft px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-olive/30"
                        >
                          {SELLER_ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {orderStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busyId === order.id || drafts[order.id] === order.status}
                          onClick={() => handleUpdate(order.id)}
                          className="rounded-full bg-olive px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-olive-dark disabled:opacity-40"
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
