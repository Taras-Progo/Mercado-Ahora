"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { BagIcon, ChevronDownIcon, HeartIcon, MessageIcon, SearchIcon } from "@/components/ui/Icons";
import { useAuth } from "@/components/AuthProvider";

type NavItem = { label: string; href: string };

const publicNav: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Categorías", href: "/categorias" },
  { label: "Productores", href: "/productores" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
];

type SiteHeaderProps = {
  variant?: "default" | "minimal" | "transparent";
};

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const transparent = variant === "transparent";
  const showNav = variant !== "minimal";

  const baseClasses = transparent
    ? "absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-transparent text-white"
    : "sticky top-0 z-30 border-b border-border-soft bg-background text-foreground";

  const linkColor = transparent
    ? "text-white/90 hover:text-white"
    : "text-brown hover:text-olive-dark";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <header className={baseClasses}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Logo variant={transparent ? "light" : "dark"} size="md" />
        </Link>

        {showNav && (
          <nav className="hidden items-center gap-1 lg:flex">
            {publicNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition ${linkColor}`}
                >
                  <span className={active ? "font-semibold" : ""}>{item.label}</span>
                  {active && (
                    <span
                      className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full ${
                        transparent ? "bg-white" : "bg-brown"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton transparent={transparent} ariaLabel="Buscar" href="/buscar">
            <SearchIcon className="h-5 w-5" />
          </IconButton>
          {/* Secondary icons collapse into the mobile menu on small screens. */}
          <span className="hidden items-center gap-1 sm:flex sm:gap-2">
            <IconButton transparent={transparent} ariaLabel="Mensajes" href="/chat" badge={2}>
              <MessageIcon className="h-5 w-5" />
            </IconButton>
            <IconButton transparent={transparent} ariaLabel="Favoritos" href="/favoritos">
              <HeartIcon className="h-5 w-5" />
            </IconButton>
          </span>
          <IconButton transparent={transparent} ariaLabel="Carrito" href="/cart" badge={user ? 3 : undefined}>
            <BagIcon className="h-5 w-5" />
          </IconButton>

          <div className="ml-1 hidden h-8 w-px bg-current opacity-20 lg:block" />

          {/* Desktop auth / account */}
          {ready && user ? (
            <div className="hidden lg:block">
              <UserMenu name={user.name} role={user.role} transparent={transparent} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/login"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  transparent ? "text-white hover:bg-white/10" : "text-brown hover:bg-olive-muted"
                }`}
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  transparent ? "bg-white text-olive-dark hover:bg-white/90" : "btn-primary"
                }`}
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition lg:hidden ${
              transparent ? "text-white hover:bg-white/10" : "text-brown-icon hover:bg-olive-muted hover:text-brown"
            }`}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border-soft bg-background text-foreground shadow-lg lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            {showNav && (
              <nav className="grid gap-1">
                {publicNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive(item.href)
                        ? "bg-olive-muted font-semibold text-olive-dark"
                        : "text-brown hover:bg-cream-card"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            <div className={`grid gap-2 ${showNav ? "mt-3 border-t border-border-soft pt-3" : ""}`}>
              {ready && user ? (
                <>
                  <div className="px-3 py-1">
                    <p className="text-sm font-semibold text-stone-800">{user.name}</p>
                    <p className="text-xs capitalize text-stone-500">
                      {user.role === "buyer" ? "Comprador" : user.role}
                    </p>
                  </div>
                  {user.role === "buyer" && (
                    <MobileLink href="/cuenta" onClick={() => setMenuOpen(false)}>
                      Mi cuenta
                    </MobileLink>
                  )}
                  {user.role === "seller" && (
                    <MobileLink href="/seller" onClick={() => setMenuOpen(false)}>
                      Panel del productor
                    </MobileLink>
                  )}
                  {user.role === "admin" && (
                    <MobileLink href="/admin" onClick={() => setMenuOpen(false)}>
                      Panel administrador
                    </MobileLink>
                  )}
                  <MobileLink href="/orders" onClick={() => setMenuOpen(false)}>
                    Mis pedidos
                  </MobileLink>
                  <MobileLink href="/chat" onClick={() => setMenuOpen(false)}>
                    Mensajes
                  </MobileLink>
                  <MobileLink href="/favoritos" onClick={() => setMenuOpen(false)}>
                    Favoritos
                  </MobileLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 rounded-xl border border-border-soft px-3 py-2.5 text-left text-sm font-medium text-brown transition hover:bg-cream-card"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-olive px-4 py-3 text-center text-sm font-semibold text-olive-dark transition hover:bg-olive-muted"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary rounded-full px-4 py-3 text-center text-sm font-semibold"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl px-3 py-2.5 text-sm font-medium text-brown transition hover:bg-cream-card"
    >
      {children}
    </Link>
  );
}

function IconButton({
  children,
  ariaLabel,
  href,
  badge,
  transparent,
  className = "",
}: {
  children: React.ReactNode;
  ariaLabel: string;
  href: string;
  badge?: number;
  transparent?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
        transparent ? "text-white hover:bg-white/10" : "text-brown-icon hover:bg-olive-muted hover:text-brown"
      } ${className}`}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function UserMenu({
  name,
  role,
  transparent,
  onLogout,
}: {
  name: string;
  role: string;
  transparent?: boolean;
  onLogout: () => void;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <details className="relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition ${
          transparent ? "hover:bg-white/10" : "hover:bg-olive-muted"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-olive text-xs font-bold text-white">
          {initials || "U"}
        </span>
        <span className={`hidden text-sm font-semibold sm:inline ${transparent ? "text-white" : "text-brown"}`}>
          Mi cuenta
        </span>
        <ChevronDownIcon className={`h-4 w-4 ${transparent ? "text-white" : "text-brown-icon"}`} />
      </summary>
      <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-lg">
        <div className="border-b border-border-soft bg-cream-card px-4 py-3">
          <p className="text-sm font-semibold text-stone-800">{name}</p>
          <p className="text-xs capitalize text-stone-500">{role === "buyer" ? "Comprador" : role}</p>
        </div>
        <nav className="grid py-1 text-sm text-stone-700">
          {role === "buyer" && (
            <Link className="px-4 py-2 hover:bg-olive-muted" href="/cuenta">
              Mi cuenta
            </Link>
          )}
          {role === "seller" && (
            <Link className="px-4 py-2 hover:bg-olive-muted" href="/seller">
              Panel del productor
            </Link>
          )}
          {role === "admin" && (
            <Link className="px-4 py-2 hover:bg-olive-muted" href="/admin">
              Panel administrador
            </Link>
          )}
          <Link className="px-4 py-2 hover:bg-olive-muted" href="/orders">
            Mis pedidos
          </Link>
          <Link className="px-4 py-2 hover:bg-olive-muted" href="/favoritos">
            Favoritos
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="border-t border-border-soft px-4 py-2 text-left text-stone-700 hover:bg-olive-muted"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </details>
  );
}
