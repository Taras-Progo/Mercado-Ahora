import { ApiPanel } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Checkout</h1>
          <p className="mt-1 text-sm text-stone-600">La estructura de pago queda preparada; Mercado Pago se integra en una fase futura.</p>
        </div>
        <ApiPanel title="Resumen de checkout" endpoint="/cart" emptyText="Agregá productos antes de confirmar el pedido." />
      </main>
    </>
  );
}
