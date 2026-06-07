"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { Cart, Order } from "@/lib/api";
import { getCart, checkoutCart, money, orderStatusLabel, orderStatusColor } from "@/lib/api";
import { CheckCircleIcon, MapPinIcon, BagIcon } from "@/components/ui/Icons";

export default function CheckoutPage() {
  return (
    <RoleGuard roles={["buyer", "seller"]}>
      <CheckoutContent />
    </RoleGuard>
  );
}

function CheckoutContent() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ orders: Order[]; orders_count: number; message: string } | null>(null);

  // Delivery form
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch {
      setError("Error al cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, [fetchCart]);

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await checkoutCart({
        delivery_type: deliveryType || undefined,
        delivery_address: deliveryAddress || undefined,
        city: city || undefined,
        province: province || undefined,
        buyer_note: buyerNote || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.unit_price_cents_snapshot ?? 0) * (item.quantity ?? 0),
    0
  );

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">
          Cargando checkout...
        </main>
        <SiteFooter />
      </>
    );
  }

  if (result) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-10">
            <div className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-600 mb-4" />
              <h2 className="font-serif text-2xl font-bold text-foreground">
                ¡Pedido confirmado!
              </h2>
              <p className="mt-2 text-sm text-brown-muted">
                {result.message}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                El pedido queda pendiente. El comprador y el productor coordinan pago y entrega manualmente por mensaje o datos de entrega.
              </p>
              {result.orders_count > 1 && (
                <p className="mt-1 text-xs text-stone-500">
                  Se generaron {result.orders_count} pedidos separados por productor.
                </p>
              )}

              {/* Order summary */}
              <div className="mt-6 space-y-3 text-left">
                {result.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border-soft bg-cream-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Pedido {order.order_number}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-2 divide-y divide-border-soft text-sm">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between py-1.5">
                          <span className="text-brown-muted">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="font-medium text-foreground">
                            {money(item.line_total_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span className="text-olive">{money(order.total_cents)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <Link
                  href="/orders"
                  className="flex-1 rounded-full bg-olive px-4 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark text-center"
                >
                  Ver mis pedidos
                </Link>
                <Link
                  href="/categorias"
                  className="flex-1 rounded-full border border-border-soft px-4 py-3 text-sm font-semibold text-brown-muted transition hover:bg-stone-100 text-center"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
            Checkout
          </h1>

          {error && (
            <div className="mb-4 rounded-full bg-red-50 px-4 py-2 text-sm text-center text-red-700">
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="mt-12 text-center">
              <BagIcon className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">
                Tu carrito está vacío. Agregá productos antes de hacer checkout.
              </p>
              <Link
                href="/categorias"
                className="mt-4 inline-block rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            <>
              {/* Cart summary (read-only) */}
              <div className="mt-6 rounded-2xl border border-border-soft bg-white">
                <div className="p-5 border-b border-border-soft">
                  <h2 className="text-sm font-semibold text-foreground">
                    Resumen del carrito ({items.length}{" "}
                    {items.length === 1 ? "producto" : "productos"})
                  </h2>
                </div>
                <ul className="divide-y divide-border-soft px-5 py-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between py-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {item.product_name_snapshot}
                        </p>
                        <p className="text-xs text-brown-muted">
                          {item.quantity} × {money(item.unit_price_cents_snapshot ?? 0)}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground ml-4">
                        {money((item.unit_price_cents_snapshot ?? 0) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border-soft px-5 py-4 flex justify-between text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-olive">{money(subtotal)}</span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="mt-6 rounded-2xl border border-border-soft bg-white p-5">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-brown-icon" />
                  Información de entrega
                </h2>
                <p className="mt-1 text-xs text-brown-muted">
                  Completá los datos de entrega para tu pedido.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* Delivery type */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Tipo de entrega
                    </label>
                    <select
                      value={deliveryType}
                      onChange={(e) => setDeliveryType(e.target.value)}
                      className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-olive/30"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="local">Retiro local</option>
                      <option value="home_delivery">Envío a domicilio</option>
                      <option value="pickup_point">Punto de entrega</option>
                      <option value="producer_pickup">Retiro en el local</option>
                    </select>
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Ej: Córdoba"
                      className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Alta Gracia"
                      className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                    />
                  </div>

                  {/* Delivery address */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Dirección de entrega
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Calle, número, piso, depto."
                      className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                    />
                  </div>

                  {/* Buyer note */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Nota para el productor (opcional)
                    </label>
                    <textarea
                      value={buyerNote}
                      onChange={(e) => setBuyerNote(e.target.value)}
                      placeholder="Ej: Prefiero entrega por la tarde."
                      rows={2}
                      className="w-full rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting || items.length === 0}
                  className="w-full rounded-full bg-olive px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-60 shadow-sm"
                >
                  {submitting ? "Procesando pedido..." : "Confirmar pedido"}
                </button>
                <p className="mt-2 text-center text-xs text-stone-400">
                  Al confirmar, se generarán pedidos separados por productor.
                </p>
                <p className="mt-1 text-center text-xs text-stone-500">
                  Pago y envio se coordinan manualmente con el productor hasta integrar pagos online y logistica.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
