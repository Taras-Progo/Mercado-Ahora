import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { BagIcon, LeafIcon, ChevronRightIcon } from "@/components/ui/Icons";

const roles = [
  {
    id: "buyer",
    href: "/register/buyer",
    badge: "Comprador",
    title: "Quiero comprar",
    description: "Descubrí productos naturales, artesanales y regionales, y conectá con quien los produce.",
    bullets: [
      "Explorá el marketplace sin restricciones",
      "Conversá con cada productor antes de comprar",
      "Seguí tus pedidos y guardá favoritos",
    ],
    icon: BagIcon,
  },
  {
    id: "seller",
    href: "/seller/apply",
    badge: "Productor / Emprendedor",
    title: "Quiero vender",
    description: "Publicá tus productos, contá tu historia y construí comunidad con quienes valoran lo local.",
    bullets: [
      "Tu propio perfil con historia y proceso",
      "Gestioná pedidos, stock y mensajes",
      "EcoScore y métricas para crecer",
    ],
    icon: LeafIcon,
  },
];

export default function RegisterChooserPage() {
  return (
    <AuthLayout
      title="Sumate a Mercado Ahora"
      subtitle="Elegí cómo querés participar. Podés cambiar de rol más adelante contactando a soporte."
      footer={
        <p className="mt-8 text-center text-sm text-stone-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-olive-dark hover:text-olive">
            Ingresar
          </Link>
        </p>
      }
    >
      <div className="grid gap-4">
        {roles.map((role) => (
          <Link
            key={role.id}
            href={role.href}
            className="group relative grid gap-3 rounded-2xl border-2 border-border-soft bg-white p-6 transition hover:-translate-y-0.5 hover:border-olive hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brown-icon/30 bg-cream text-brown-icon transition group-hover:border-olive group-hover:bg-olive group-hover:text-white">
                <role.icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-olive">{role.badge}</p>
                <h2 className="mt-0.5 font-serif text-xl font-bold text-foreground">{role.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-brown-muted">{role.description}</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-brown-icon transition group-hover:translate-x-0.5 group-hover:text-olive" />
            </div>

            <ul className="mt-1 grid gap-1.5 border-t border-border-soft pt-3 text-xs text-stone-600 sm:grid-cols-3">
              {role.bullets.map((bullet) => (
                <li key={bullet} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-olive" />
                  {bullet}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-stone-500">
        Tu cuenta de productor requiere aprobación de un administrador antes de publicar productos activos.
      </p>
    </AuthLayout>
  );
}
