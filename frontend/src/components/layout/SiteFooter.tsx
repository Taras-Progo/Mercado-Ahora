import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const nav = [
  {
    title: "Navegación",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Categorías", href: "/categorias" },
      { label: "Productores", href: "/productores" },
      { label: "Cómo funciona", href: "/como-funciona" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Centro de ayuda", href: "/ayuda" },
      { label: "Preguntas frecuentes", href: "/ayuda#faq" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/terminos" },
      { label: "Política de privacidad", href: "/privacidad" },
    ],
  },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/mercadoahora.digital/",
    shortLabel: "IG",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61558092747360",
    shortLabel: "FB",
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#2f3d27] text-white/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr_1fr] lg:px-10">
        <div>
          <Logo variant="light" size="lg" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            Mercado Ahora conecta personas con productos reales. Apoyamos a productores locales y al consumo consciente en Argentina.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {nav.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{column.title}</h4>
              <ul className="mt-4 grid gap-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link className="text-white/70 transition hover:text-white" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Seguinos</h4>
          <div className="mt-4 flex gap-3">
            {socialLinks.map((social) => (
              <Link
                key={social.href}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xs font-semibold transition hover:bg-white/10"
              >
                {social.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>© {new Date().getFullYear()} Mercado Ahora. Hecho en Argentina.</p>
          <p>mercadoahora.com.ar</p>
        </div>
      </div>
    </footer>
  );
}
