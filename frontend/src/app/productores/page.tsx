"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProducerProfile } from "@/lib/api";
import { getProducers } from "@/lib/api";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LeafIcon, MapPinIcon, PackageIcon } from "@/components/ui/Icons";

export default function ProductoresPage() {
  const [producers, setProducers] = useState<ProducerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducers()
      .then((data) => setProducers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              Directorio de productores
            </h1>
            <p className="mt-3 text-base text-brown-muted">
              Conocé a los productores locales que hacen posible Mercado Ahora. Productos reales, historias auténticas.
            </p>
          </div>

          {loading ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border-soft bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-stone-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 rounded bg-stone-200" />
                      <div className="h-4 w-1/2 rounded bg-stone-100" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full rounded bg-stone-100" />
                    <div className="h-4 w-2/3 rounded bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : producers.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-border-soft bg-white p-12 text-center">
              <LeafIcon className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 text-lg font-semibold text-stone-700">No hay productores disponibles</h2>
              <p className="mt-1 text-sm text-stone-500">Los productores estarán disponibles pronto.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {producers.map((producer) => (
                <ProducerCard key={producer.id} producer={producer} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ProducerCard({ producer }: { producer: ProducerProfile }) {
  return (
    <Link
      href={`/productores/${producer.id}`}
      className="group flex flex-col rounded-2xl border border-border-soft bg-white p-6 transition hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream-card text-brown-icon ring-4 ring-cream-card">
          <LeafIcon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-olive-dark transition-colors line-clamp-1">
            {producer.business_name}
          </h3>
          {producer.city && producer.province && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-brown-muted">
              <MapPinIcon className="h-3.5 w-3.5 text-brown-icon shrink-0" />
              {producer.city}, {producer.province}
            </p>
          )}
        </div>
      </div>

      {producer.description && (
        <p className="mt-4 text-sm text-brown-muted line-clamp-3">{producer.description}</p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-muted/60 px-3 py-1 text-xs font-medium text-olive">
          <PackageIcon className="h-3 w-3" />
          Ver perfil
        </span>
        <span className="text-xs font-semibold text-olive opacity-0 transition group-hover:opacity-100">
          Ver más →
        </span>
      </div>
    </Link>
  );
}