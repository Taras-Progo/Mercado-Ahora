import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const faqs = [
  {
    question: "¿Cómo compro en Mercado Ahora?",
    answer: "Buscá productos, agregalos al carrito o usá Comprar ahora. El pedido queda pendiente y la coordinación de pago y entrega se realiza manualmente con el productor.",
  },
  {
    question: "¿Cómo vendo mis productos?",
    answer: "Registrate, solicitá convertirte en productor, completá tu perfil y esperá la aprobación administrativa. Después podés publicar productos, imágenes, stock y gestionar pedidos.",
  },
  {
    question: "¿Cómo funcionan las devoluciones?",
    answer: "Cuando un pedido figura como entregado, el comprador puede solicitar una devolución desde Mis pedidos. Administración revisa la solicitud y actualiza el estado.",
  },
  {
    question: "¿Ya están integrados pagos y envíos automáticos?",
    answer: "No. En esta fase MVP los pagos y entregas se coordinan manualmente. Las integraciones con proveedores externos quedan para una etapa posterior.",
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <section className="rounded-2xl border border-border-soft bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Centro de ayuda</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground">Ayuda</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brown-muted">
              Información básica para compradores, productores y administradores durante la fase MVP de Mercado Ahora.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contacto" className="rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark">
                Contactar soporte
              </Link>
              <Link href="/terminos" className="rounded-full border border-border-soft px-5 py-2.5 text-sm font-semibold text-olive-dark transition hover:border-olive">
                Ver términos
              </Link>
            </div>
          </section>

          <section id="faq" className="mt-8 grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-border-soft bg-white p-6">
                <h2 className="text-base font-semibold text-foreground">{faq.question}</h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">{faq.answer}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
