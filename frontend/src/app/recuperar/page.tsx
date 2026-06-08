import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PasswordResetForm } from "@/components/PasswordResetForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RecoverPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const token = firstParam(params.token);
  const email = firstParam(params.email);
  const isResetMode = Boolean(token);

  return (
    <AuthLayout
      title={isResetMode ? "Crear nueva contrasena" : "Recuperar contrasena"}
      subtitle={
        isResetMode
          ? "Ingresa tu nueva contrasena para recuperar el acceso a tu cuenta."
          : "Ingresa tu email y te enviaremos un enlace para restablecer el acceso."
      }
      footer={
        <p className="mt-6 text-center text-sm text-stone-600">
          Ya la recordas?{" "}
          <Link href="/login" className="font-semibold text-olive-dark hover:text-olive">
            Volver al ingreso
          </Link>
        </p>
      }
    >
      <PasswordResetForm initialEmail={email} token={token} />
      <section className="mt-8 grid gap-2 rounded-2xl border border-border-soft bg-cream-card p-5">
        <h3 className="text-sm font-semibold text-stone-800">Entrega por email</h3>
        <p className="text-xs leading-relaxed text-stone-600">
          El enlace se envia al email de la cuenta mediante Resend. Si no llega, revisa spam o solicita ayuda a
          administracion.
        </p>
      </section>
    </AuthLayout>
  );
}
