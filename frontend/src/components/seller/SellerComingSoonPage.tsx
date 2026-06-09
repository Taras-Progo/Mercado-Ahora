import { RoleGuard } from "@/components/RoleGuard";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SellerBackLink } from "@/components/seller/SellerBackLink";

type Props = {
  title: string;
  description: string;
};

export function SellerComingSoonPage({ title, description }: Props) {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerBackLink className="mb-6" />
            <PagePlaceholder
              eyebrow="Próximamente disponible"
              title={title}
              description={description}
              cta={{ label: "Volver al panel del productor", href: "/seller" }}
            />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
