"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { Cart } from "@/lib/api";
import { getCart, removeCartItem, updateCartItem, money, imageUrl } from "@/lib/api";
import { TrashIcon, MinusIcon, PlusIcon, BagIcon } from "@/components/ui/Icons";

export default function CartPage() {
  return (
    <RoleGuard roles={["buyer", "seller"]}>
      <CartContent />
    </RoleGuard>
  );
}

function CartContent() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    setError("");
    try {
      const updated = await updateCartItem(itemId, newQty);
      setCart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar cantidad.");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = async (itemId: number) => {
    setError("");
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al remover producto.");
    }
  };

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (item.unit_price_cents_snapshot ?? 0) * (item.quantity ?? 0),
    0
  );

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">
          Cargando carrito...
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
            Tu carrito
          </h1>

          {error && (
            <div className="mb-4 rounded-full bg-red-50 px-4 py-2 text-sm text-center text-red-700">
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="mt-12 text-center">
              <BagIcon className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">Tu carrito está vacío.</p>
              <Link
                href="/categorias"
                className="mt-4 inline-block rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <ul className="mt-6 divide-y divide-border-soft rounded-2xl border border-border-soft bg-white">
                {items.map((item) => {
                  const product = item.product;
                  const price = item.unit_price_cents_snapshot ?? 0;
                  const primaryImage = product?.images?.find((img) => img.is_primary);
                  return (
                    <li key={item.id} className="flex gap-4 p-4 sm:p-5">
                      {/* Image */}
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

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={product ? `/products/${product.slug}` : "#"}
                          className="text-sm font-semibold text-foreground hover:text-olive transition truncate block"
                        >
                          {item.product_name_snapshot}
                        </Link>
                        {product?.producer_profile?.business_name && (
                          <p className="text-xs text-brown-muted truncate mt-0.5">
                            {product.producer_profile.business_name}
                          </p>
                        )}
                        <p className="text-sm font-bold text-olive mt-1">
                          {money(price)}
                        </p>
                        {product?.unit && (
                          <p className="text-xs text-stone-400">por {product.unit}</p>
                        )}

                        {/* Quantity controls */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-brown-muted hover:bg-stone-100 transition disabled:opacity-40"
                          >
                            <MinusIcon className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={updatingItems.has(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-brown-muted hover:bg-stone-100 transition disabled:opacity-40"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Line total */}
                        <p className="mt-1 text-xs text-brown-muted">
                          Subtotal: {money(price * item.quantity)}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="self-center text-stone-400 hover:text-red-500 transition shrink-0"
                        aria-label="Remover producto"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Summary */}
              <div className="mt-6 rounded-2xl border border-border-soft bg-cream-card p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-brown-muted">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {money(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-brown-muted">Envío</span>
                  <span className="text-brown-muted">A coordinar con el productor</span>
                </div>
                <hr className="my-4 border-border-soft" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-olive">{money(subtotal)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="w-full rounded-full bg-olive px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-olive-dark shadow-sm"
                >
                  Ir al checkout
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}