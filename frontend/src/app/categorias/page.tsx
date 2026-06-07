import Link from "next/link";
import type { Category } from "@/lib/api";
import { getCategories } from "@/lib/api";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ValueBanner } from "@/components/layout/ValueBanner";
import {
  CategoryJarIcon,
  CategoryPlantIcon,
  CategoryShopIcon,
  CategoryToolsIcon,
  CategoryVaseIcon,
  ChevronRightIcon,
  HandshakeIcon,
  LeafIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=2000&q=85";

const HERO_BACKGROUND = `
  linear-gradient(
    to right,
    #f2ebe1 0%,
    #f2ebe1 24%,
    rgba(242, 235, 225, 0.98) 38%,
    rgba(242, 235, 225, 0.82) 50%,
    rgba(242, 235, 225, 0.36) 64%,
    rgba(242, 235, 225, 0) 78%
  ),
  url('${HERO_IMAGE}')
`;

type CategoryPresentation = {
  icon: typeof LeafIcon;
  description: string;
  image: string;
  accent: string;
};

const defaultPresentation: CategoryPresentation = {
  icon: CategoryShopIcon,
  description: "Productos reales seleccionados por productores y emprendedores locales.",
  image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
  accent: "bg-olive-muted text-olive-dark",
};

const categoryPresentation: Record<string, CategoryPresentation> = {
  "alimentos-naturales": {
    icon: CategoryJarIcon,
    description: "Miel, conservas, frutos secos y alimentos de produccion cuidada.",
    image: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=900&q=80",
    accent: "bg-olive-muted text-olive-dark",
  },
  "huerta-y-productos-frescos": {
    icon: CategoryPlantIcon,
    description: "Frutas, verduras, huevos y productos frescos de cercania.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    accent: "bg-emerald-50 text-emerald-800",
  },
  "bebidas-naturales": {
    icon: CategoryJarIcon,
    description: "Infusiones, tes, jugos y bebidas naturales para todos los dias.",
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
    accent: "bg-amber-50 text-amber-800",
  },
  "cosmetica-natural": {
    icon: LeafIcon,
    description: "Jabones, cremas, aceites y cuidado personal con ingredientes naturales.",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80",
    accent: "bg-lime-50 text-lime-800",
  },
  "bienestar-y-salud-natural": {
    icon: LeafIcon,
    description: "Productos herbales, suplementos y alternativas para el bienestar.",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
    accent: "bg-teal-50 text-teal-800",
  },
  "hogar-sostenible": {
    icon: CategoryShopIcon,
    description: "Objetos reutilizables, decoracion y soluciones para un hogar consciente.",
    image: "https://images.unsplash.com/photo-1467043198406-dc953a3defa0?auto=format&fit=crop&w=900&q=80",
    accent: "bg-stone-100 text-stone-800",
  },
  "artesanias-y-productos-regionales": {
    icon: CategoryVaseIcon,
    description: "Piezas hechas a mano, productos regionales e historias con identidad.",
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80",
    accent: "bg-orange-50 text-orange-800",
  },
  "mascotas-naturales": {
    icon: CategoryToolsIcon,
    description: "Alimentos, accesorios y alternativas naturales para mascotas.",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80",
    accent: "bg-rose-50 text-rose-800",
  },
};

const valueProps = [
  {
    icon: LeafIcon,
    title: "Natural y local",
    text: "productos con origen cercano",
  },
  {
    icon: HandshakeIcon,
    title: "Productores reales",
    text: "historias y trato directo",
  },
  {
    icon: ShieldCheckIcon,
    title: "Compra consciente",
    text: "informacion clara para elegir",
  },
];

export default async function CategoriasPage() {
  const categories = await getCategories();
  const parents = categories.filter((category) => !category.parent_id);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section
          className="relative min-h-[400px] overflow-hidden bg-cream bg-cover bg-[center_right] bg-no-repeat sm:min-h-[470px] lg:min-h-[520px]"
          style={{ backgroundImage: HERO_BACKGROUND }}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="max-w-xl lg:max-w-[48%]">
              <h1 className="font-serif text-4xl leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                Explora nuestras
                <br />
                <span className="text-accent-green">categorias</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-brown-muted sm:text-lg">
                Encontra productos reales, hechos por productores locales cerca tuyo.
              </p>

              <form
                action="/buscar"
                className="mt-8 flex max-w-xl items-center gap-1 rounded-full border border-border-soft bg-white p-1.5 card-shadow"
              >
                <label className="flex min-w-0 flex-1 items-center gap-3 pl-4">
                  <SearchIcon className="h-5 w-5 shrink-0 text-brown-icon" />
                  <input
                    name="q"
                    placeholder="Que estas buscando?"
                    className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-brown-muted/55"
                  />
                </label>
                <button
                  type="submit"
                  className="btn-primary shrink-0 rounded-full px-7 py-3 text-sm font-semibold sm:px-8"
                >
                  Buscar
                </button>
              </form>

              <ul className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-3 sm:gap-4">
                {valueProps.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex items-start gap-2.5 text-sm text-brown-muted">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brown" aria-hidden />
                    <p className="leading-snug">
                      <span className="block font-semibold text-brown">{title}</span>
                      <span>{text}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
                <LeafIcon className="h-5 w-5 text-accent-green" aria-hidden />
                Explora por categorias
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brown-muted">
                Recorre las categorias principales y encontra productores, productos naturales y opciones sustentables.
              </p>
            </div>
          </div>

          {parents.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
              <CategoryShopIcon className="mx-auto h-12 w-12 text-brown-icon" />
              <h3 className="mt-4 text-base font-semibold text-brown">No hay categorias disponibles</h3>
              <p className="mt-1 text-sm text-brown-muted">Las categorias estaran disponibles pronto.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {parents.map((category) => (
                <CategoryCard key={category.id} category={category} categories={categories} />
              ))}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-border-soft bg-cream p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-olive-dark">
                  <LeafIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-base font-semibold text-brown">Apoya lo local, elegi natural, elegi consciente.</p>
                  <p className="mt-1 text-sm text-brown-muted">
                    Cada compra impulsa a productores y emprendedores de tu comunidad.
                  </p>
                </div>
              </div>
              <Link
                href="/como-funciona"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-olive px-5 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
              >
                Conoce como funciona
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <ValueBanner />
      </main>
      <SiteFooter />
    </>
  );
}

function CategoryCard({ category, categories }: { category: Category; categories: Category[] }) {
  const presentation = categoryPresentation[category.slug] ?? defaultPresentation;
  const Icon = presentation.icon;
  const children = categories.filter((child) => child.parent_id === category.id);
  const countLabel = categoryCountLabel(category, children.length);

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className="group overflow-hidden rounded-2xl border border-border-soft bg-white card-shadow transition hover:-translate-y-1 hover:border-brown-icon/40 hover:shadow-lg"
    >
      <div className="p-5">
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${presentation.accent}`}>
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="mt-5 font-serif text-xl font-bold leading-tight text-foreground">{category.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-relaxed text-brown-muted">
          {category.description || presentation.description}
        </p>
      </div>

      <div className="mx-5 overflow-hidden rounded-xl bg-cream-card">
        <img
          src={presentation.image}
          alt={category.name}
          className="h-36 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="flex items-center justify-between px-5 py-4 text-sm">
        <span className="text-brown-muted">{countLabel}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-olive-dark">
          Ver mas
          <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function categoryCountLabel(category: Category, childrenCount: number) {
  const categoryWithCount = category as Category & { products_count?: number };
  if (typeof categoryWithCount.products_count === "number") {
    return `${categoryWithCount.products_count} productos`;
  }
  if (childrenCount > 0) {
    return `${childrenCount} subcategoria${childrenCount === 1 ? "" : "s"}`;
  }
  return "Ver productos";
}
