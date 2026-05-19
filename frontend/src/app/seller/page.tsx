import { ApiPanel } from "@/components/ApiPanel";
import { ProtectedArea } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import Link from "next/link";

export default function SellerPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-950">Panel vendedor</h1>
            <p className="mt-1 text-sm text-stone-600">Resumen operativo para productores.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/seller/apply" className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900">Postulacion</Link>
            <Link href="/seller/profile" className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900">Perfil</Link>
            <Link href="/seller/products" className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white">Productos</Link>
          </div>
        </div>
        <ProtectedArea roles={["seller"]}>
          <ApiPanel title="Dashboard" endpoint="/seller/dashboard" emptyText="Ingresa como vendedor para ver el panel." />
        </ProtectedArea>
      </main>
    </>
  );
}
