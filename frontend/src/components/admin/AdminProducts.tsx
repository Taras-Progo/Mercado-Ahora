"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product, ProductModerationNote, ProducerProfile } from "@/lib/api";
import {
  createAdminProductModerationNote,
  deleteAdminProduct,
  getAdminProducts,
  money,
  rejectAdminProduct,
  statusColor,
  statusLabel,
  updateAdminProduct,
  updateAdminProductStatus,
} from "@/lib/api";
import {
  BagIcon,
  CheckCircleIcon,
  EditIcon,
  EyeIcon,
  PauseIcon,
  SearchIcon,
  TrashIcon,
  XCircleIcon,
} from "@/components/ui/Icons";

type StatusFilter = "all" | "active" | "pending" | "paused" | "draft" | "rejected";

const filters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "active", label: "Activos" },
  { id: "paused", label: "Pausados" },
  { id: "draft", label: "Borradores" },
  { id: "rejected", label: "Rechazados" },
];

type Feedback = { tone: "success" | "error" | "info"; text: string };
type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  unit: string;
  city: string;
  province: string;
  production_type: string;
  delivery_type: string;
  status: string;
};

export function AdminProducts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const producerFilterId = Number(searchParams.get("producer_id") ?? "") || undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm | null>(null);
  const [moderatingProduct, setModeratingProduct] = useState<Product | null>(null);
  const [moderationNote, setModerationNote] = useState("");
  const [moderationStatus, setModerationStatus] = useState("needs_changes");
  const [notifySeller, setNotifySeller] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts({
        search: search.trim() || undefined,
        status: filter,
        producer_id: producerFilterId,
      });
      setProducts(data);
      setFeedback(null);
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudieron cargar los productos.",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, producerFilterId, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activeProducer = useMemo(() => {
    if (!producerFilterId) return null;
    return products.map(producerOf).find((profile) => profile?.id === producerFilterId) ?? null;
  }, [producerFilterId, products]);

  function setProducerFilter(profile?: ProducerProfile) {
    if (!profile) return;
    router.replace(`/admin?tab=products&producer_id=${profile.id}`, { scroll: false });
  }

  function clearProducerFilter() {
    router.replace("/admin?tab=products", { scroll: false });
  }

  async function runAction(id: number, action: () => Promise<Product>, successText: string) {
    setBusyId(id);
    setFeedback(null);
    try {
      const updated = await action();
      setProducts((prev) => prev.map((product) => (product.id === id ? updated : product)));
      setFeedback({ tone: "success", text: successText });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo actualizar el producto.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description ?? "",
      price: String((product.price_cents ?? 0) / 100),
      stock: String(product.stock ?? 0),
      unit: product.unit ?? "unidad",
      city: product.city ?? "",
      province: product.province ?? "",
      production_type: product.production_type ?? "",
      delivery_type: product.delivery_type ?? "",
      status: product.status ?? "draft",
    });
  }

  async function submitEdit() {
    if (!editingProduct || !editForm) return;
    setBusyId(editingProduct.id);
    setFeedback(null);
    try {
      const updated = await updateAdminProduct(editingProduct.id, {
        name: editForm.name,
        description: editForm.description,
        price_cents: Math.max(0, Math.round(Number(editForm.price.replace(",", ".")) * 100)),
        stock: Math.max(0, Math.floor(Number(editForm.stock))),
        unit: editForm.unit,
        city: editForm.city,
        province: editForm.province,
        production_type: editForm.production_type,
        delivery_type: editForm.delivery_type,
        status: editForm.status,
      });
      setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)));
      setEditingProduct(null);
      setEditForm(null);
      setFeedback({ tone: "success", text: "Producto actualizado correctamente." });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo guardar el producto.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function submitModerationNote() {
    if (!moderatingProduct || !moderationNote.trim()) return;
    setBusyId(moderatingProduct.id);
    setFeedback(null);
    try {
      const note = await createAdminProductModerationNote(moderatingProduct.id, {
        note: moderationNote.trim(),
        status: moderationStatus,
        notify_seller: notifySeller,
      });
      setProducts((prev) =>
        prev.map((product) =>
          product.id === moderatingProduct.id
            ? { ...product, moderation_notes: [note, ...moderationNotesOf(product)] }
            : product,
        ),
      );
      setModeratingProduct(null);
      setModerationNote("");
      setFeedback({
        tone: "success",
        text: notifySeller
          ? "Observación guardada y enviada al productor."
          : "Observación guardada para moderación interna.",
      });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo guardar la observación.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`¿Eliminar o pausar "${product.name}"? Si tiene pedidos, se pausará para preservar el historial.`)) {
      return;
    }

    setBusyId(product.id);
    setFeedback(null);
    try {
      const result = await deleteAdminProduct(product.id);
      if (result.action === "deleted") {
        setProducts((prev) => prev.filter((item) => item.id !== product.id));
      } else if (result.product) {
        setProducts((prev) => prev.map((item) => (item.id === product.id ? result.product! : item)));
      }
      setFeedback({ tone: "success", text: result.message });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo eliminar el producto.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                filter === item.id
                  ? "bg-olive-dark text-white"
                  : "border border-border-soft bg-white text-stone-700 hover:border-olive hover:text-olive-dark"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full max-w-xl">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por producto, nombre comercial, usuario o email"
              className="w-full rounded-full border border-border-soft bg-cream-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
          </label>
          {producerFilterId && (
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-olive/30 bg-olive-muted px-3 py-2 text-xs text-olive-dark">
              <span>
                Publicaciones de <strong>{activeProducer?.business_name ?? `productor #${producerFilterId}`}</strong>
              </span>
              <button type="button" onClick={clearProducerFilter} className="font-semibold underline">
                Ver todos
              </button>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-border-soft bg-cream-card text-stone-600"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {editingProduct && editForm && (
        <section className="rounded-2xl border border-border-soft bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Editar publicación</p>
              <p className="text-xs text-stone-500">Cambios administrativos sobre {editingProduct.name}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setEditForm(null);
              }}
              className="self-start rounded-full px-3 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-cream-card"
            >
              Cancelar
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Nombre" value={editForm.name} onChange={(value) => setEditForm({ ...editForm, name: value })} />
            <Field label="Precio en pesos" value={editForm.price} onChange={(value) => setEditForm({ ...editForm, price: value })} />
            <Field label="Stock" value={editForm.stock} onChange={(value) => setEditForm({ ...editForm, stock: value })} />
            <Field label="Unidad" value={editForm.unit} onChange={(value) => setEditForm({ ...editForm, unit: value })} />
            <Field label="Localidad" value={editForm.city} onChange={(value) => setEditForm({ ...editForm, city: value })} />
            <Field label="Provincia" value={editForm.province} onChange={(value) => setEditForm({ ...editForm, province: value })} />
            <Field label="Tipo de producción" value={editForm.production_type} onChange={(value) => setEditForm({ ...editForm, production_type: value })} />
            <Field label="Tipo de entrega" value={editForm.delivery_type} onChange={(value) => setEditForm({ ...editForm, delivery_type: value })} />
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Estado
              <select
                value={editForm.status}
                onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
                className="rounded-xl border border-border-soft px-3 py-2.5 text-sm font-normal normal-case text-stone-900 outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
              >
                <option value="draft">Borrador</option>
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-stone-500 md:col-span-2">
              Descripción
              <textarea
                value={editForm.description}
                onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                rows={3}
                className="rounded-xl border border-border-soft px-3 py-2.5 text-sm font-normal normal-case text-stone-900 outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={submitEdit}
            disabled={busyId === editingProduct.id}
            className="mt-4 rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
          >
            Guardar cambios
          </button>
        </section>
      )}

      {moderatingProduct && (
        <section className="rounded-2xl border border-border-soft bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Observación de moderación</p>
              <p className="text-xs text-stone-500">{moderatingProduct.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setModeratingProduct(null)}
              className="self-start rounded-full px-3 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-cream-card"
            >
              Cancelar
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <select
              value={moderationStatus}
              onChange={(event) => setModerationStatus(event.target.value)}
              className="max-w-xs rounded-full border border-border-soft px-4 py-2.5 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            >
              <option value="needs_changes">Requiere correcciones</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="internal">Nota interna</option>
            </select>
            <textarea
              value={moderationNote}
              onChange={(event) => setModerationNote(event.target.value)}
              rows={4}
              placeholder="Explicá qué debe corregirse o qué se revisó."
              className="rounded-xl border border-border-soft px-4 py-3 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={notifySeller}
                onChange={(event) => setNotifySeller(event.target.checked)}
                className="h-4 w-4 rounded border-border-soft text-olive focus:ring-olive"
              />
              Notificar al productor y mostrar la observación en su panel
            </label>
          </div>
          <button
            type="button"
            onClick={submitModerationNote}
            disabled={busyId === moderatingProduct.id || !moderationNote.trim()}
            className="mt-4 rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
          >
            Guardar observación
          </button>
        </section>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-stone-500">Cargando productos...</div>
      ) : products.length === 0 ? (
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
                  <th className="px-5 py-3">Precio / stock</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Moderación</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {products.map((product) => {
                  const producer = producerOf(product);
                  const user = producer?.user;
                  const latestNote = moderationNotesOf(product)[0];

                  return (
                    <tr key={product.id} className="align-top transition hover:bg-cream-card/50">
                      <td className="px-5 py-4">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-semibold text-stone-800 transition hover:text-olive"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-stone-500">{product.category?.name ?? "Sin categoría"}</p>
                      </td>
                      <td className="px-5 py-4">
                        {producer ? (
                          <div className="grid gap-1">
                            <button
                              type="button"
                              onClick={() => setProducerFilter(producer)}
                              className="text-left font-semibold text-olive-dark underline-offset-2 hover:underline"
                            >
                              {producer.business_name}
                            </button>
                            <p className="text-xs text-stone-500">{user?.name ?? "Usuario no informado"}</p>
                            <p className="text-xs text-stone-500">{user?.email ?? "Email no informado"}</p>
                          </div>
                        ) : (
                          <span className="text-stone-400">Productor no vinculado</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-olive-dark">{money(product.price_cents)}</p>
                        <p className="text-xs text-stone-500">Stock: {product.stock}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor(product.status)}`}
                        >
                          {statusLabel(product.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {latestNote ? (
                          <div className="max-w-xs">
                            <p className="text-xs font-semibold text-stone-700">{moderationStatusLabel(latestNote.status)}</p>
                            <p className="line-clamp-2 text-xs text-stone-500">{latestNote.note}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">Sin observaciones</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            className="rounded-lg p-2 text-stone-400 transition hover:text-olive"
                            title="Ver publicación"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="rounded-lg p-2 text-stone-400 transition hover:text-olive"
                            title="Editar"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          {product.status === "active" ? (
                            <button
                              type="button"
                              disabled={busyId === product.id}
                              onClick={() =>
                                runAction(product.id, () => updateAdminProductStatus(product.id, "paused"), "Producto pausado.")
                              }
                              className="rounded-lg p-2 text-stone-400 transition hover:text-amber-600 disabled:opacity-40"
                              title="Pausar"
                            >
                              <PauseIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === product.id}
                              onClick={() =>
                                runAction(product.id, () => updateAdminProductStatus(product.id, "active"), "Producto reactivado.")
                              }
                              className="rounded-lg p-2 text-stone-400 transition hover:text-emerald-600 disabled:opacity-40"
                              title="Reactivar"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          {product.status !== "rejected" && (
                            <button
                              type="button"
                              disabled={busyId === product.id}
                              onClick={() => runAction(product.id, () => rejectAdminProduct(product.id), "Producto rechazado.")}
                              className="rounded-lg p-2 text-stone-400 transition hover:text-red-500 disabled:opacity-40"
                              title="Rechazar"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setModeratingProduct(product);
                              setModerationNote("");
                            }}
                            className="rounded-full border border-border-soft px-3 py-1.5 text-xs font-semibold text-olive-dark transition hover:border-olive hover:bg-olive-muted"
                          >
                            Observación
                          </button>
                          {producer && (
                            <button
                              type="button"
                              onClick={() => setProducerFilter(producer)}
                              className="rounded-full border border-border-soft px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-olive hover:text-olive-dark"
                            >
                              Productos del productor
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === product.id}
                            onClick={() => deleteProduct(product)}
                            className="rounded-lg p-2 text-stone-400 transition hover:text-red-600 disabled:opacity-40"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-border-soft px-3 py-2.5 text-sm font-normal normal-case text-stone-900 outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
      />
    </label>
  );
}

function producerOf(product: Product): ProducerProfile | undefined {
  return product.producer_profile ?? product.producerProfile;
}

function moderationNotesOf(product: Product): ProductModerationNote[] {
  return product.moderation_notes ?? product.moderationNotes ?? [];
}

function moderationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    needs_changes: "Requiere correcciones",
    approved: "Aprobado",
    rejected: "Rechazado",
    internal: "Nota interna",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}
