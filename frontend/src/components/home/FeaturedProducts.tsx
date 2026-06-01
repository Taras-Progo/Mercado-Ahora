"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeader } from "./CategoriesGrid";
import { HeartIcon, MapPinIcon, StarIcon } from "@/components/ui/Icons";

type FeaturedProduct = {
  name: string; description: string; price: string; location: string; rating: number; reviews: number; image: string;
};
const fallbackFeatured: FeaturedProduct[] = [
  { name: "Taza de cerámica artesanal", description: "Hecha a mano en gres", price: "$4.500", location: "Córdoba, Argentina", rating: 4.9, reviews: 23, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80" },
  { name: "Bolso tejido a mano", description: "Algodón natural orgánico", price: "$6.800", location: "Mendoza, Argentina", rating: 5.0, reviews: 12, image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80" },
  { name: "Miel multifloral pura", description: "Producción agroecológica", price: "$4.200", location: "Alta Gracia, Córdoba", rating: 4.8, reviews: 132, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80" },
  { name: "Tabla de madera de algarrobo", description: "Madera nativa local", price: "$22.000", location: "Villa Belgrano, Córdoba", rating: 4.9, reviews: 15, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80" },
];

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getProducts({ per_page: "4" }).then(setProducts).finally(() => setLoaded(true)); }, []);
  if (!loaded) return null;
  if (products.length > 0) {
    return (<section className="bg-background"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10"><SectionHeader title="Productos destacados" actionLabel="Ver todos" href="/buscar" /><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}</div></div></section>);
  }
  return (<section className="bg-background"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10"><SectionHeader title="Productos destacados" actionLabel="Ver todos" href="/buscar" /><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{fallbackFeatured.map((p) => <ProductCardFallback key={p.name} product={p} />)}</div></div></section>);
}

function ProductCardFallback({ product }: { product: FeaturedProduct }) {
  return (<article className="group overflow-hidden rounded-2xl border border-border-soft bg-white transition hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden bg-stone-100"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /><button type="button" aria-label="Agregar a favoritos" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brown-icon shadow-sm transition hover:bg-white hover:text-olive"><HeartIcon className="h-4 w-4" /></button></div><div className="grid gap-2 p-4"><h3 className="line-clamp-1 text-sm font-semibold text-foreground">{product.name}</h3><p className="text-xs text-brown-muted">{product.description}</p><p className="text-lg font-bold text-olive">{product.price}</p><div className="mt-1 flex items-center justify-between text-xs text-brown-muted"><span className="inline-flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5 text-brown-icon" />{product.location}</span><span className="inline-flex items-center gap-1 font-medium text-brown"><StarIcon className="h-3.5 w-3.5 text-amber-500" />{product.rating.toFixed(1)} <span className="text-brown-muted/70">({product.reviews})</span></span></div></div></article>);
}