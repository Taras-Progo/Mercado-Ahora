import { ApiPanel, SellerProductForm } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function SellerProductsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Productos del vendedor</h1>
          <p className="mt-1 text-sm text-stone-600">Alta y listado base. Los productos activos requieren productor aprobado.</p>
        </div>
        <SellerProductForm />
        <ApiPanel title="Mis productos" endpoint="/seller/products" emptyText="No hay productos creados." />
      </main>
    </>
  );
}
