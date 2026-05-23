import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Próximamente"
            title="Checkout"
            description="El flujo de pago queda preparado estructuralmente en Fase 1; la integración completa con Mercado Pago corresponde a Milestone 5 y fases posteriores."
            cta={{ label: "Volver al inicio", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
