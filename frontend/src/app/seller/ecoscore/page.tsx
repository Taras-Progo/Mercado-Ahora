"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SellerBackLink } from "@/components/seller/SellerBackLink";
import { getSellerProducts, type Product } from "@/lib/api";
import { CheckCircleIcon, LeafIcon } from "@/components/ui/Icons";

export default function SellerEcoScorePage() {
  return (
    <>
      <SiteHeader variant="minimal" />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <RoleGuard roles={["seller"]}>
            <SellerBackLink className="mb-6" />
            <EcoScoreView />
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EcoScoreView() {
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    setProducts(await getSellerProducts());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const score = useMemo(() => {
    const scored = products.filter((product) => product.ecoscore_points != null);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((sum, product) => sum + (product.ecoscore_points ?? 0), 0) / scored.length);
  }, [products]);

  const level = score >= 80 ? "Alto" : score >= 50 ? "Medio" : score > 0 ? "Inicial" : "Sin EcoScore";

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-border-soft bg-white">
        <div className="bg-gradient-to-r from-olive-dark to-olive px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">EcoScore</p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Cómo funciona tu EcoScore</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
            El EcoScore ayuda a comunicar prácticas responsables de producción, empaques y entrega. Empieza en 0 y se valida por administración.
          </p>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:p-8">
          <div className="grid place-items-center rounded-3xl bg-cream-card p-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e8efe4" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#4a5d3f"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 - (score / 100) * 2 * Math.PI * 40}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-4xl font-bold text-stone-900">{score}</span>
                <span className="text-xs uppercase tracking-wider text-stone-500">/ 100</span>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-olive-dark">{level}</p>
          </div>
          <div className="grid content-center gap-4">
            <InfoItem title="Qué es" text="Una señal de confianza para compradores que buscan productos naturales, locales y responsables." />
            <InfoItem title="Cómo aumenta" text="Completando información real del producto, prácticas de producción, origen, empaque y entrega responsable." />
            <InfoItem title="Beneficio para el productor" text="Ayuda a destacar publicaciones y construir confianza antes de integrar insignias y métricas avanzadas." />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Cargá descripciones claras y fotos reales.",
          "Explicá origen, método de producción y prácticas responsables.",
          "Mantené stock, precio y disponibilidad actualizados.",
        ].map((text) => (
          <div key={text} className="rounded-2xl border border-border-soft bg-white p-5">
            <CheckCircleIcon className="h-6 w-6 text-olive" />
            <p className="mt-3 text-sm leading-6 text-stone-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border-soft bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-muted text-olive-dark">
            <LeafIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">Niveles e insignias futuras</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Más adelante se podrán mostrar niveles como Inicial, Medio y Alto, junto con insignias verificadas. Por ahora, el puntaje se mantiene como referencia interna y puede ser validado por administración.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoItem({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{text}</p>
    </div>
  );
}
