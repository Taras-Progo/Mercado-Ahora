import Link from "next/link";
import { AuthFooterLinks, AuthPanel } from "@/components/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ChevronRightIcon } from "@/components/ui/Icons";

export default function RegisterBuyerPage() {
  return (
    <AuthLayout
      title="Crear cuenta comprador"
      subtitle="Registrate para explorar productos, consultar a productores y realizar compras en Mercado Ahora."
      footer={<AuthFooterLinks mode="register" />}
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-soft bg-cream-card px-3 py-1.5 text-xs font-medium text-stone-600">
        <span className="rounded-full bg-olive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Comprador
        </span>
        <span>·</span>
        <Link href="/register" className="inline-flex items-center gap-1 font-semibold text-olive-dark hover:text-olive">
          Cambiar rol
          <ChevronRightIcon className="h-3 w-3" />
        </Link>
      </div>
      <AuthPanel mode="register" />
    </AuthLayout>
  );
}
