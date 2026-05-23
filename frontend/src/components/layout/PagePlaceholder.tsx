import Link from "next/link";
import { ReactNode } from "react";
import { ChevronRightIcon, LeafIcon } from "@/components/ui/Icons";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  children?: ReactNode;
};

export function PagePlaceholder({ eyebrow, title, description, cta, children }: PagePlaceholderProps) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 rounded-3xl border border-border-soft bg-white p-8 text-center sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive-muted text-olive-dark">
        <LeafIcon className="h-6 w-6" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">{eyebrow}</p>
      <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">{title}</h1>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-600">{description}</p>
      {children}
      {cta && (
        <Link
          href={cta.href}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-olive-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive"
        >
          {cta.label}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
