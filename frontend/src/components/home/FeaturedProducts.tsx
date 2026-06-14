"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeader } from "./CategoriesGrid";

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProducts({ per_page: "4" })
      .then(setProducts)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || products.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
        <SectionHeader title="Productos destacados" actionLabel="Ver todos" href="/buscar" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
