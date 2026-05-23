import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Próximamente"
            title="Tu carrito"
            description="El carrito completo, los subtotales por productor y la coordinación de envíos se entregan dentro de Milestone 4 (Página de producto, chat y flujo de compra)."
            cta={{ label: "Volver al inicio", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
