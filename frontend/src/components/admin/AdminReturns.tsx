"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReturnRequest } from "@/lib/api";
import {
  RETURN_STATUSES,
  getAdminReturns,
  money,
  orderStatusColor,
  orderStatusLabel,
  returnStatusColor,
  returnStatusLabel,
  updateAdminReturnStatus,
} from "@/lib/api";
import { PackageIcon, SearchIcon } from "@/components/ui/Icons";

export function AdminReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReturns();
      setReturns(data);
      setDrafts(Object.fromEntries(data.map((item) => [item.id, item.status])));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las devoluciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filteredReturns = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return returns;
    return returns.filter((item) => {
      const values = [
        item.id,
        item.reason,
        item.details,
        item.status,
        item.buyer?.name,
        item.buyer?.email,
        item.order?.order_number,
        item.order?.items?.map((orderItem) => orderItem.product_name).join(" "),
      ];
      return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
    });
  }, [query, returns]);

  const handleUpdate = useCallback(
    async (id: number) => {
      const status = drafts[id];
      if (!status) return;
      setBusyId(id);
      setError("");
      setSuccess("");
      try {
        const updated = await updateAdminReturnStatus(id, status);
        setReturns((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
        setSuccess(`Devolución #${updated.id} actualizada a ${returnStatusLabel(updated.status)}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la devolución.");
      } finally {
        setBusyId(null);
      }
    },
    [drafts],
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-stone-500">Cargando devoluciones...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative max-w-md flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por comprador, pedido, producto o motivo"
            className="w-full rounded-full border border-border-soft bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
          />
        </label>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {filteredReturns.length} devoluciones
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      {filteredReturns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
          <PackageIcon className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">No hay solicitudes de devolución.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredReturns.map((item) => (
            <ReturnCard
              key={item.id}
              item={item}
              draft={drafts[item.id] ?? item.status}
              busy={busyId === item.id}
              onDraftChange={(status) => setDrafts((prev) => ({ ...prev, [item.id]: status }))}
              onSave={() => handleUpdate(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReturnCard({
  item,
  draft,
  busy,
  onDraftChange,
  onSave,
}: {
  item: ReturnRequest;
  draft: string;
  busy: boolean;
  onDraftChange: (status: string) => void;
  onSave: () => void;
}) {
  const order = item.order;
  const productSummary = order?.items
    ?.map((orderItem) => `${orderItem.product_name} x ${orderItem.quantity}`)
    .join(", ");

  return (
    <article className="grid gap-4 rounded-2xl border border-border-soft bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-900">Devolución #{item.id}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${returnStatusColor(item.status)}`}>
              {returnStatusLabel(item.status)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-stone-800">{item.reason}</p>
          {item.details && <p className="mt-1 text-sm text-stone-600">{item.details}</p>}
          {item.created_at && (
            <p className="mt-2 text-xs text-stone-500">
              Solicitada el {new Date(item.created_at).toLocaleDateString("es-AR")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={draft}
            disabled={busy}
            onChange={(event) => onDraftChange(event.target.value)}
            className="rounded-full border border-border-soft px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-olive/30"
          >
            {RETURN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {returnStatusLabel(status)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || draft === item.status}
            onClick={onSave}
            className="rounded-full bg-olive px-4 py-2 text-xs font-semibold text-white transition hover:bg-olive-dark disabled:opacity-40"
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-cream-card p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Comprador</p>
          <p className="mt-1 font-semibold text-stone-900">{item.buyer?.name ?? "-"}</p>
          {item.buyer?.email && <p className="text-xs text-stone-500">{item.buyer.email}</p>}
        </div>
        {order && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Pedido</p>
            <p className="mt-1 font-semibold text-stone-900">{order.order_number}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(order.status)}`}>
                {orderStatusLabel(order.status)}
              </span>
              <span className="text-xs font-semibold text-olive-dark">{money(order.total_cents)}</span>
            </div>
          </div>
        )}
      </div>

      {productSummary && (
        <div className="rounded-xl border border-border-soft p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Productos</p>
          <p className="mt-1 text-stone-700">{productSummary}</p>
        </div>
      )}
    </article>
  );
}
