import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCatalogFilters, getCategories, getProducts } from "@/lib/api";
import { SearchIcon } from "@/components/ui/Icons";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; province?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const province = params.province?.trim() ?? "";
  const productParams = {
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(province ? { province } : {}),
  };
  const filterParams = {
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
  };

  const [products, categories, filters] = await Promise.all([
    getProducts(productParams),
    getCategories(),
    getCatalogFilters(filterParams),
  ]);

  const title = q ? `Resultados para "${q}"` : "Buscar en Mercado Ahora";
  const provinceOptions = filters.provinces;

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="border-b border-border-soft bg-cream py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Catálogo</p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-foreground sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brown-muted">
              Encontrá productos reales de productores locales. Podés buscar por nombre, categoría o provincia.
            </p>

            <form
              action="/buscar"
              className="mt-7 grid gap-3 rounded-3xl border border-border-soft bg-white p-3 shadow-sm lg:grid-cols-[1fr_220px_220px_auto]"
            >
              <label className="flex min-w-0 items-center gap-3 rounded-2xl bg-cream-card px-4">
                <SearchIcon className="h-5 w-5 shrink-0 text-brown-icon" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="¿Qué estás buscando?"
                  className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-brown-muted/55"
                />
              </label>
              <select
                name="category"
                defaultValue={category}
                className="rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
              >
                <option value="">Todas las categorías</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                name="province"
                defaultValue={province}
                disabled={provinceOptions.length === 0}
                className="rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-olive focus:ring-2 focus:ring-olive/20 disabled:cursor-not-allowed disabled:bg-cream-card disabled:text-brown-muted/60"
              >
                <option value="">
                  {provinceOptions.length === 0 ? "Sin provincias disponibles" : "Todas las provincias"}
                </option>
                {provinceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} ({item.count})
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary rounded-full px-7 py-3 text-sm font-semibold">
                Buscar
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Productos encontrados</h2>
              <p className="mt-1 text-sm text-brown-muted">
                {products.length === 1 ? "1 producto disponible" : `${products.length} productos disponibles`}
              </p>
            </div>
            {(q || category || province) && (
              <Link href="/buscar" className="text-sm font-semibold text-olive-dark transition hover:text-olive">
                Limpiar búsqueda
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-border-soft bg-white p-10 text-center">
              <h3 className="font-serif text-2xl font-bold text-foreground">No encontramos productos</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-brown-muted">
                Probá con otra palabra, revisá la categoría o volvé al catálogo para explorar productos disponibles.
              </p>
              <Link
                href="/categorias"
                className="btn-primary mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
              >
                Explorar categorías
              </Link>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
