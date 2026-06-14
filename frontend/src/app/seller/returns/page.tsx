"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SellerBackLink } from "@/components/seller/SellerBackLink";
import type { ReturnRequest } from "@/lib/api";
import { getSellerReturns, money, orderStatusColor, orderStatusLabel, returnStatusColor, returnStatusLabel } from "@/lib/api";
import { PackageIcon } from "@/components/ui/Icons";

export default function SellerReturnsPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerReturnsContent />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SellerReturnsContent() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReturns(await getSellerReturns());
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

  const openCount = useMemo(() => returns.filter((item) => item.status === "open").length, [returns]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-stone-500">Cargando devoluciones...</div>;
  }

  return (
    <div>
      <SellerBackLink className="mb-6" />
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Devoluciones recibidas</h1>
        <p className="mt-1 text-sm text-stone-600">
          Solicitudes vinculadas a pedidos que incluyen tus productos. Administración define la resolución final.
        </p>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Stat label="Solicitudes" value={returns.length} />
        <Stat label="Pendientes" value={openCount} />
      </div>

      {returns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-white p-10 text-center">
          <PackageIcon className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">No tenés devoluciones recibidas.</p>
          <p className="mt-1 text-xs text-stone-500">Cuando un comprador solicite una devolución de tus productos, aparecerá acá.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {returns.map((item) => (
            <SellerReturnCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function SellerReturnCard({ item }: { item: ReturnRequest }) {
  const order = item.order;
  const productSummary = order?.items
    ?.map((orderItem) => `${orderItem.product_name} x ${orderItem.quantity}`)
    .join(", ");

  return (
    <article className="rounded-2xl border border-border-soft bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Devolución #{item.id}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${returnStatusColor(item.status)}`}>
              {returnStatusLabel(item.status)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-stone-800">{item.reason}</p>
          {item.details && <p className="mt-1 text-sm text-brown-muted">{item.details}</p>}
          {item.buyer && <p className="mt-2 text-xs text-stone-500">Comprador: {item.buyer.name}</p>}
        </div>
        {order && (
          <Link
            href={`/seller/orders?order=${order.id}`}
            className="rounded-full border border-olive px-4 py-2 text-sm font-semibold text-olive-dark transition hover:bg-olive-muted"
          >
            Ver pedido
          </Link>
        )}
      </div>

      {order && (
        <div className="mt-4 rounded-xl bg-cream-card p-4 text-sm">
          <p className="font-semibold text-foreground">{order.order_number}</p>
          <p className="mt-1 text-brown-muted">{productSummary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusColor(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
            <span className="text-xs font-semibold text-olive-dark">{money(order.total_cents)}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-stone-900">{value}</p>
    </div>
  );
}
