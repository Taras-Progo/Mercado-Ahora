import Link from "next/link";
import {
  CategoryJarIcon,
  CategoryPlantIcon,
  CategoryShirtIcon,
  CategoryShopIcon,
  CategoryToolsIcon,
  CategoryVaseIcon,
  ChevronRightIcon,
  LeafIcon,
} from "@/components/ui/Icons";

const categories = [
  { label: "Artesanías", icon: CategoryVaseIcon, slug: "artesanias" },
  { label: "Ropa y accesorios hechos a mano", icon: CategoryShirtIcon, slug: "ropa-accesorios" },
  { label: "Productos regionales", icon: CategoryJarIcon, slug: "productos-regionales" },
  { label: "Decoración y hogar", icon: CategoryPlantIcon, slug: "decoracion-hogar" },
  { label: "Productos ecológicos", icon: LeafIcon, slug: "productos-ecologicos" },
  { label: "Emprendimientos locales", icon: CategoryShopIcon, slug: "emprendimientos-locales" },
  { label: "Servicios locales", icon: CategoryToolsIcon, slug: "servicios-locales" },
];

export function CategoriesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
      <SectionHeader title="Explorá por categorías" actionLabel="Ver todas" href="/categorias" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categorias/${category.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border-soft bg-cream-card px-3 py-6 text-center transition hover:-translate-y-1 hover:border-brown-icon/40 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brown-icon/35 bg-cream text-brown-icon transition group-hover:border-olive group-hover:bg-olive group-hover:text-white">
              <category.icon className="h-5 w-5" />
            </span>
            <p className="text-xs font-medium leading-snug text-brown">{category.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  href,
  subtitle,
}: {
  title: string;
  actionLabel?: string;
  href?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
          <LeafIcon className="h-5 w-5 text-accent-green" aria-hidden />
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-brown-muted">{subtitle}</p>}
      </div>
      {actionLabel && href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brown transition hover:text-olive-dark"
        >
          {actionLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
