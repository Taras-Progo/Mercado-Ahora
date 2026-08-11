"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  addAdminPaymentReviewNote,
  getAdminPayment,
  getAdminPayments,
  money,
  paymentStatusColor,
  paymentStatusLabel,
  type AdminPayment,
  type AdminPaymentDetail,
} from "@/lib/api";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/Icons";

const statusOptions = ["", "pending", "approved", "rejected", "cancelled", "expired", "requires_review", "failed"];

function dateTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
    : "-";
}

function sourceLabel(source?: string) {
  const labels: Record<string, string> = {
    webhook: "Webhook",
    expiration: "Vencimiento automático",
    retry: "Reintento",
    checkout: "Inicio del pago",
    system: "Sistema",
  };
  return source ? labels[source] ?? source.replaceAll("_", " ") : "Sistema";
}

export function AdminPayments() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [onlyReview, setOnlyReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPayments(await getAdminPayments({ search: search.trim() || undefined, status: status || undefined, requires_review: onlyReview || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }, [onlyReview, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openDetail = async (payment: AdminPayment) => {
    if (detail?.id === payment.id) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    try {
      setDetail(await getAdminPayment(payment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del pago.");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveNote = async () => {
    if (!detail || note.trim().length < 3) return;
    setSavingNote(true);
    setError("");
    setSuccess("");
    try {
      const created = await addAdminPaymentReviewNote(detail.id, note.trim());
      setDetail({ ...detail, review_notes: [created, ...detail.review_notes], review_notes_count: detail.review_notes_count + 1 });
      setPayments((current) => current.map((item) => item.id === detail.id ? { ...item, review_notes_count: item.review_notes_count + 1 } : item));
      setNote("");
      setSuccess("Nota interna guardada en el historial del pago.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la nota.");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
        <label className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por referencia, pedido, comprador o email" className="w-full rounded-full border border-border-soft bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-full border border-border-soft bg-white px-4 py-2.5 text-sm outline-none focus:border-olive">
          {statusOptions.map((value) => <option key={value || "all"} value={value}>{value ? paymentStatusLabel(value) : "Todos los estados"}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">
          <input type="checkbox" checked={onlyReview} onChange={(event) => setOnlyReview(event.target.checked)} className="accent-olive" />
          Solo revisión
        </label>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      {loading ? <p className="py-12 text-center text-sm text-stone-500">Cargando pagos...</p> : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center text-sm text-stone-600">No hay pagos que coincidan con los filtros.</div>
      ) : (
        <div className="grid gap-3">
          {payments.map((payment) => {
            const expanded = detail?.id === payment.id;
            return (
              <article key={payment.id} className="overflow-hidden rounded-2xl border border-border-soft bg-white">
                <button type="button" onClick={() => void openDetail(payment)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-cream-card md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusColor(payment.status)}`}>{paymentStatusLabel(payment.status)}</span>
                      <span className="text-xs font-semibold uppercase text-stone-500">{payment.mode === "sandbox" ? "Prueba" : "Producción"}</span>
                      {payment.requires_review && <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">Revisión requerida</span>}
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-stone-500">{payment.reference}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">{payment.buyer?.name ?? "Comprador"}</p>
                    <p className="text-xs text-stone-500">{payment.buyer?.email ?? "Sin email"} · {payment.orders.map((order) => order.order_number).join(", ")}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="font-semibold text-olive-dark">{money(payment.amount_cents)}</p>
                    <p className="text-xs text-stone-500">{dateTime(payment.created_at)}</p>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-stone-400 transition ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && detail && (
                  <div className="grid gap-5 border-t border-border-soft bg-cream-card p-5">
                    {detailLoading ? <p className="text-sm text-stone-500">Cargando detalle...</p> : (
                      <>
                        <section className="grid gap-3 rounded-xl bg-white p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                          <div><p className="text-xs font-semibold uppercase text-stone-500">Preferencia</p><p className="mt-1 break-all font-mono text-xs">{detail.preference_id ?? "Pendiente"}</p></div>
                          <div><p className="text-xs font-semibold uppercase text-stone-500">Pago Mercado Pago</p><p className="mt-1 break-all font-mono text-xs">{detail.provider_payment_id ?? "Aún no informado"}</p></div>
                          <div><p className="text-xs font-semibold uppercase text-stone-500">Última sincronización</p><p className="mt-1">{dateTime(detail.last_synced_at)}</p></div>
                          <div><p className="text-xs font-semibold uppercase text-stone-500">Aprobación</p><p className="mt-1">{dateTime(detail.approved_at)}</p></div>
                        </section>

                        <section className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase text-stone-500">Pedidos asociados</p>
                          <div className="mt-2 flex flex-wrap gap-2">{detail.orders.map((order) => <Link key={order.id} href={`/admin?tab=orders&order=${order.id}`} className="rounded-full border border-border-soft px-3 py-1.5 text-xs font-semibold text-olive-dark hover:bg-olive-muted">{order.order_number} · {paymentStatusLabel(order.payment_status)}</Link>)}</div>
                        </section>

                        <div className="grid gap-4 xl:grid-cols-3">
                          <section className="rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase text-stone-500">Historial de estados</p><ul className="mt-3 grid gap-2">{detail.status_history.length ? detail.status_history.map((entry) => <li key={entry.id} className="text-xs text-stone-600"><span className={`mr-2 rounded-full px-2 py-0.5 font-semibold ${paymentStatusColor(entry.to_status)}`}>{paymentStatusLabel(entry.to_status)}</span>{sourceLabel(entry.source)} · {dateTime(entry.created_at)}</li>) : <li className="text-xs text-stone-500">Sin transiciones registradas.</li>}</ul></section>
                          <section className="rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase text-stone-500">Transacciones</p><ul className="mt-3 grid gap-2">{detail.transactions.length ? detail.transactions.map((transaction) => <li key={transaction.id} className="rounded-lg border border-border-soft p-2 text-xs"><p className="font-semibold">{paymentStatusLabel(transaction.status)} · {money(transaction.amount_cents)}</p><p className="mt-1 break-all font-mono text-stone-500">{transaction.external_id ?? "Sin ID externo"}</p></li>) : <li className="text-xs text-stone-500">Mercado Pago aún no informó una transacción.</li>}</ul></section>
                          <section className="rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase text-stone-500">Webhooks</p><ul className="mt-3 grid gap-2">{detail.webhook_events.length ? detail.webhook_events.map((event) => <li key={event.id} className="rounded-lg border border-border-soft p-2 text-xs"><p className="font-semibold">{event.status === "processed" ? "Procesado" : event.status === "failed" ? "Fallido" : "Recibido"} · {event.signature_valid ? "Firma válida" : "Firma no válida"}</p><p className="mt-1 text-stone-500">Intentos: {event.attempts} · {dateTime(event.created_at)}</p></li>) : <li className="text-xs text-stone-500">No hay webhooks asociados todavía.</li>}</ul></section>
                        </div>

                        {detail.processing_error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Requiere revisión técnica: {detail.processing_error}</p>}

                        <section className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase text-stone-500">Notas internas</p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Registrar una observación para seguimiento administrativo" rows={3} className="min-h-20 flex-1 rounded-xl border border-border-soft px-3 py-2 text-sm outline-none focus:border-olive" /><button type="button" onClick={() => void saveNote()} disabled={savingNote || note.trim().length < 3} className="self-end rounded-full bg-olive px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">{savingNote ? "Guardando..." : "Guardar nota"}</button></div>
                          <ul className="mt-4 grid gap-2">{detail.review_notes.map((entry) => <li key={entry.id} className="rounded-lg bg-cream-card p-3 text-sm"><p>{entry.note}</p><p className="mt-1 text-xs text-stone-500">{entry.admin?.name ?? "Administración"} · {dateTime(entry.created_at)}</p></li>)}</ul>
                        </section>
                      </>
                    )}
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
