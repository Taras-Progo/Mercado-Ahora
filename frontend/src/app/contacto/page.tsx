import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <section className="rounded-2xl border border-border-soft bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Contacto</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground">Hablemos</h1>
            <p className="mt-3 text-sm leading-6 text-brown-muted">
              Para consultas operativas, soporte de cuentas, pedidos o devoluciones, escribinos y contanos el email de tu cuenta y el número de pedido si corresponde.
            </p>
            <div className="mt-6 rounded-2xl bg-cream-card p-5 text-sm text-brown">
              <p className="font-semibold text-foreground">Mercado Ahora</p>
              <p className="mt-1">Email de soporte: soporte@mercadoahora.com.ar</p>
              <p className="mt-1">Instagram: @mercadoahora.digital</p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
