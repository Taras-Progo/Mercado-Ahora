import { ApiPanel } from "@/components/ApiPanel";
import { ProtectedArea } from "@/components/AuthProvider";
import { Header } from "@/components/Header";

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Mis pedidos</h1>
          <p className="mt-1 text-sm text-stone-600">Seguimiento base de pedidos del comprador.</p>
        </div>
        <ProtectedArea roles={["buyer", "seller"]}>
          <ApiPanel title="Pedidos" endpoint="/orders" emptyText="Todavia no hay pedidos registrados." />
        </ProtectedArea>
      </main>
    </>
  );
}
