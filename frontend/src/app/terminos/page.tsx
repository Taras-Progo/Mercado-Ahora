import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const sections = [
  {
    title: "Uso de la plataforma",
    body: "Mercado Ahora conecta compradores con productores locales. Cada usuario debe mantener datos reales y utilizar la plataforma para operaciones legítimas.",
  },
  {
    title: "Pagos y entregas en MVP",
    body: "Durante la fase inicial, los pagos y entregas se coordinan manualmente entre comprador y productor. Mercado Ahora registra pedidos y estados, pero no procesa pagos online ni genera etiquetas de envío.",
  },
  {
    title: "Productos publicados",
    body: "Los productores son responsables por la información, precio, stock, imágenes y disponibilidad de sus productos. La administración puede revisar, pausar o retirar publicaciones cuando sea necesario.",
  },
  {
    title: "Pedidos y devoluciones",
    body: "El comprador puede solicitar devoluciones de pedidos entregados. La administración revisa cada solicitud y actualiza el estado correspondiente.",
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <section className="rounded-2xl border border-border-soft bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Legal</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground">Términos y condiciones</h1>
            <p className="mt-3 text-sm leading-6 text-brown-muted">
              Condiciones operativas de uso para la fase MVP de Mercado Ahora.
            </p>
          </section>
          <div className="mt-6 grid gap-4">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border-soft bg-white p-6">
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
