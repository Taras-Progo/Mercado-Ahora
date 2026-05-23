import { AuthFooterLinks, AuthPanel } from "@/components/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Crear cuenta comprador"
      subtitle="Registrate para explorar productos, consultar a productores y realizar compras en Mercado Ahora."
      footer={<AuthFooterLinks mode="register" />}
    >
      <AuthPanel mode="register" />
    </AuthLayout>
  );
}
