import { AuthFooterLinks, AuthPanel, AuthPreparedFlows } from "@/components/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Ingresar"
      subtitle="Usá tu cuenta para acceder al marketplace y conectar con productores locales."
      footer={<AuthFooterLinks mode="login" />}
    >
      <AuthPanel mode="login" />
      <AuthPreparedFlows />
    </AuthLayout>
  );
}
