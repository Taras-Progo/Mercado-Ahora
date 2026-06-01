import Link from "next/link";
import { getCategories } from "@/lib/api";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CategoryJarIcon, CategoryPlantIcon, CategoryShopIcon, CategoryToolsIcon, CategoryVaseIcon, ChevronRightIcon, LeafIcon, SearchIcon } from "@/components/ui/Icons";

const categoryIcons: Record<string, typeof LeafIcon> = {
  "alimentos-naturales": CategoryJarIcon,
  "huerta-y-productos-frescos": CategoryPlantIcon,
  "bebidas-naturales": CategoryJarIcon,
  "cosmetica-natural": LeafIcon,
  "bienestar-y-salud-natural": LeafIcon,
  "hogar-sostenible": CategoryShopIcon,
  "artesanias-y-productos-regionales": CategoryVaseIcon,
  "mascotas-naturales": CategoryToolsIcon,
};

export default async function CategoriasPage() {
  const categories = await getCategories();
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Explorar categorías</h1>
            <p className="mt-3 text-base text-brown-muted">
              Encontrá productos reales, hechos por productores locales.
            </p>

            <form action="/buscar" className="mt-6 flex max-w-xl items-center gap-1 rounded-full border border-border-soft bg-white p-1.5 card-shadow">
              <label className="flex min-w-0 flex-1 items-center gap-3 pl-4">
                <SearchIcon className="h-5 w-5 shrink-0 text-brown-icon" />
                <input
                  name="q"
                  placeholder="¿Qué estás buscando?"
                  className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-brown-muted/55"
                />
              </label>
              <button type="submit" className="btn-primary shrink-0 rounded-full px-7 py-3 text-sm font-semibold">
                Buscar
              </button>
            </form>
          </div>

          {parents.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-border-soft bg-white p-12 text-center">
              <CategoryShopIcon className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 text-lg font-semibold text-stone-700">No hay categorías disponibles</h2>
              <p className="mt-1 text-sm text-stone-500">Las categorías estarán disponibles pronto.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {parents.map((category) => {
                const Icon = categoryIcons[category.slug] ?? CategoryShopIcon;
                const children = categories.filter((c) => c.parent_id === category.id);

                return (
                  <Link
                    key={category.id}
                    href={`/categorias/${category.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border-soft bg-white transition hover:shadow-lg"
                  >
                    <div className="flex h-28 items-center justify-center bg-cream-card text-brown-icon transition group-hover:bg-olive-muted group-hover:text-olive">
                      <Icon className="h-10 w-10" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="mt-1 text-xs text-brown-muted line-clamp-2">{category.description}</p>
                      {children.length > 0 && (
                        <p className="mt-2 text-[11px] font-medium text-olive">
                          {children.length} subcategoría{children.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brown transition group-hover:text-olive-dark">
                        Ver más
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}