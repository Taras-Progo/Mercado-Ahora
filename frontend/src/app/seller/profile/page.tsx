import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { SellerBackLink } from "@/components/seller/SellerBackLink";
import { SellerProfileForm } from "@/components/seller/SellerProfileForm";

export default function SellerProfilePage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerBackLink className="mb-6" />
            <SellerProfileForm />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
