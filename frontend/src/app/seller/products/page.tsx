import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RoleGuard } from "@/components/RoleGuard";

export default function SellerProductsPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <PagePlaceholder
              eyebrow="Mis productos"
              title="Publicar y gestionar productos"
              description="El formulario completo de publicación con fotos, descripción y stock se entrega en Milestone 3 (Publicación de productos y estructura del catálogo). Tu cuenta debe estar aprobada por un administrador."
              cta={{ label: "Volver al panel", href: "/seller" }}
            />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
