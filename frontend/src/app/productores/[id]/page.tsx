"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ProducerProfile } from "@/lib/api";
import { getProducer, money, ecoLabel, ecoColor, deliveryTypeLabel, productionTypeLabel } from "@/lib/api";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LeafIcon, MapPinIcon, PackageIcon, ChevronRightIcon, MessageIcon, HandshakeIcon, ShieldCheckIcon } from "@/components/ui/Icons";

export default function ProducerDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || isNaN(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotFound(true);
      setLoading(false);
      return;
    }
    getProducer(id)
      .then((data) => {
        if (!data) {
          setNotFound(true);
        } else {
          setProducer(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
            <div className="animate-pulse space-y-6">
              <div className="h-10 w-2/3 rounded bg-stone-200" />
              <div className="h-5 w-1/2 rounded bg-stone-100" />
              <div className="h-32 w-full rounded bg-stone-100" />
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (notFound || !producer) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground">Productor no encontrado</h1>
            <p className="mt-3 text-brown-muted">El productor que buscas no existe o no está disponible.</p>
            <Link href="/productores" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-dark transition-colors">
              ← Volver al directorio
            </Link>
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
        {/* Producer Header */}
        <section className="border-b border-border-soft bg-white">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
            <Link href="/productores" className="inline-flex items-center gap-1.5 text-sm text-brown-muted hover:text-olive transition-colors mb-6">
              <ChevronRightIcon className="h-4 w-4 rotate-180" />
              Directorio de productores
            </Link>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-cream-card text-brown-icon ring-4 ring-cream-card">
                <LeafIcon className="h-10 w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
                  {producer.business_name}
                </h1>
                {producer.city && producer.province && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-base text-brown-muted">
                    <MapPinIcon className="h-4 w-4 text-brown-icon shrink-0" />
                    {producer.city}, {producer.province}
                  </p>
                )}
                {producer.description && (
                  <p className="mt-4 text-base text-brown-muted leading-relaxed max-w-2xl">{producer.description}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Production Details */}
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Story */}
              {producer.story && (
                <div className="rounded-2xl border border-border-soft bg-white p-6">
                  <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
                    <HandshakeIcon className="h-5 w-5 text-olive" />
                    Nuestra historia
                  </h2>
                  <p className="mt-3 text-sm text-brown-muted leading-relaxed">{producer.story}</p>
                </div>
              )}

              {/* Products */}
              {producer.products && producer.products.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground mb-4">
                    <PackageIcon className="h-5 w-5 text-olive" />
                    Productos ({producer.products.length})
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {producer.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group flex flex-col rounded-2xl border border-border-soft bg-white p-5 transition hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-olive-dark transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          {product.ecoscore_points && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ecoColor(product.ecoscore_points)}`}>
                              {ecoLabel(product.ecoscore_points)}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="mt-2 text-xs text-brown-muted line-clamp-2">{product.description}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold text-olive">{money(product.price_cents)}</span>
                          <span className="text-xs text-brown-muted">
                            {product.unit} · Stock: {product.stock}
                          </span>
                        </div>
                        {product.delivery_type && (
                          <p className="mt-2 text-[11px] text-brown-muted/70">
                            {deliveryTypeLabel(product.delivery_type)}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Production Info */}
              <div className="rounded-2xl border border-border-soft bg-cream-card p-5 space-y-4">
                <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <ShieldCheckIcon className="h-4 w-4 text-olive" />
                  Información de producción
                </h3>
                {producer.production_method && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brown-muted/70">Método</p>
                    <p className="text-sm font-medium text-brown">{productionTypeLabel(producer.production_method)}</p>
                  </div>
                )}
                {producer.product_types && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brown-muted/70">Tipos de producto</p>
                    <p className="text-sm font-medium text-brown">{producer.product_types}</p>
                  </div>
                )}
                {producer.production_origin && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brown-muted/70">Origen</p>
                    <p className="text-sm font-medium text-brown">{producer.production_origin}</p>
                  </div>
                )}
                {producer.production_practices && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brown-muted/70">Prácticas</p>
                    <p className="text-sm font-medium text-brown">{producer.production_practices}</p>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="rounded-2xl border border-border-soft bg-white p-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm mb-4">
                  <MessageIcon className="h-4 w-4 text-olive" />
                  Contactar
                </h3>
                <p className="text-xs text-brown-muted leading-relaxed">
                  Para consultar por productos, precios o coordinar una entrega, iniciá una conversación con {producer.business_name}.
                </p>
                <Link
                  href={`/chat?producer=${producer.id}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
                >
                  <MessageIcon className="h-4 w-4" />
                  Iniciar chat
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}