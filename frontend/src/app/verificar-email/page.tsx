import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckCircleIcon, MessageIcon } from "@/components/ui/Icons";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const verified = firstParam(params.status) === "verified";

  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-12">
        <div className="mx-auto grid max-w-3xl gap-6 rounded-3xl border border-border-soft bg-white p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive-muted text-olive-dark">
            {verified ? <CheckCircleIcon className="h-6 w-6" /> : <MessageIcon className="h-6 w-6" />}
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Verificacion de email</p>
          <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
            {verified ? "Email verificado" : "Confirma tu email"}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-600">
            {verified
              ? "Tu cuenta ya quedo confirmada. Podes volver al sitio y seguir usando Mercado Ahora con normalidad."
              : "Te enviaremos un correo con un enlace seguro. Abri ese enlace desde tu email para confirmar la cuenta."}
          </p>

          <ul className="mx-auto grid max-w-md gap-3 text-left">
            <li className="inline-flex items-center gap-2 text-sm text-stone-700">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              Enlace firmado y seguro para confirmar tu email.
            </li>
            <li className="inline-flex items-center gap-2 text-sm text-stone-700">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              Entrega de correo activa mediante Resend.
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
