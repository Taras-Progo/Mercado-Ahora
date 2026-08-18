"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { ReturnTimeline } from "@/components/ReturnTimeline";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { ReturnRequest } from "@/lib/api";
import { getReturns, money, orderStatusColor, orderStatusLabel, returnStatusColor, returnStatusLabel } from "@/lib/api";
import { PackageIcon } from "@/components/ui/Icons";

export default function ReturnsPage() {
  return <RoleGuard roles={["buyer", "seller"]}><ReturnsContent /></RoleGuard>;
}

function ReturnsContent() {
  const searchParams = useSearchParams();
  const requestedReturnId = Number(searchParams.get("return"));
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const returnRefs = useRef<Record<number, HTMLElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReturns(await getReturns());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las devoluciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    if (!requestedReturnId || !returns.some((item) => item.id === requestedReturnId)) return;
    window.requestAnimationFrame(() => returnRefs.current[requestedReturnId]?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [requestedReturnId, returns]);

  return (
    <>
      <SiteHeader />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Mis devoluciones</h1>
              <p className="mt-1 text-sm text-brown-muted">Consultá el estado y el historial de cada solicitud.</p>
            </div>
            <Link href="/orders" className="text-sm font-semibold text-olive-dark hover:underline">Volver a mis pedidos</Link>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-stone-500">Cargando devoluciones...</div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-2 font-semibold underline">Reintentar</button></div>
          ) : returns.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border-soft bg-white p-10 text-center">
              <PackageIcon className="mx-auto h-10 w-10 text-stone-300" />
              <p className="mt-3 text-sm font-semibold text-stone-700">Todavía no solicitaste devoluciones.</p>
              <p className="mt-1 text-xs text-stone-500">Cuando un pedido entregado requiera revisión, vas a poder iniciarla desde su detalle.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {returns.map((item) => (
                <ReturnCard key={item.id} item={item} highlighted={item.id === requestedReturnId} setRef={(node) => { returnRefs.current[item.id] = node; }} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ReturnCard({ item, highlighted, setRef }: { item: ReturnRequest; highlighted: boolean; setRef: (node: HTMLElement | null) => void }) {
  const order = item.order;
  const productSummary = order?.items?.map((orderItem) => `${orderItem.product_name} x ${orderItem.quantity}`).join(", ");

  return (
    <article ref={setRef} className={`scroll-mt-24 rounded-2xl border bg-white p-5 transition ${highlighted ? "border-olive ring-2 ring-olive/20" : "border-border-soft"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Devolución #{item.id}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${returnStatusColor(item.status)}`}>{returnStatusLabel(item.status)}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-stone-800">{item.reason}</p>
          {item.details && <p className="mt-1 text-sm text-brown-muted">{item.details}</p>}
        </div>
        {order && <Link href={`/orders?order=${order.id}`} className="text-sm font-semibold text-olive-dark hover:underline">Ver pedido</Link>}
      </div>

      {order && (
        <div className="mt-4 rounded-xl bg-cream-card p-4 text-sm">
          <p className="font-semibold text-foreground">{order.order_number}</p>
          <p className="mt-1 text-brown-muted">{productSummary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusColor(order.status)}`}>{orderStatusLabel(order.status)}</span>
            <span className="text-xs font-semibold text-olive-dark">{money(order.total_cents)}</span>
          </div>
        </div>
      )}
      <ReturnTimeline history={item.status_history} />
    </article>
  );
}
