"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import {
  deleteProduct,
  getSellerProducts,
  imageUrl,
  money,
  pauseProduct,
  publishProduct,
  statusColor,
  statusLabel,
} from "@/lib/api";
import { ProductForm } from "@/components/seller/ProductForm";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SellerBackLink } from "@/components/seller/SellerBackLink";
import { BagIcon, CheckCircleIcon, ChevronRightIcon, ClockIcon, EditIcon, EyeIcon, PauseIcon, PlusIcon, TrashIcon, XCircleIcon } from "@/components/ui/Icons";

export default function SellerProductsPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerProductsView />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SellerProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSellerProducts();
      setProducts(data);
    } catch {
      // keep current list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  const handleSaved = useCallback(
    () => {
      setShowForm(false);
      setEditingProduct(null);
      setActionError(null);
      setActionMessage(null);
      fetchProducts();
    },
    [fetchProducts],
  );

  const handlePublish = useCallback(
    async (id: number) => {
      setActionError(null);
      setActionMessage(null);
      try {
        await publishProduct(id);
        fetchProducts();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error al publicar.");
      }
    },
    [fetchProducts],
  );

  const handlePause = useCallback(
    async (id: number) => {
      setActionError(null);
      setActionMessage(null);
      try {
        await pauseProduct(id);
        fetchProducts();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error al pausar.");
      }
    },
    [fetchProducts],
  );

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
    setActionError(null);
    setActionMessage(null);
  }, []);

  const handleDelete = useCallback(
    async (product: Product) => {
      const confirmed = window.confirm(
        `¿Eliminar "${product.name}"? Si tiene pedidos asociados, se pausará para conservar el historial.`,
      );

      if (!confirmed) {
        return;
      }

      setActionError(null);
      setActionMessage(null);
      setDeletingProductId(product.id);

      try {
        const result = await deleteProduct(product.id);
        setActionMessage(result.message);
        fetchProducts();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error al eliminar.");
      } finally {
        setDeletingProductId(null);
      }
    },
    [fetchProducts],
  );

  if (showForm) {
    return (
      <div>
        <SellerBackLink className="mb-3" />
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brown transition hover:text-olive-dark"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
          Volver a mis productos
        </button>
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-olive-dark to-olive p-8 text-white">
          <h2 className="font-serif text-3xl font-bold">
            {editingProduct ? "Editar producto" : "Publicar un nuevo producto"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/85">
            {editingProduct
              ? "Modificá los datos de tu producto para mantenerlo actualizado."
              : "Completá los datos de tu producto para que más personas puedan encontrarlo."}
          </p>
        </div>
        <div className="mt-6">
          <ProductForm
            product={editingProduct}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SellerBackLink className="mb-6" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">Mis productos</h2>
          <p className="mt-1 text-sm text-stone-600">
            {products.length > 0
              ? `${products.length} producto${products.length !== 1 ? "s" : ""} · ${products.filter((p) => p.status === "active").length} activo${products.filter((p) => p.status === "active").length !== 1 ? "s" : ""}`
              : "Gestioná los productos de tu catálogo."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {actionError && (
        <p className="mt-4 text-sm font-medium text-red-600">{actionError}</p>
      )}
      {actionMessage && (
        <p className="mt-4 text-sm font-medium text-olive-dark">{actionMessage}</p>
      )}

      {loading ? (
        <div className="mt-12 text-center text-sm text-stone-500">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border-soft bg-white p-12 text-center">
          <BagIcon className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-4 text-lg font-semibold text-stone-700">No tenés productos todavía</h3>
          <p className="mt-1 text-sm text-stone-500">Publicá tu primer producto para que aparezca en el catálogo.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            <PlusIcon className="h-4 w-4" />
            Crear producto
          </button>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border-soft bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-soft bg-cream-card text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Precio</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-cream-card/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={imageUrl(product.images[0].path)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
                            <BagIcon className="h-4 w-4" />
                          </span>
                        )}
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-semibold text-stone-800 transition hover:text-olive"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{product.category?.name ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-olive-dark">{money(product.price_cents)}</td>
                    <td className="px-5 py-4 text-stone-600">{product.stock} {product.unit}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusColor(product.status)}`}>
                        {product.status === "active" && <CheckCircleIcon className="h-3 w-3" />}
                        {product.status === "draft" && <ClockIcon className="h-3 w-3" />}
                        {product.status === "paused" && <PauseIcon className="h-3 w-3" />}
                        {product.status === "rejected" && <XCircleIcon className="h-3 w-3" />}
                        {statusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="inline-flex items-center gap-1 rounded-lg p-2 text-stone-400 transition hover:text-olive"
                          title="Ver en catálogo"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-lg p-2 text-stone-400 transition hover:text-olive"
                          title="Editar"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        {product.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handlePause(product.id)}
                            className="rounded-lg p-2 text-stone-400 transition hover:text-amber-600"
                            title="Pausar"
                          >
                            <PauseIcon className="h-4 w-4" />
                          </button>
                        )}
                        {(product.status === "draft" || product.status === "paused") && (
                          <button
                            type="button"
                            onClick={() => handlePublish(product.id)}
                            className="rounded-lg p-2 text-stone-400 transition hover:text-emerald-600"
                            title="Publicar"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingProductId === product.id}
                          className="rounded-lg p-2 text-stone-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
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
