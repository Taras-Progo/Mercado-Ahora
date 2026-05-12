import { ApiPanel, CartGroups } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Carrito</h1>
          <p className="mt-1 text-sm text-stone-600">El carrito se sincroniza con el backend Laravel usando el token de sesión.</p>
        </div>
        <CartGroups />
        <ApiPanel title="Contenido técnico del carrito" endpoint="/cart" emptyText="Todavía no hay productos en el carrito." />
      </main>
    </>
  );
}
