import { Suspense } from "react";
import { AuthFooterLinks, AuthPanel, AuthPreparedFlows } from "@/components/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Ingresar"
      subtitle="Usá tu cuenta para acceder al marketplace y conectar con productores locales."
      footer={<AuthFooterLinks mode="login" />}
    >
      <Suspense fallback={<AuthPanelFallback />}>
        <AuthPanel mode="login" />
        <AuthPreparedFlows />
      </Suspense>
    </AuthLayout>
  );
}

function AuthPanelFallback() {
  return (
    <div className="grid gap-3">
      <div className="h-12 animate-pulse rounded-xl bg-cream-card" />
      <div className="h-12 animate-pulse rounded-xl bg-cream-card" />
      <div className="h-12 animate-pulse rounded-xl bg-cream-card" />
    </div>
  );
}
