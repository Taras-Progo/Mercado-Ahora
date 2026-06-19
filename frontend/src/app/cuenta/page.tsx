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
    description: "Seguí el estado de tus compras, revisá entregas y solicitá devoluciones cuando corresponda.",
    icon: PackageIcon,
    badge: "Seguimiento de compras",
  },
  {
    href: "/favoritos",
    title: "Favoritos",
    description: "Volvé rápido a productos naturales, artesanales y regionales que guardaste.",
    icon: HeartIcon,
    badge: "Productos guardados",
  },
  {
    href: "/chat",
    title: "Mensajes",
    description: "Conversá con productores para coordinar dudas, entregas o detalles de un pedido.",
    icon: MessageIcon,
    badge: "Contacto directo",
  },
  {
    href: "/categorias",
    title: "Explorar marketplace",
    description: "Descubrí alimentos, bienestar, hogar sostenible y productos hechos cerca tuyo.",
    icon: SearchIcon,
    badge: "Catálogo local",
  },
];

const identityNotes = [
  "Compras a productores locales",
  "Productos naturales y artesanales",
  "Pedidos coordinados de forma simple",
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
        <main className="bg-[#f7f2e8] py-20 text-center text-sm text-stone-500">
          Cargando tu cuenta...
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
      <main className="bg-[linear-gradient(180deg,#f7f2e8_0%,#fbfaf6_45%,#f7f2e8_100%)] py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:px-10">
          <header className="relative overflow-hidden rounded-[1.75rem] border border-[#ddcdb9] bg-gradient-to-br from-[#fffdf8] via-[#faf8f5] to-[#efe4d4] p-6 shadow-sm sm:p-8">
            <div className="absolute right-5 top-5 hidden rounded-full border border-[#d8c3aa] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brown-muted sm:inline-flex">
              Mercado Ahora
            </div>

            <div className="grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-olive text-lg font-bold text-white shadow-sm ring-4 ring-white/70">
                {initials || "U"}
              </span>

              <div className="grid gap-2">
                <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#efe4d4] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brown">
                  <LeafIcon className="h-3.5 w-3.5 text-olive" />
                  Cuenta de comprador
                </p>
                <h1 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  Hola, {user.name}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-brown-muted">
                  Este es tu espacio para seguir pedidos, guardar productos y comunicarte con productores de Mercado Ahora.
                </p>
                <p className="text-sm text-brown-muted">
                  Estás conectado como{" "}
                  <span className="inline-flex items-center gap-1 rounded-full bg-olive-muted px-2.5 py-1 text-xs font-semibold text-olive-dark">
                    <ShieldCheckIcon className="h-3 w-3" />
                    {roleLabel}
                  </span>{" "}
                  · {user.email}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-olive/30 bg-white/70 px-4 py-2 text-xs font-semibold text-olive-dark transition hover:border-olive hover:bg-white"
                >
                  Explorar productos
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => logout().then(() => router.push("/"))}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-brown-muted transition hover:bg-white/60 hover:text-red-700"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </header>

          <EmailVerificationBanner email={user.email} verified={Boolean(user.email_verified_at)} />

          <section className="rounded-3xl border border-[#dfd2c1] bg-white/80 p-5 shadow-sm sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {identityNotes.map((note) => (
                <div key={note} className="flex items-center gap-3 rounded-2xl bg-[#f6efe4] px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-olive shadow-sm">
                    <LeafIcon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold leading-snug text-brown">{note}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">
                  Tu actividad
                </p>
                <h2 className="font-serif text-2xl font-bold text-foreground">Accesos principales</h2>
              </div>
              <p className="max-w-xl text-sm text-brown-muted">
                Todo lo necesario para comprar, consultar y volver a tus productos preferidos.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group grid gap-4 rounded-2xl border border-[#dfd2c1] bg-gradient-to-br from-white to-[#fbf6ee] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-olive/50 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d8c3aa] bg-[#f6efe4] text-brown-icon transition group-hover:border-olive group-hover:bg-olive group-hover:text-white">
                      <link.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground">{link.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-brown-muted">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-brown-icon transition group-hover:text-olive-dark" />
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-olive-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-olive-dark">
                    <LeafIcon className="h-3 w-3" />
                    {link.badge}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#d8c3aa] bg-[#f3eadc] p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-olive shadow-sm">
                  <BagIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    ¿Querés vender en Mercado Ahora?
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-brown-muted">
                    Si además producís alimentos, artesanías o productos naturales, podés convertirte
                    en productor con esta misma cuenta. Un administrador revisará tu solicitud y vas
                    a poder comprar y vender desde el mismo lugar.
                  </p>
                </div>
              </div>
              <Link
                href="/seller/apply"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-olive-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive"
              >
                Convertirme en productor
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
