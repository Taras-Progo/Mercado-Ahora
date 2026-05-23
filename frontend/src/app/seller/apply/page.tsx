import { AuthFooterLinks, AuthPanel } from "@/components/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function SellerApplyPage() {
  return (
    <AuthLayout
      title="Postular como productor"
      subtitle="Contanos quién sos y qué producís. Un administrador revisará tu postulación antes de habilitarte a publicar."
      footer={<AuthFooterLinks mode="seller-apply" />}
    >
      <AuthPanel mode="seller-apply" />
    </AuthLayout>
  );
}
