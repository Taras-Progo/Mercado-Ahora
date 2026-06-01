"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import {
  getAdminProducts,
  approveAdminProduct,
  rejectAdminProduct,
  updateAdminProductStatus,
  money,
  statusColor,
  statusLabel,
} from "@/lib/api";
import { BagIcon, CheckCircleIcon, PauseIcon, SearchIcon, XCircleIcon } from "@/components/ui/Icons";

type StatusFilter = "all" | "active" | "pending" | "paused" | "draft" | "rejected";

const filters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "active", label: "Activos" },
  { id: "paused", label: "Pausados" },
  { id: "draft", label: "Borradores" },
  { id: "rejected", label: "Rechazados" },
];

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getAdminProducts());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const runAction = useCallback(
    async (id: number, action: () => Promise<Product>) => {
      setBusyId(id);
      setError("");
      try {
        const updated = await action();
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el producto.");
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const filtered = products.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.producer_profile?.business_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                filter === f.id
                  ? "bg-olive-dark text-white"
                  : "border border-border-soft bg-white text-stone-700 hover:border-olive hover:text-olive-dark"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto o productor"
            className="w-full rounded-full border border-border-soft bg-cream-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-stone-500">Cargando productos...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
          <BagIcon className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">No hay productos en esta vista</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-soft bg-cream-card text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Productor</th>
                  <th className="px-5 py-3">Precio</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-cream-card/50 transition">
                    <td className="px-5 py-4">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-semibold text-stone-800 hover:text-olive transition"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {product.producer_profile?.business_name ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-olive-dark">{money(product.price_cents)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor(product.status)}`}
                      >
                        {statusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {product.status !== "active" && (
                          <button
                            type="button"
                            disabled={busyId === product.id}
                            onClick={() => runAction(product.id, () => approveAdminProduct(product.id))}
                            className="inline-flex items-center gap-1 rounded-lg p-2 text-stone-400 transition hover:text-emerald-600 disabled:opacity-40"
                            title="Aprobar / activar"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {product.status === "active" && (
                          <button
                            type="button"
                            disabled={busyId === product.id}
                            onClick={() => runAction(product.id, () => updateAdminProductStatus(product.id, "paused"))}
                            className="inline-flex items-center gap-1 rounded-lg p-2 text-stone-400 transition hover:text-amber-600 disabled:opacity-40"
                            title="Pausar"
                          >
                            <PauseIcon className="h-4 w-4" />
                          </button>
                        )}
                        {product.status !== "rejected" && (
                          <button
                            type="button"
                            disabled={busyId === product.id}
                            onClick={() => runAction(product.id, () => rejectAdminProduct(product.id))}
                            className="inline-flex items-center gap-1 rounded-lg p-2 text-stone-400 transition hover:text-red-500 disabled:opacity-40"
                            title="Rechazar"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
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
