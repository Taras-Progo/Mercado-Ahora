import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function FavoritosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Próximamente · Hito 3"
            title="Tus favoritos"
            description="La lista de favoritos (productos y productores guardados) se entrega dentro del Hito 3, una vez disponible el catálogo público."
            cta={{ label: "Ir al marketplace", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
