"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/api";
import {
  ecoColor,
  ecoLabel,
  getProduct,
  getRelatedProducts,
  imageUrl,
  money,
  productionTypeLabel,
  deliveryTypeLabel,
  addToCart,
  buyNow,
  createConversation,
} from "@/lib/api";
import { ProductCard } from "@/components/ui/ProductCard";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/components/AuthProvider";
import {
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  LeafIcon,
  MapPinIcon,
  ChatIcon,
  CartIcon,
  LightningIcon,
} from "@/components/ui/Icons";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, ready } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Action states
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyingNow, setBuyingNow] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState<{ orderNumber: string } | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await getProduct(slug);
      if (prod) {
        setProduct(prod);
        const relatedProducts = await getRelatedProducts(slug);
        setRelated(relatedProducts);
      } else {
        setProduct(null);
        setRelated([]);
      }
    } catch {
      setProduct(null);
      setRelated([]);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const isOwnProduct =
    user &&
    product &&
    user.role === "seller" &&
    user.producer_profile?.id ===
      (product.producerProfile?.id ?? product.producer_profile?.id);

  const isLoggedIn = ready && !!user;
  const canBuy = product && product.status === "active" && product.stock > 0;

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!product) return;
    setAddingToCart(true);
    setCartMessage(null);
    try {
      await addToCart(product.id, 1);
      setCartMessage({ type: "success", text: "Agregado al carrito." });
    } catch (err) {
      setCartMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error al agregar al carrito.",
      });
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  // Handle Buy Now
  const handleBuyNow = async () => {
    if (!product) return;
    if (!canBuy) return;
    setBuyingNow(true);
    setBuyError("");
    try {
      const order = await buyNow({
        product_id: product.id,
        quantity: buyQuantity,
        delivery_type: product.delivery_type,
      });
      setBuySuccess({ orderNumber: order.order_number });
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : "Error al crear el pedido.");
    } finally {
      setBuyingNow(false);
    }
  };

  // Handle Chat with Producer
  const handleChat = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!product) return;
    const producerId =
      product.producerProfile?.id ?? product.producer_profile?.id;
    if (!producerId) return;

    setStartingChat(true);
    try {
      const conv = await createConversation({
        producer_profile_id: producerId,
        product_id: product.id,
      });
      router.push(`/chat?id=${conv.id}`);
    } catch {
      router.push("/chat");
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">
          Cargando producto...
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center">
          <h2 className="font-serif text-2xl font-bold text-stone-700">
            Producto no encontrado
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            El producto que buscás no existe o fue removido.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
          >
            Volver al inicio
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const producerName =
    product.producerProfile?.business_name ??
    product.producer_profile?.business_name ??
    "Productor";
  const producerId =
    product.producerProfile?.id ?? product.producer_profile?.id ?? 0;
  const allImages = product.images ?? [];
  const primaryImage =
    allImages.find((img) => img.is_primary) ?? allImages[0];
  const displayPath = selectedPath ?? primaryImage?.path;

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-brown-muted mb-8">
            <Link href="/categorias" className="hover:text-olive transition">
              Categorías
            </Link>
            {product.category && (
              <>
                <ChevronRightIcon className="h-3.5 w-3.5" />
                <Link
                  href={`/categorias/${product.category.slug}`}
                  className="hover:text-olive transition"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRightIcon className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground truncate">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
            {/* Image gallery */}
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border-soft bg-stone-100">
                {displayPath ? (
                  <img
                    src={imageUrl(displayPath)}
                    alt={primaryImage?.alt_text ?? product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="h-20 w-20"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedPath(img.path)}
                      className={
                        "h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition " +
                        (img.path === displayPath
                          ? "border-olive"
                          : "border-border-soft hover:border-brown-icon/40")
                      }
                    >
                      <img
                        src={imageUrl(img.path)}
                        alt={img.alt_text ?? ""}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info + actions */}
            <div>
              {product.production_type && (
                <p className="text-xs font-semibold uppercase tracking-wider text-olive mb-2">
                  {productionTypeLabel(product.production_type)}
                </p>
              )}
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {product.name}
              </h1>
              <p className="mt-4 text-3xl font-bold text-olive">
                {money(product.price_cents)}
              </p>
              <p className="text-sm text-brown-muted">
                {product.unit ? `por ${product.unit}` : "\u00A0"}
              </p>
              {product.ecoscore_points != null && (
                <span
                  className={
                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold " +
                    ecoColor(product.ecoscore_points)
                  }
                >
                  <LeafIcon className="h-3.5 w-3.5" />
                  {ecoLabel(product.ecoscore_points)} ·{" "}
                  {product.ecoscore_points}/100
                </span>
              )}

              {/* Location, delivery, stock */}
              <div className="mt-4 grid gap-2 text-sm text-brown-muted">
                {(product.city || product.province) && (
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4 text-brown-icon" />
                    {[product.city, product.province]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
                {product.delivery_type && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircleIcon className="h-4 w-4 text-brown-icon" />
                    {deliveryTypeLabel(product.delivery_type)}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {product.stock > 0 ? (
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ClockIcon className="h-4 w-4 text-amber-600" />
                  )}
                  <span
                    className={
                      product.stock > 0
                        ? "text-emerald-700 font-medium"
                        : "text-amber-700 font-medium"
                    }
                  >
                    {product.stock > 0
                      ? `Stock disponible: ${product.stock}`
                      : "Sin stock"}
                  </span>
                </div>
              </div>

              {/* Producer info */}
              <div className="mt-6 rounded-2xl border border-border-soft bg-cream-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Productor
                </p>
                <Link
                  href={producerId ? `/productores/${producerId}` : "#"}
                  className="mt-2 block"
                >
                  <p className="text-sm font-semibold text-foreground hover:text-olive transition">
                    {producerName}
                  </p>
                </Link>
                {product.province && (
                  <p className="mt-1 text-xs text-brown-muted flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {[product.city, product.province]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="mt-6 space-y-3">
                {/* Primary: Chat with producer */}
                {!isOwnProduct && (
                  <button
                    type="button"
                    onClick={handleChat}
                    disabled={startingChat}
                    className="w-full flex items-center justify-center gap-2.5 rounded-full bg-olive px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-60 shadow-sm"
                  >
                    <ChatIcon className="h-4 w-4" />
                    {startingChat ? "Iniciando chat..." : "Consultar al productor"}
                  </button>
                )}

                {/* Secondary: Buy Now */}
                {!isOwnProduct && canBuy && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoggedIn) {
                        router.push(
                          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
                        );
                        return;
                      }
                      setBuyError("");
                      setBuySuccess(null);
                      setBuyQuantity(1);
                      setShowBuyModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2.5 rounded-full border-2 border-olive bg-white px-6 py-3 text-sm font-semibold text-olive transition hover:bg-olive/5"
                  >
                    <LightningIcon className="h-4 w-4" />
                    Comprar ahora
                  </button>
                )}

                {/* Stock warning for non-buyable */}
                {!isOwnProduct && !canBuy && product.status !== "active" && (
                  <p className="text-center text-sm text-amber-700 bg-amber-50 rounded-full py-2 px-4">
                    Este producto no está disponible para compra.
                  </p>
                )}
                {!isOwnProduct && !canBuy && product.stock === 0 && (
                  <p className="text-center text-sm text-amber-700 bg-amber-50 rounded-full py-2 px-4">
                    Producto sin stock disponible.
                  </p>
                )}

                {/* Tertiary: Add to cart */}
                {!isOwnProduct && canBuy && (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full flex items-center justify-center gap-2.5 rounded-full border border-border-soft bg-white px-6 py-3 text-sm font-semibold text-brown-muted transition hover:border-brown-icon/50 hover:text-foreground disabled:opacity-60"
                  >
                    <CartIcon className="h-4 w-4" />
                    {addingToCart ? "Agregando..." : "Agregar al carrito"}
                  </button>
                )}

                {!isOwnProduct && (
                  <FavoriteButton
                    productId={product.id}
                    redirectPath={`/products/${product.slug}`}
                    variant="pill"
                    showError
                  />
                )}

                {/* Cart feedback message */}
                {cartMessage && (
                  <div
                    className={`rounded-full px-4 py-2 text-center text-sm font-medium ${
                      cartMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {cartMessage.text}
                  </div>
                )}

                {/* Login prompt for unauthenticated users */}
                {!isLoggedIn && !isOwnProduct && (
                  <p className="text-center text-xs text-stone-400">
                    <Link href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="text-olive hover:underline">
                      Iniciá sesión
                    </Link>{" "}
                    para comprar o contactar al productor.
                  </p>
                )}

                {/* Own product indicator */}
                {isOwnProduct && (
                  <div className="rounded-2xl border border-border-soft bg-cream-card p-4 text-center">
                    <p className="text-sm text-stone-500">
                      Este es tu producto.{" "}
                      <Link href="/seller/products" className="text-olive hover:underline">
                        Gestionar productos
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-stone-800">
                    Descripción
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Productos relacionados
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Buy Now Modal */}
      {showBuyModal && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-foreground">
              Comprar ahora
            </h3>
            <p className="mt-1 text-sm text-brown-muted">{product.name}</p>
            <p className="mt-2 text-2xl font-bold text-olive">
              {money(product.price_cents)}
            </p>

            {/* Quantity */}
            <div className="mt-4">
              <label className="text-sm font-medium text-stone-700">
                Cantidad
              </label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setBuyQuantity((q) => Math.max(1, q - 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-brown-muted hover:bg-stone-100 transition"
                >
                  −
                </button>
                <span className="w-10 text-center text-lg font-semibold text-foreground">
                  {buyQuantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBuyQuantity((q) =>
                      product.stock != null
                        ? Math.min(product.stock, q + 1)
                        : q + 1
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-brown-muted hover:bg-stone-100 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price summary */}
            <div className="mt-4 rounded-lg bg-cream-card p-4">
              <div className="flex justify-between text-sm">
                <span className="text-brown-muted">Subtotal</span>
                <span className="font-semibold text-foreground">
                  {money(product.price_cents * buyQuantity)}
                </span>
              </div>
            </div>

            {/* Error */}
            {buyError && (
              <div className="mt-4 rounded-full bg-red-50 px-4 py-2 text-sm text-center text-red-700">
                {buyError}
              </div>
            )}

            {/* Success */}
            {buySuccess && (
              <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-600 mb-1" />
                <p className="text-sm font-semibold text-emerald-700">
                  ¡Pedido creado con éxito!
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  N° {buySuccess.orderNumber}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  El pedido queda pendiente. Coordina pago y entrega con el productor hasta integrar pagos online.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/orders"
                    className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 text-center"
                    onClick={() => setShowBuyModal(false)}
                  >
                    Ver mis pedidos
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBuyModal(false);
                      setBuySuccess(null);
                    }}
                    className="flex-1 rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {!buySuccess && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
                  className="flex-1 rounded-full border border-border-soft px-4 py-2.5 text-sm font-semibold text-brown-muted transition hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={buyingNow}
                  className="flex-1 rounded-full bg-olive px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-60"
                >
                  {buyingNow ? "Procesando..." : "Confirmar compra"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <SiteFooter />
    </>
  );
}
