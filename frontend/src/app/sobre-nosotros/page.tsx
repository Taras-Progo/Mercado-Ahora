import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function SobreNosotrosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Página institucional"
            title="Sobre Mercado Ahora"
            description="Apoyamos el consumo consciente y a los productores locales de Argentina. El contenido institucional definitivo se completa al cierre del Hito 5."
            cta={{ label: "Volver al inicio", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
