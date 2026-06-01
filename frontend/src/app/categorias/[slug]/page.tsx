"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Category, Product } from "@/lib/api";
import { getCategories, getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ui/ProductCard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChevronRightIcon, SearchIcon } from "@/components/ui/Icons";

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [categories, prods] = await Promise.all([
      getCategories(),
      getProducts({ category: slug }),
    ]);
    const current = categories.find((c) => c.slug === slug);
    setCategory(current ?? null);
    setSubcategories(current ? categories.filter((c) => c.parent_id === current.id) : []);
    setProducts(prods);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <nav className="flex items-center gap-2 text-sm text-brown-muted mb-6">
            <Link href="/categorias" className="hover:text-olive transition">Categorias</Link>
            <ChevronRightIcon className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{category?.name ?? slug}</span>
          </nav>
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">{category?.name ?? "Categoria"}</h1>
            {category?.description && <p className="mt-2 text-base text-brown-muted">{category.description}</p>}
          </div>
          {subcategories.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Subcategorias</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {subcategories.map((sub) => (
                  <Link key={sub.id} href={`/categorias/${sub.slug}`}
                    className="rounded-full border border-border-soft bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-olive hover:text-olive">
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">
                {loading ? "Cargando productos..." : `${products.length} producto${products.length !== 1 ? "s" : ""}`}
              </h2>
            </div>
            {loading ? (
              <div className="mt-8 text-center text-sm text-stone-500">Cargando productos...</div>
            ) : products.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-border-soft bg-white p-12 text-center">
                <SearchIcon className="mx-auto h-12 w-12 text-stone-300" />
                <h3 className="mt-4 text-lg font-semibold text-stone-700">No hay productos en esta categoria</h3>
                <p className="mt-1 text-sm text-stone-500">Volve mas tarde para ver nuevos productos.</p>
                <Link href="/categorias"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark">
                  Ver todas las categorias
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}