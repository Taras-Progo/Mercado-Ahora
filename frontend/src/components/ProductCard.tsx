import Link from "next/link";
import { ecoLabel, money, Product } from "@/lib/api";

export function ProductCard({ product }: { product: Product }) {
  const producer = product.producer_profile ?? product.producerProfile;

  return (
    <article className="grid min-h-72 grid-rows-[110px_1fr] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#e8f5df,#f7e8c8_55%,#d9efe8)] p-4">
        <div className="flex h-full items-end justify-between">
          <span className="rounded bg-white/85 px-2 py-1 text-xs font-semibold text-emerald-900">{product.category?.name ?? "Producto natural"}</span>
          <span className="rounded bg-emerald-900 px-2 py-1 text-xs font-semibold text-white">{ecoLabel(product.ecoscore_points)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h2 className="line-clamp-2 text-lg font-bold text-stone-950">{product.name}</h2>
          <p className="mt-1 text-sm text-stone-600">{producer?.business_name ?? "Productor local"}</p>
        </div>
        <p className="line-clamp-2 text-sm text-stone-600">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-emerald-900">{money(product.price_cents)}</p>
            <p className="text-xs text-stone-500">{product.city}, {product.province}</p>
          </div>
          <Link href={`/products/${product.slug}`} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
            Ver
          </Link>
        </div>
      </div>
    </article>
  );
}
