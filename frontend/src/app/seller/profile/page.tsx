import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RoleGuard } from "@/components/RoleGuard";

export default function SellerProfilePage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <PagePlaceholder
              eyebrow="Perfil del productor"
              title="Editar tu perfil público"
              description="El perfil público completo con historia, fotos del proceso y galería se entrega en Milestone 3. En Milestone 2 ya guardamos los datos básicos durante la postulación."
              cta={{ label: "Volver al panel", href: "/seller" }}
            />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
