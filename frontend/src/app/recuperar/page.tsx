import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PasswordResetForm } from "@/components/PasswordResetForm";

export default function RecoverPage() {
  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña."
      footer={
        <p className="mt-6 text-center text-sm text-stone-600">
          ¿Ya la recordás?{" "}
          <Link href="/login" className="font-semibold text-olive-dark hover:text-olive">
            Volver al ingreso
          </Link>
        </p>
      }
    >
      <PasswordResetForm />
      <section className="mt-8 grid gap-2 rounded-2xl border border-border-soft bg-cream-card p-5">
        <h3 className="text-sm font-semibold text-stone-800">Estado de la entrega</h3>
        <p className="text-xs leading-relaxed text-stone-600">
          La estructura para recuperar contraseña está lista en backend y frontend (Milestone 2). El envío real del correo
          se entrega en una fase posterior junto a la verificación de email.
        </p>
      </section>
    </AuthLayout>
  );
}
