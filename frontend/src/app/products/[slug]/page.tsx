import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Próximamente"
            title="Página de producto"
            description={`La página completa con galería, descripción, historia del productor y reseñas se entrega en Milestone 4. Identificador del producto: ${slug}.`}
            cta={{ label: "Volver al inicio", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
