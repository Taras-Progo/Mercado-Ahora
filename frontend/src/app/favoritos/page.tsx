"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { getFavorites, type Product } from "@/lib/api";

export default function FavoritosPage() {
  const { ready, user } = useAuth();
  const { favoriteIds } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!ready) return;
      if (!user) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const favorites = await getFavorites();
      if (!cancelled) {
        setProducts(favorites);
        setLoading(false);
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  const visibleProducts = useMemo(
    () => products.filter((product) => favoriteIds.includes(product.id)),
    [favoriteIds, products],
  );

  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Productos guardados</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground">Tus favoritos</h1>
            <p className="mt-3 text-brown-muted">
              Guarda productos para volver a verlos rapido cuando quieras comparar, consultar o comprar.
            </p>
          </div>

          {!ready || loading ? (
            <div className="mt-10 rounded-2xl border border-border-soft bg-white p-8 text-sm text-brown-muted">
              Cargando favoritos...
            </div>
          ) : !user ? (
            <div className="mt-10 rounded-2xl border border-border-soft bg-white p-8">
              <h2 className="font-serif text-2xl font-bold text-foreground">Ingresa para ver tus favoritos</h2>
              <p className="mt-2 text-sm text-brown-muted">
                Los favoritos son privados y se guardan en tu cuenta.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/login?redirect=/favoritos" className="btn-primary rounded-full px-5 py-3 text-sm font-semibold">
                  Ingresar
                </Link>
                <Link href="/register" className="rounded-full border border-olive px-5 py-3 text-sm font-semibold text-olive-dark transition hover:bg-olive-muted">
                  Crear cuenta
                </Link>
              </div>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-border-soft bg-white p-8">
              <h2 className="font-serif text-2xl font-bold text-foreground">Todavia no guardaste favoritos</h2>
              <p className="mt-2 text-sm text-brown-muted">
                Explora productos publicados y toca el corazon para guardarlos aca.
              </p>
              <Link href="/buscar" className="mt-5 inline-flex rounded-full bg-olive px-5 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark">
                Explorar productos
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
