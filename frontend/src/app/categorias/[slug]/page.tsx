import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const labels: Record<string, string> = {
  artesanias: "Artesanías",
  "ropa-accesorios": "Ropa y accesorios hechos a mano",
  "productos-regionales": "Productos regionales",
  "decoracion-hogar": "Decoración y hogar",
  "productos-ecologicos": "Productos ecológicos",
  "emprendimientos-locales": "Emprendimientos locales",
  "servicios-locales": "Servicios locales",
};

export default async function CategoriaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const label = labels[slug] ?? slug.replace(/-/g, " ");

  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Próximamente · Hito 3"
            title={`Categoría: ${label}`}
            description="Los productos filtrados por categoría se entregan dentro del Hito 3. Por ahora estás viendo la página de la categoría seleccionada para validar la navegación."
            cta={{ label: "Volver al inicio", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
