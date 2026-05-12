import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/api";

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="rounded-lg bg-emerald-900 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-emerald-100">Catálogo MVP</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Productos naturales, regionales y sostenibles en un solo mercado.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50">
              Explora productores locales, compara EcoScore, consulta stock y arma tu pedido desde el flujo base de Phase 1.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-stone-950">Estado de Milestone 1</h2>
            <div className="mt-4 grid gap-3 text-sm text-stone-700">
              <p>Backend Laravel: API base, roles, catálogo, carrito, pedidos y chat.</p>
              <p>Frontend Next.js: pantallas iniciales conectadas a la API.</p>
              <p>Pagos: estructura preparada, sin integración Mercado Pago completa.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-950">Categorías iniciales</h2>
              <p className="text-sm text-stone-600">Base de catálogo definida para el MVP.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div key={category.slug} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-emerald-900">{category.name}</h3>
                <p className="mt-1 text-sm text-stone-600">{category.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-950">Productos destacados</h2>
              <p className="text-sm text-stone-600">Datos desde Laravel cuando la API está activa; demo local como respaldo.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
