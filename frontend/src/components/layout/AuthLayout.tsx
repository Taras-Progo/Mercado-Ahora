import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { LeafIcon } from "@/components/ui/Icons";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

const features = [
  "Conectá directamente con productores locales",
  "Productos naturales, regionales y artesanales",
  "Compra segura dentro de la plataforma",
];

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-0 lg:grid-cols-[1fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-olive-dark p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 50%)",
            }}
          />
          <Link href="/" className="relative">
            <Logo variant="light" size="md" />
          </Link>

          <div className="relative grid gap-6">
            <h2 className="font-serif text-4xl leading-tight">
              Productos reales, <br />
              <span className="text-accent-green">productores reales.</span>
            </h2>
            <p className="max-w-md text-white/80">
              Sumate a una comunidad que valora lo local, lo artesanal y lo natural. Cada compra apoya a una persona y a una historia.
            </p>
            <ul className="mt-2 grid gap-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                    <LeafIcon className="h-3.5 w-3.5" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/60">
            © {new Date().getFullYear()} Mercado Ahora. Hecho en Argentina.
          </p>
        </aside>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-16">
          <div className="w-full max-w-md">
            <Link href="/" className="lg:hidden">
              <Logo size="md" />
            </Link>
            <div className="mt-8 lg:mt-0">
              <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-brown-muted">{subtitle}</p>
            </div>
            <div className="mt-8">{children}</div>
            {footer}
          </div>
        </section>
      </div>
    </main>
  );
}
