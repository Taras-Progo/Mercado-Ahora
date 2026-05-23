import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckCircleIcon, LeafIcon, MessageIcon } from "@/components/ui/Icons";

export default function VerifyEmailPage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-12">
        <div className="mx-auto grid max-w-3xl gap-6 rounded-3xl border border-border-soft bg-white p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive-muted text-olive-dark">
            <MessageIcon className="h-6 w-6" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Verificación de email</p>
          <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Confirmá tu email</h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-600">
            En Milestone 2 dejamos preparada la infraestructura para validar tu email. El envío automático del correo se
            entregará en una fase posterior. Mientras tanto, podés solicitar el reenvío desde tu panel y un administrador
            puede confirmar manualmente tu cuenta si lo necesitás.
          </p>

          <ul className="mx-auto grid max-w-md gap-3 text-left">
            <li className="inline-flex items-center gap-2 text-sm text-stone-700">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              Endpoint de verificación preparado en el backend.
            </li>
            <li className="inline-flex items-center gap-2 text-sm text-stone-700">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              Token y sesión persistentes después del registro.
            </li>
            <li className="inline-flex items-center gap-2 text-sm text-stone-700">
              <LeafIcon className="h-4 w-4 text-olive" />
              Envío de correo real: fase posterior.
            </li>
          </ul>

          <Link
            href="/login"
            className="mx-auto inline-flex items-center gap-2 rounded-full bg-olive-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive"
          >
            Volver al ingreso
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
