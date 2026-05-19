"use client";

import Link from "next/link";
import { ProtectedArea, roleHome, useAuth } from "@/components/AuthProvider";

export function RoleDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedArea roles={["buyer", "seller", "admin"]}>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-800">Sesion activa</p>
        <h2 className="mt-2 text-xl font-bold text-stone-950">{user?.name}</h2>
        <p className="mt-1 text-sm text-stone-600">Rol actual: {user?.role}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={roleHome(user?.role ?? "buyer")} className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">
            Ir al panel principal
          </Link>
          {user?.role === "buyer" && <Link href="/orders" className="rounded-md border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900">Mis pedidos</Link>}
          {user?.role === "seller" && <Link href="/seller/products" className="rounded-md border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900">Productos</Link>}
          {user?.role === "admin" && <Link href="/admin" className="rounded-md border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900">Administracion</Link>}
        </div>
      </section>
    </ProtectedArea>
  );
}
