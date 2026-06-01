"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReturnRequest } from "@/lib/api";
import { getAdminReturns, updateAdminReturnStatus } from "@/lib/api";
import { PackageIcon } from "@/components/ui/Icons";

const RETURN_STATUSES = ["open", "approved", "rejected", "completed"] as const;

const statusLabels: Record<string, string> = {
  open: "Abierto",
  approved: "Aprobado",
  rejected: "Rechazado",
  completed: "Completado",
};

const statusColors: Record<string, string> = {
  open: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-stone-200 text-stone-700",
};

export function AdminReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReturns(await getAdminReturns());
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

  const handleUpdate = useCallback(async (id: number, status: string) => {
    setBusyId(id);
    setError("");
    try {
      const updated = await updateAdminReturnStatus(id, status);
      setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la devolución.");
    } finally {
      setBusyId(null);
    }
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-sm text-stone-500">Cargando devoluciones...</div>;
  }

  return (
    <div className="grid gap-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {returns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
          <PackageIcon className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">No hay solicitudes de devolución</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {returns.map((r) => (
            <article
              key={r.id}
              className="grid gap-3 rounded-2xl border border-border-soft bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-stone-800">
                    Devolución #{r.id} · Pedido {r.order_id}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[r.status] ?? "bg-stone-100 text-stone-600"}`}
                  >
                    {statusLabels[r.status] ?? r.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{r.reason}</p>
                {r.details && <p className="mt-1 text-xs text-stone-500">{r.details}</p>}
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <select
                  defaultValue={r.status}
                  disabled={busyId === r.id}
                  onChange={(e) => handleUpdate(r.id, e.target.value)}
                  className="rounded-full border border-border-soft px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-olive/30"
                >
                  {RETURN_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
