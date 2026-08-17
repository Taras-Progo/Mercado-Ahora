"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { Cart, CheckoutConflict, Order } from "@/lib/api";
import {
  ApiError,
  checkoutCart,
  checkoutWithMercadoPago,
  getCart,
  imageUrl,
  money,
  orderStatusColor,
  orderStatusLabel,
  removeCartItem,
  updateCartItem,
} from "@/lib/api";
import { BagIcon, CheckCircleIcon, MapPinIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";

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
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<CheckoutConflict[]>([]);
  const [result, setResult] = useState<{ orders: Order[]; orders_count: number; message: string } | null>(null);

  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const paymentInFlight = useRef(false);
  const paymentAttemptKey = useRef<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
      setError("");
      return data;
    } catch {
      setError("No pudimos cargar tu carrito.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCart();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchCart]);

  const clearResolvedConflicts = useCallback((nextCart: Cart | null) => {
    if (!nextCart?.items?.length) {
      setConflicts([]);
      return;
    }

    setConflicts((current) =>
      current.filter((conflict) => {
        const item = nextCart.items?.find(
          (candidate) =>
            (conflict.item_id && candidate.id === conflict.item_id) ||
            candidate.product_id === conflict.product_id,
        );

        if (!item) return false;
        if ((conflict.status ?? "active") !== "active") return true;
        return item.quantity > conflict.available_stock;
      }),
    );
  }, []);

  const refreshCartState = useCallback(
    async (nextCart?: Cart | null) => {
      const freshCart = nextCart ?? (await fetchCart());
      if (freshCart) {
        setCart(freshCart);
      }
      clearResolvedConflicts(freshCart);
      return freshCart;
    },
    [clearResolvedConflicts, fetchCart],
  );

  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (quantity < 1) return;
      setUpdatingItems((current) => new Set(current).add(itemId));
      setError("");

      try {
        await updateCartItem(itemId, quantity);
        await refreshCartState();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos actualizar la cantidad.");
      } finally {
        setUpdatingItems((current) => {
          const next = new Set(current);
          next.delete(itemId);
          return next;
        });
      }
    },
    [refreshCartState],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setUpdatingItems((current) => new Set(current).add(itemId));
      setError("");

      try {
        await removeCartItem(itemId);
        await refreshCartState();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos quitar el producto.");
      } finally {
        setUpdatingItems((current) => {
          const next = new Set(current);
          next.delete(itemId);
          return next;
        });
      }
    },
    [refreshCartState],
  );

  const handleAdjustToAvailable = useCallback(
    async (conflict: CheckoutConflict) => {
      if (!conflict.item_id) return;

      if (conflict.available_stock <= 0 || (conflict.status ?? "active") !== "active") {
        await removeItem(conflict.item_id);
        return;
      }

      await updateQuantity(conflict.item_id, conflict.available_stock);
    },
    [removeItem, updateQuantity],
  );


  const handleMercadoPagoCheckout = async () => {
    if (paymentInFlight.current) return;

    if (!deliveryType) {
      setError("Seleccioná cómo querés recibir los productos.");
      return;
    }

    if (
      ["home_delivery", "pickup_point"].includes(deliveryType) &&
      (!deliveryAddress.trim() || !city.trim() || !province.trim())
    ) {
      setError("Completá la dirección, la ciudad y la provincia antes de pagar.");
      return;
    }

    paymentInFlight.current = true;
    setSubmitting(true);
    setError("");

    try {
      const freshCart = await refreshCartState();
      const freshItems = freshCart?.items ?? [];

      if (freshItems.length === 0) {
        setError("Tu carrito está vacío. Agregá productos antes de iniciar el pago.");
        paymentInFlight.current = false;
        paymentAttemptKey.current = null;
        setSubmitting(false);
        return;
      }

      const response = await checkoutWithMercadoPago({
        idempotency_key: paymentAttemptKey.current ?? (paymentAttemptKey.current = window.crypto.randomUUID()),
        delivery_type: deliveryType || undefined,
        delivery_address: deliveryAddress || undefined,
        city: city || undefined,
        province: province || undefined,
        buyer_note: buyerNote || undefined,
      });

      if (!response.checkout_url) {
        throw new Error("Mercado Pago no devolvió una dirección de pago válida.");
      }

      window.location.assign(response.checkout_url);
    } catch (err) {
      if (err instanceof ApiError) {
        const payload = err.payload as { conflicts?: CheckoutConflict[] } | undefined;
        const nextConflicts = Array.isArray(payload?.conflicts) ? payload.conflicts : [];
        setConflicts(nextConflicts);
      }
      setError(err instanceof Error ? err.message : "No pudimos iniciar el pago con Mercado Pago.");
      paymentInFlight.current = false;
      paymentAttemptKey.current = null;
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    setError("");

    try {
      const freshCart = await refreshCartState();
      const items = freshCart?.items ?? [];

      if (items.length === 0) {
        setError("Tu carrito está vacío. Agregá productos antes de confirmar el pedido.");
        return;
      }

      const response = await checkoutCart({
        delivery_type: deliveryType || undefined,
        delivery_address: deliveryAddress || undefined,
        city: city || undefined,
        province: province || undefined,
        buyer_note: buyerNote || undefined,
      });

      setConflicts([]);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        const payload = err.payload as { conflicts?: CheckoutConflict[] } | undefined;
        const nextConflicts = Array.isArray(payload?.conflicts) ? payload.conflicts : [];
        setConflicts(nextConflicts);
        if (nextConflicts.length > 0) {
          const firstConflict = nextConflicts[0];
          setError(
            (firstConflict.status ?? "active") !== "active"
              ? `El producto "${firstConflict.product_name}" ya no está disponible.`
              : `Stock insuficiente para "${firstConflict.product_name}". Solo quedan ${firstConflict.available_stock} disponibles.`,
          );
          return;
        }
      }
      setError(err instanceof Error ? err.message : "No pudimos confirmar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const items = useMemo(() => cart?.items ?? [], [cart]);
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.unit_price_cents_snapshot ?? 0) * (item.quantity ?? 0),
        0,
      ),
    [items],
  );

  const conflictsByItem = useMemo(() => {
    const map = new Map<number, CheckoutConflict>();
    for (const conflict of conflicts) {
      if (conflict.item_id) {
        map.set(conflict.item_id, conflict);
      }
    }
    return map;
  }, [conflicts]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">
          Preparando tu pedido...
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
            <div className="rounded-2xl border border-border-soft bg-white p-6 text-center sm:p-8">
              <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
              <h2 className="font-serif text-2xl font-bold text-foreground">Pedido confirmado</h2>
              <p className="mt-2 text-sm text-brown-muted">
                Tu compra se registró correctamente y ya generamos los pedidos correspondientes.
              </p>
              <p className="mt-2 text-xs text-stone-500">
                El pedido queda pendiente y la coordinación de pago y entrega sigue siendo manual entre comprador y productor.
              </p>
              {result.orders_count > 1 && (
                <p className="mt-1 text-xs text-stone-500">
                  Se generaron {result.orders_count} pedidos separados por productor.
                </p>
              )}

              <div className="mt-6 space-y-3 text-left">
                {result.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border-soft bg-cream-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Pedido {order.order_number}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-2 divide-y divide-border-soft text-sm">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 py-1.5">
                          <span className="text-brown-muted">
                            {item.product_name} x {item.quantity}
                          </span>
                          <span className="font-medium text-foreground">{money(item.line_total_cents)}</span>
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
                  className="flex-1 rounded-full bg-olive px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-olive-dark"
                >
                  Ver mis pedidos
                </Link>
                <Link
                  href="/categorias"
                  className="flex-1 rounded-full border border-border-soft px-4 py-3 text-center text-sm font-semibold text-brown-muted transition hover:bg-stone-100"
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
          <h1 className="font-serif text-2xl font-bold text-foreground">Confirmar pedido</h1>
          <p className="mt-2 max-w-2xl text-sm text-brown-muted">
            Revisa tus productos seleccionados, ajusta cantidades si hizo falta y confirma una compra responsable.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Hay productos que cambiaron de stock. Podés ajustar la cantidad disponible o quitar esos productos sin salir de esta pantalla.
            </div>
          )}

          {items.length === 0 ? (
            <div className="mt-12 text-center">
              <BagIcon className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">
                Tu carrito está vacío. Agregá productos antes de confirmar el pedido.
              </p>
              <Link
                href="/categorias"
                className="mt-4 inline-block rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),22rem]">
              <section className="rounded-2xl border border-border-soft bg-white">
                <div className="border-b border-border-soft p-5">
                  <h2 className="text-sm font-semibold text-foreground">
                    Productos seleccionados ({items.length} {items.length === 1 ? "producto" : "productos"})
                  </h2>
                  <p className="mt-1 text-xs text-brown-muted">
                    Si el stock cambió, puedes corregirlo aquí mismo y seguir con la compra.
                  </p>
                </div>

                <ul className="divide-y divide-border-soft px-5 py-2">
                  {items.map((item) => {
                    const product = item.product;
                    const price = item.unit_price_cents_snapshot ?? 0;
                    const primaryImage =
                      product?.images?.find((image) => image.is_primary) ?? product?.images?.[0];
                    const conflict = conflictsByItem.get(item.id);
                    const isInactive = (conflict?.status ?? "active") !== "active";

                    return (
                      <li key={item.id} className="py-4">
                        <div className="flex gap-4">
                          <Link
                            href={product ? `/products/${product.slug}` : "#"}
                            className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-soft bg-stone-100"
                          >
                            {primaryImage ? (
                              <img
                                src={imageUrl(primaryImage.path)}
                                alt={item.product_name_snapshot}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300">
                                <BagIcon className="h-6 w-6" />
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {item.product_name_snapshot}
                                </p>
                                {product?.producer_profile?.business_name && (
                                  <p className="mt-0.5 truncate text-xs text-brown-muted">
                                    {product.producer_profile.business_name}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => void removeItem(item.id)}
                                disabled={updatingItems.has(item.id)}
                                className="shrink-0 text-stone-400 transition hover:text-red-500 disabled:opacity-50"
                                aria-label="Quitar producto"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                              <span className="text-sm font-bold text-olive">{money(price)}</span>
                              {product?.unit && <span className="text-xs text-stone-400">por {product.unit}</span>}
                              <span className="text-xs text-brown-muted">
                                Subtotal: {money(price * item.quantity)}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || updatingItems.has(item.id) || isInactive}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-brown-muted transition hover:bg-stone-100 disabled:opacity-40"
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-foreground">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                                  disabled={updatingItems.has(item.id) || isInactive}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-brown-muted transition hover:bg-stone-100 disabled:opacity-40"
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </button>
                              </div>

                              {conflict && (
                                <button
                                  type="button"
                                  onClick={() => void handleAdjustToAvailable(conflict)}
                                  disabled={updatingItems.has(item.id)}
                                  className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-50 disabled:opacity-50"
                                >
                                  {isInactive || conflict.available_stock <= 0
                                    ? "Quitar producto"
                                    : "Ajustar al stock disponible"}
                                </button>
                              )}
                            </div>

                            {conflict && (
                              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {isInactive
                                  ? "Este producto ya no está disponible para la compra."
                                  : `Stock insuficiente. Pediste ${conflict.requested_quantity} y solo quedan ${conflict.available_stock}.`}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-border-soft bg-white p-5">
                  <h2 className="text-sm font-semibold text-foreground">Tu pedido</h2>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-brown-muted">Productos</span>
                      <span className="font-medium text-foreground">{money(subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-brown-muted">Entrega</span>
                      <span className="text-right text-brown-muted">A coordinar con el productor</span>
                    </div>
                  </div>
                  <hr className="my-4 border-border-soft" />
                  <div className="flex justify-between gap-3 text-base">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-olive">{money(subtotal)}</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    Podés pagar online con Mercado Pago o conservar la coordinación manual con el productor.
                  </p>
                </section>

                <section className="rounded-2xl border border-border-soft bg-white p-5">
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <MapPinIcon className="h-4 w-4 text-brown-icon" />
                    Datos de entrega
                  </h2>
                  <p className="mt-1 text-xs text-brown-muted">
                    Completá estos datos para finalizar la compra.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-stone-700">Tipo de entrega</span>
                      <select
                        value={deliveryType}
                        onChange={(event) => setDeliveryType(event.target.value)}
                        className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-olive/30"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="local">Retiro local</option>
                        <option value="home_delivery">Envío a domicilio</option>
                        <option value="pickup_point">Punto de entrega</option>
                        <option value="producer_pickup">Retiro en el local</option>
                      </select>
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-stone-700">Provincia</span>
                      <input
                        type="text"
                        value={province}
                        onChange={(event) => setProvince(event.target.value)}
                        placeholder="Ej: Córdoba"
                        className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-stone-700">Ciudad</span>
                      <input
                        type="text"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Ej: Alta Gracia"
                        className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-stone-700">Dirección de entrega</span>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        placeholder="Calle, número, piso, depto."
                        className="w-full rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-stone-700">Nota para el productor (opcional)</span>
                      <textarea
                        value={buyerNote}
                        onChange={(event) => setBuyerNote(event.target.value)}
                        placeholder="Ej: Prefiero recibirlo por la tarde."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                      />
                    </label>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={handleMercadoPagoCheckout}
                      disabled={submitting || items.length === 0 || conflicts.length > 0}
                      className="w-full rounded-full bg-olive px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Preparando Mercado Pago..." : "Pagar con Mercado Pago"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={submitting || items.length === 0 || conflicts.length > 0}
                      className="w-full rounded-full border border-olive px-6 py-3 text-sm font-semibold text-olive transition hover:bg-olive/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Confirmar pedido con pago manual
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                    {conflicts.length > 0
                      ? "Resolvé los productos marcados para continuar."
                      : "Mercado Pago reserva el stock durante 30 minutos. Si comprás a varios productores, se generan pedidos separados dentro del mismo pago."}
                  </p>

                </section>
              </aside>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
