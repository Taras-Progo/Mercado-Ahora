import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PasswordResetForm } from "@/components/PasswordResetForm";

export default function RecoverPage() {
  return (
    <AuthLayout
      title="Recuperar contrasena"
      subtitle="Ingresa tu email para dejar registrada la solicitud de restablecimiento."
      footer={
        <p className="mt-6 text-center text-sm text-stone-600">
          Ya la recordas?{" "}
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
          El envio automatico de correos se activara con Resend. Mientras tanto, administracion puede restablecer la
          contrasena temporalmente desde el panel de usuarios.
        </p>
      </section>
    </AuthLayout>
  );
}
