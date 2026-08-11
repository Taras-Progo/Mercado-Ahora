"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { ProducerReview } from "@/components/admin/ProducerReview";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminReturns } from "@/components/admin/AdminReturns";
import { AdminPayments } from "@/components/admin/AdminPayments";

type Tab = "users" | "producers" | "products" | "orders" | "payments" | "returns";

const tabs: { id: Tab; label: string }[] = [
  { id: "users", label: "Usuarios" },
  { id: "producers", label: "Productores" },
  { id: "products", label: "Productos" },
  { id: "orders", label: "Pedidos" },
  { id: "payments", label: "Pagos" },
  { id: "returns", label: "Devoluciones" },
];

export function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as Tab | null;
  const tab: Tab =
    requestedTab && tabs.some((item) => item.id === requestedTab)
      ? requestedTab
      : searchParams.get("producer_id")
        ? "products"
        : "users";

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Panel administrador</h1>
        <p className="text-sm text-stone-600">
          Gestioná productores, productos, pedidos y devoluciones de Mercado Ahora.
        </p>
      </header>

      <EmailVerificationBanner email={user?.email} verified={Boolean(user?.email_verified_at)} />

      <nav className="flex flex-wrap gap-2 border-b border-border-soft">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => router.replace(`/admin?tab=${t.id}`, { scroll: false })}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "border-olive text-olive-dark"
                : "border-transparent text-stone-500 hover:text-olive-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "users" && <AdminUsers />}
      {tab === "producers" && <ProducerReview />}
      {tab === "products" && <AdminProducts />}
      {tab === "orders" && <AdminOrders />}
      {tab === "payments" && <AdminPayments />}
      {tab === "returns" && <AdminReturns />}
    </div>
  );
}
