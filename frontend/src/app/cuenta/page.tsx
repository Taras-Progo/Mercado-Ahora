"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  BagIcon,
  ChevronRightIcon,
  HeartIcon,
  LeafIcon,
  MessageIcon,
  PackageIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

const quickLinks = [
  {
    href: "/orders",
    title: "Mis pedidos",
    description: "Seguí el estado de tus compras y revisá el historial.",
    icon: PackageIcon,
    badge: "Entrega en Hito 4",
  },
  {
    href: "/favoritos",
    title: "Favoritos",
    description: "Productos y productores que guardaste para más tarde.",
    icon: HeartIcon,
    badge: "Entrega en Hito 3",
  },
  {
    href: "/chat",
    title: "Mensajes",
    description: "Conversaciones con productores y notificaciones de pedidos.",
    icon: MessageIcon,
    badge: "Entrega en Hito 5",
  },
  {
    href: "/categorias",
    title: "Explorar marketplace",
    description: "Descubrí productos naturales, regionales y artesanales.",
    icon: SearchIcon,
    badge: "Catálogo en Hito 3",
  },
];

export default function BuyerAccountPage() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-20 text-center text-sm text-stone-500">
          Cargando tu cuenta…
        </main>
        <SiteFooter />
      </>
    );
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel =
    user.role === "buyer" ? "Comprador" : user.role === "seller" ? "Productor" : "Administrador";

  return (
    <>
      <SiteHeader />
      <main className="bg-background py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:px-10">
          <header className="grid gap-4 rounded-3xl border border-border-soft bg-white p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-olive text-lg font-bold text-white">
              {initials || "U"}
            </span>
            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">
                Bienvenido a Mercado Ahora
              </p>
              <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                ¡Hola, {user.name}!
              </h1>
              <p className="text-sm text-brown-muted">
                Estás conectado como{" "}
                <span className="inline-flex items-center gap-1 rounded-full bg-olive-muted px-2 py-0.5 text-xs font-semibold text-olive-dark">
                  <ShieldCheckIcon className="h-3 w-3" />
                  {roleLabel}
                </span>{" "}
                — {user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border-soft px-4 py-2 text-xs font-semibold text-brown transition hover:border-olive hover:text-olive-dark"
              >
                Ir al marketplace
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => logout().then(() => router.push("/"))}
                className="rounded-full px-4 py-2 text-xs font-semibold text-stone-500 transition hover:text-red-600"
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          <EmailVerificationBanner email={user.email} verified={Boolean(user.email_verified_at)} />

          <section>
            <h2 className="font-serif text-xl font-bold text-foreground">Tu actividad</h2>
            <p className="mt-1 text-sm text-brown-muted">
              Estas secciones se irán habilitando a medida que avanzan los hitos del proyecto.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group grid gap-3 rounded-2xl border border-border-soft bg-white p-5 transition hover:-translate-y-0.5 hover:border-olive hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-olive-muted text-olive-dark transition group-hover:bg-olive group-hover:text-white">
                      <link.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground">{link.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-brown-muted">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition group-hover:text-olive-dark" />
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-cream-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brown-muted">
                    <LeafIcon className="h-3 w-3 text-accent-green" />
                    {link.badge}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border-soft bg-cream-card p-6">
            <div className="flex items-start gap-3">
              <BagIcon className="mt-0.5 h-5 w-5 shrink-0 text-olive" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  ¿Querés vender en Mercado Ahora?
                </h3>
                <p className="mt-1 text-sm text-brown-muted">
                  Si además producís alimentos, artesanías o productos naturales, podés convertirte
                  en productor con esta misma cuenta, sin registrarte de nuevo. Un administrador
                  revisará tu solicitud y vas a poder comprar y vender desde el mismo lugar.
                </p>
                <Link
                  href="/seller/apply"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-olive-dark hover:text-olive"
                >
                  Convertirme en productor
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
