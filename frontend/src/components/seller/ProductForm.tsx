"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Product, ProductImage } from "@/lib/api";
import {
  createProduct,
  deliveryTypeLabel,
  getCategories,
  money,
  productionTypeLabel,
  updateProduct,
} from "@/lib/api";
import { ProductImageUpload } from "@/components/seller/ProductImageUpload";
import { CheckCircleIcon, XCircleIcon } from "@/components/ui/Icons";

type Props = {
  product?: Product | null;
  onSaved: (product: Product) => void;
  onCancel: () => void;
};

const PRODUCTION_TYPES = ["natural", "agroecologico", "organico", "artesanal", "regional", "industrial"];
const DELIVERY_TYPES = ["local", "home_delivery", "pickup_point", "producer_pickup"];
const UNITS = ["unidad", "kg", "g", "litro", "ml", "frasco", "paquete", "bolsa", "caja", "docena"];

const inputClass =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20";

export function ProductForm({ product, onSaved, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const autoDraftStartedRef = useRef(false);
  // Tracks the persisted product: the one passed in (edit mode) or the draft we
  // create on first save (create mode). Once set, the image uploader is enabled.
  const [savedProduct, setSavedProduct] = useState<Product | null>(product ?? null);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id?.toString() ?? "");
  const [pricePesos, setPricePesos] = useState(
    product?.price_cents != null ? String(Math.round(product.price_cents / 100)) : "",
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [unit, setUnit] = useState(product?.unit ?? "unidad");
  const [productionType, setProductionType] = useState(product?.production_type ?? "organico");
  const [deliveryType, setDeliveryType] = useState(product?.delivery_type ?? "");
  const [origin, setOrigin] = useState(
    product?.city ? [product.city, product.province].filter(Boolean).join(", ") : "",
  );
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const parsedPrice = Number.parseFloat(pricePesos);
  const parsedStock = Number.parseInt(stock, 10);
  const basicInfoReady =
    name.trim().length > 0 &&
    Boolean(categoryId) &&
    pricePesos.trim().length > 0 &&
    Number.isFinite(parsedPrice) &&
    parsedPrice >= 0 &&
    stock.trim().length > 0 &&
    Number.isFinite(parsedStock) &&
    parsedStock >= 0 &&
    unit.trim().length > 0;

  const productPayload = useMemo(() => {
    const [city, ...rest] = origin.split(",").map((s) => s.trim());
    const province = rest.join(", ") || null;

    return {
      name: name.trim(),
      description: description.trim() || null,
      category_id: Number.parseInt(categoryId, 10),
      price_cents: Math.round(Number.parseFloat(pricePesos) * 100),
      stock: Number.parseInt(stock, 10) || 0,
      unit: unit || "unidad",
      production_type: productionType || null,
      delivery_type: deliveryType || null,
      city: city || null,
      province,
    };
  }, [name, description, categoryId, pricePesos, stock, unit, productionType, deliveryType, origin]);

  const handleSave = useCallback(
    async (status: "draft" | "active") => {
      setError(null);
      setInfo(null);
      if (!name.trim()) {
        setError("El nombre del producto es obligatorio.");
        return;
      }
      if (!categoryId) {
        setError("Seleccioná una categoría.");
        return;
      }
      if (!pricePesos || Number.parseFloat(pricePesos) < 0) {
        setError("El precio debe ser un número válido.");
        return;
      }
      setSaving(true);
      try {
        if (savedProduct) {
          // Already persisted (editing or a just-created draft): apply the chosen status.
          const updated = await updateProduct(savedProduct.id, { ...productPayload, status });
          onSaved(updated);
        } else {
          // First save of a brand-new product: always create as draft so the seller
          // can attach images before publishing (avoids image-less active products).
          const created = await createProduct({ ...productPayload, status: "draft" });
          setSavedProduct(created);
          setImages(created.images ?? []);
          setInfo("Fotos habilitadas. Ya podés subir imágenes del producto.");
          window.setTimeout(() => {
            photosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar el producto.");
      } finally {
        setSaving(false);
      }
    },
    [name, categoryId, pricePesos, savedProduct, productPayload, onSaved],
  );

  const hasProduct = !!savedProduct;

  useEffect(() => {
    if (product || savedProduct || !basicInfoReady || autoDraftStartedRef.current) {
      return;
    }

    autoDraftStartedRef.current = true;
    setError(null);
    setInfo(null);
    setPreparingPhotos(true);

    createProduct({ ...productPayload, status: "draft" })
      .then((created) => {
        setSavedProduct(created);
        setImages(created.images ?? []);
        setInfo("Fotos habilitadas. Ya podés subir imágenes del producto.");
        window.setTimeout(() => {
          photosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      })
      .catch((err) => {
        autoDraftStartedRef.current = false;
        setError(err instanceof Error ? err.message : "No se pudo preparar la carga de fotos.");
      })
      .finally(() => {
        setPreparingPhotos(false);
      });
  }, [product, savedProduct, basicInfoReady, productPayload]);

  return (
    <form className="grid gap-6" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <XCircleIcon className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}
      {info && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          {info}
        </div>
      )}

      {/* 1. Información básica */}
      <SectionCard number={1} title="Información básica">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre del producto" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Miel multifloral pura"
              className={inputClass}
            />
          </Field>
          <Field label="Categoría" required>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Seleccioná una categoría</option>
              {categories
                .filter((c) => !c.parent_id)
                .map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {categories
                      .filter((sub) => sub.parent_id === c.id)
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {"  "}
                          {sub.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
          </Field>
          <Field label="Precio" required>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
              <input
                type="number"
                value={pricePesos}
                onChange={(e) => setPricePesos(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0,00"
                className={`${inputClass} pl-8`}
              />
            </div>
            {pricePesos && !Number.isNaN(Number.parseFloat(pricePesos)) && (
              <p className="mt-1 text-xs font-medium text-olive">
                {money(Math.round(Number.parseFloat(pricePesos) * 100))} (ingresá el precio en pesos argentinos)
              </p>
            )}
          </Field>
          <Field label="Unidad de medida" required>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stock disponible" required>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              placeholder="Ej: 10 unidades, 5 kg, etc."
              className={inputClass}
            />
          </Field>
        </div>
      </SectionCard>

      {/* 2. Fotos del producto */}
      <div ref={photosRef}>
        <SectionCard
          number={2}
          title="Fotos del producto"
          subtitle="Subí fotos claras y reales. La primera será la imagen principal."
        >
          {hasProduct && savedProduct ? (
            <ProductImageUpload productId={savedProduct.id} images={images} onImagesChange={setImages} />
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3 opacity-60 sm:grid-cols-3 lg:grid-cols-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-soft text-stone-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-7 w-7"
                    >
                      {i === 0 ? (
                        <>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </>
                      ) : (
                        <path d="M12 5v14M5 12h14" />
                      )}
                    </svg>
                    <span className="text-center text-[11px] font-medium leading-tight">
                      {i === 0 ? "Imagen principal (Obligatoria)" : "Agregar foto"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-500">
                {preparingPhotos
                  ? "Preparando la carga de fotos..."
                  : "Completá la información básica para habilitar la carga de imágenes."}
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* 3. Descripción del producto */}
      <SectionCard
        number={3}
        title="Descripción del producto"
        subtitle="Contá más sobre tu producto: características, origen, beneficios, recomendaciones, etc."
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          rows={5}
          placeholder="Escribí una descripción detallada de tu producto..."
          className={`${inputClass} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-stone-400">{description.length} / 1000 caracteres</p>
      </SectionCard>

      {/* 4. Detalles adicionales */}
      <SectionCard number={4} title="Detalles adicionales">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Origen / Lugar de producción">
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej: Villa General Belgrano, Córdoba"
              className={inputClass}
            />
          </Field>
          <Field label="Método de producción">
            <select value={productionType} onChange={(e) => setProductionType(e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              {PRODUCTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {productionTypeLabel(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Envíos / Entregas">
            <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className={inputClass}>
              <option value="">Seleccioná una opción</option>
              {DELIVERY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {deliveryTypeLabel(t)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* Importante */}
      <div className="flex items-start gap-3 rounded-2xl border border-olive-light/40 bg-olive-muted/50 p-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-olive-dark">
          <CheckCircleIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-olive-dark">Importante</p>
          <p className="text-sm text-olive-dark/80">
            Revisá bien la información antes de publicar. Los datos claros y reales generan confianza.
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 border-t border-border-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || preparingPhotos}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border-soft bg-white px-6 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {hasProduct ? "Cerrar" : "Cancelar"}
        </button>
        {!hasProduct ? (
          <p className="rounded-full bg-olive-muted px-5 py-3 text-center text-sm font-semibold text-olive-dark">
            {preparingPhotos ? "Preparando fotos..." : "Completá la información básica para continuar"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving || preparingPhotos}
              className="rounded-full border border-olive bg-white px-6 py-3 text-sm font-semibold text-olive transition hover:bg-olive-muted"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("active")}
              disabled={saving || preparingPhotos}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {saving ? "Publicando..." : "Publicar producto"}
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

function SectionCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-white p-6">
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-muted text-sm font-bold text-olive-dark">
          {number}
        </span>
        <div>
          <h3 className="text-base font-semibold text-stone-900">
            {number}. {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
        </div>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <label className="text-sm font-semibold text-stone-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
