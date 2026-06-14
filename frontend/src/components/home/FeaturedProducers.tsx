"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProducerProfile } from "@/lib/api";
import { getProducers, imageUrl } from "@/lib/api";
import { LeafIcon, MapPinIcon } from "@/components/ui/Icons";
import { SectionHeader } from "./CategoriesGrid";

export function FeaturedProducers() {
  const [producers, setProducers] = useState<ProducerProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProducers()
      .then((data) => setProducers(data.filter((producer) => producer.status === "active").slice(0, 4)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || producers.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
      <SectionHeader
        title="Productores destacados"
        actionLabel="Ver todos los productores"
        href="/productores"
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {producers.map((producer) => (
          <ProducerCard key={producer.id} producer={producer} />
        ))}
      </div>
    </section>
  );
}

function ProducerCard({ producer }: { producer: ProducerProfile }) {
  const location = [producer.city, producer.province].filter(Boolean).join(", ");
  const initials = producer.business_name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/productores/${producer.id}`}
      className="flex flex-col items-center rounded-2xl border border-border-soft bg-white p-6 text-center transition hover:shadow-lg"
    >
      <div className="relative">
        {producer.logo_path ? (
          <img
            src={imageUrl(producer.logo_path)}
            alt={producer.business_name}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-cream-card"
            loading="lazy"
          />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-olive-muted font-serif text-2xl font-bold text-olive-dark ring-4 ring-cream-card">
            {initials || "MA"}
          </span>
        )}
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-olive text-white ring-2 ring-white">
          <LeafIcon className="h-4 w-4" />
        </span>
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{producer.business_name}</h3>
      {producer.product_types && <p className="text-sm text-brown-muted">{producer.product_types}</p>}
      {location && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-brown-muted">
          <MapPinIcon className="h-3.5 w-3.5 text-brown-icon" />
          {location}
        </p>
      )}
    </Link>
  );
}
