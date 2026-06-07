import Link from "next/link";
import { getCategories } from "@/lib/api";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  CategoryJarIcon,
  CategoryPlantIcon,
  CategoryShopIcon,
  CategoryToolsIcon,
  CategoryVaseIcon,
  ChevronRightIcon,
  LeafIcon,
  SearchIcon,
} from "@/components/ui/Icons";

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

const categoryAccents = [
  "bg-emerald-50 text-emerald-800",
  "bg-amber-50 text-amber-800",
  "bg-sky-50 text-sky-800",
  "bg-rose-50 text-rose-800",
  "bg-lime-50 text-lime-800",
  "bg-stone-100 text-stone-800",
  "bg-orange-50 text-orange-800",
  "bg-teal-50 text-teal-800",
];

export default async function CategoriasPage() {
  const categories = await getCategories();
  const parents = categories.filter((category) => !category.parent_id);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <div className="overflow-hidden rounded-2xl border border-border-soft bg-white">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Mercado Ahora</p>
                <h1 className="mt-2 font-serif text-3xl font-bold text-foreground sm:text-4xl">Explorar categorias</h1>
                <p className="mt-3 max-w-2xl text-base text-brown-muted">
                  Encontra alimentos, bienestar, hogar sostenible y productos regionales de productores locales.
                </p>

                <form action="/buscar" className="mt-6 flex max-w-xl items-center gap-1 rounded-full border border-border-soft bg-white p-1.5 shadow-sm">
                  <label className="flex min-w-0 flex-1 items-center gap-3 pl-4">
                    <SearchIcon className="h-5 w-5 shrink-0 text-brown-icon" />
                    <input
                      name="q"
                      placeholder="Que estas buscando?"
                      className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-brown-muted/55"
                    />
                  </label>
                  <button type="submit" className="btn-primary shrink-0 rounded-full px-6 py-3 text-sm font-semibold">
                    Buscar
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap gap-2">
                  {parents.slice(0, 4).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categorias/${category.slug}`}
                      className="rounded-full border border-border-soft px-3 py-1.5 text-xs font-semibold text-brown transition hover:border-olive hover:text-olive-dark"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative min-h-48 overflow-hidden bg-olive-muted lg:min-h-full">
                <img
                  src="/design/category-hero.png"
                  alt="Productos naturales de Mercado Ahora"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {parents.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-border-soft bg-white p-12 text-center">
              <CategoryShopIcon className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 text-lg font-semibold text-stone-700">No hay categorias disponibles</h2>
              <p className="mt-1 text-sm text-stone-500">Las categorias estaran disponibles pronto.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {parents.map((category, index) => {
                const Icon = categoryIcons[category.slug] ?? CategoryShopIcon;
                const children = categories.filter((child) => child.parent_id === category.id);
                const accent = categoryAccents[index % categoryAccents.length];

                return (
                  <Link
                    key={category.id}
                    href={`/categorias/${category.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border-soft bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className={`flex h-28 items-center justify-between px-5 ${accent}`}>
                      <Icon className="h-12 w-12" />
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold">
                        Ver categoria
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="mt-1 text-xs text-brown-muted line-clamp-2">{category.description}</p>
                      {children.length > 0 && (
                        <p className="mt-2 text-[11px] font-medium text-olive">
                          {children.length} subcategoria{children.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brown transition group-hover:text-olive-dark">
                        Ver mas
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
