import Image from "next/image";
import Link from "next/link";

const navItems = [
  ["Catálogo", "/"],
  ["Carrito", "/cart"],
  ["Pedidos", "/orders"],
  ["Chat", "/chat"],
  ["Vendedor", "/seller"],
  ["Admin", "/admin"],
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/mercado-logo.png" alt="Mercado Ahora" width={44} height={44} className="h-11 w-11 rounded" priority />
          <div>
            <p className="text-sm font-bold text-emerald-900">Mercado Ahora</p>
            <p className="text-xs text-stone-500">Marketplace natural y regional</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
            Ingresar
          </Link>
          <Link href="/register" className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}
