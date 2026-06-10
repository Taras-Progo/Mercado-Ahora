"use client";

import Link from "next/link";
import type { Product } from "@/lib/api";
import { ecoColor, ecoLabel, imageUrl, money, productionTypeLabel } from "@/lib/api";
import { HeartIcon, MapPinIcon } from "@/components/ui/Icons";

export function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const imageSrc = primaryImage ? imageUrl(primaryImage.path) : undefined;
  const location = product.city ?? product.province ?? product.producerProfile?.city ?? product.producer_profile?.city ?? "";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-border-soft bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12">
              <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <button type="button" aria-label="Agregar a favoritos"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brown-icon shadow-sm transition hover:bg-white hover:text-olive"
          onClick={(e) => e.preventDefault()}>
          <HeartIcon className="h-4 w-4" />
        </button>
        {product.ecoscore_points != null && (
          <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ecoColor(product.ecoscore_points)}`}>
            {ecoLabel(product.ecoscore_points)}
          </span>
        )}
      </div>
      <div className="grid gap-1.5 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{product.name}</h3>
        {product.production_type && (
          <p className="text-[11px] font-medium text-brown-muted">{productionTypeLabel(product.production_type)}</p>
        )}
        <p className="text-lg font-bold text-olive">{money(product.price_cents)}</p>
        <p className="text-xs text-brown-muted">
          {product.unit && <span>por {product.unit}</span>}
          {product.stock != null && product.stock > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
              Stock: {product.stock}
            </span>
          )}
          {product.stock === 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
              Sin stock
            </span>
          )}
        </p>
        {location && (
          <p className="text-xs text-brown-muted flex items-center gap-1 truncate">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-brown-icon" />
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
