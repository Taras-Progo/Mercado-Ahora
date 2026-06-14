import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const sections = [
  {
    title: "Datos de cuenta",
    body: "Guardamos los datos necesarios para operar cuentas, perfiles de productor, productos, pedidos, mensajes y devoluciones.",
  },
  {
    title: "Comunicación",
    body: "Usamos el email para recuperación de contraseña, verificación de cuenta y comunicaciones operativas vinculadas a la plataforma.",
  },
  {
    title: "Información de pedidos",
    body: "Los compradores y productores relacionados con una operación pueden ver los datos necesarios para coordinar entrega, pago manual y seguimiento del pedido.",
  },
  {
    title: "Seguridad",
    body: "Las contraseñas se almacenan de forma protegida. El acceso administrativo queda restringido a tareas de soporte, revisión y operación del MVP.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <section className="rounded-2xl border border-border-soft bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Legal</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground">Política de privacidad</h1>
            <p className="mt-3 text-sm leading-6 text-brown-muted">
              Resumen de tratamiento de datos para la fase MVP de Mercado Ahora.
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
