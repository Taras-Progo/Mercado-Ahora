import { Header } from "@/components/Header";
import { ProductActions } from "@/components/ProductActions";
import { ecoLabel, getProduct, money } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const producer = product.producer_profile ?? product.producerProfile;

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="h-64 bg-[linear-gradient(135deg,#d7edd1,#f4dbad_55%,#cae5dc)]" />
          <div className="grid gap-5 p-6">
            <div>
              <p className="text-sm font-semibold text-emerald-800">{product.category?.name}</p>
              <h1 className="mt-2 text-3xl font-bold text-stone-950">{product.name}</h1>
              <p className="mt-3 text-stone-650">{product.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-stone-50 p-3">
                <p className="text-xs text-stone-500">EcoScore</p>
                <p className="font-bold text-emerald-900">{ecoLabel(product.ecoscore_points)}</p>
              </div>
              <div className="rounded-md bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Entrega</p>
                <p className="font-bold text-stone-900">{product.delivery_type ?? "A coordinar"}</p>
              </div>
              <div className="rounded-md bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Stock</p>
                <p className="font-bold text-stone-900">{product.stock} {product.unit}</p>
              </div>
            </div>
          </div>
        </section>
        <aside className="grid h-fit gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-stone-500">Precio</p>
            <p className="text-3xl font-bold text-emerald-900">{money(product.price_cents)}</p>
          </div>
          <div className="rounded-md bg-emerald-50 p-3">
            <p className="text-sm font-bold text-emerald-950">{producer?.business_name ?? "Productor local"}</p>
            <p className="text-sm text-emerald-900">{product.city}, {product.province}</p>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase text-stone-500">Historia del productor</p>
            <p className="mt-1 text-sm text-stone-700">{producer?.story ?? producer?.description ?? "Productor verificado por la plataforma."}</p>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase text-stone-500">Validación EcoScore</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">{product.ecoscore_status ?? "self_declared"}</p>
            <p className="mt-1 text-sm text-stone-600">{product.ecoscore_validation_notes ?? "Criterios declarados por productor, listos para revisión manual."}</p>
          </div>
          <ProductActions productId={product.id} />
        </aside>
      </main>
    </>
  );
}
