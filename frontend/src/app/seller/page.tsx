import { ProducerDashboard } from "@/components/seller/ProducerDashboard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ValueBanner } from "@/components/layout/ValueBanner";
import { RoleGuard } from "@/components/RoleGuard";

export default function SellerPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <ProducerDashboard />
          </RoleGuard>
        </div>
      </main>
      <ValueBanner />
      <SiteFooter />
    </>
  );
}
