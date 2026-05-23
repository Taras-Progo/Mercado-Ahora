import { ProducerReview } from "@/components/admin/ProducerReview";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RoleGuard } from "@/components/RoleGuard";

export default function AdminPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["admin"]}>
            <ProducerReview />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
