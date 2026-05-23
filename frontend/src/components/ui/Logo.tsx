import { LeafIcon } from "./Icons";

type LogoProps = {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { icon: "h-6 w-6", title: "text-base", subtitle: "text-[10px]" },
  md: { icon: "h-7 w-7", title: "text-lg", subtitle: "text-[11px]" },
  lg: { icon: "h-9 w-9", title: "text-xl", subtitle: "text-xs" },
};

export function Logo({ variant = "dark", size = "md" }: LogoProps) {
  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-[#2c2a26]";
  const accent = variant === "light" ? "text-[#c8d5b9]" : "text-olive";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex items-center justify-center rounded-full bg-olive-muted ${s.icon} ${variant === "light" ? "bg-white/15" : ""}`}>
        <LeafIcon className={`h-4 w-4 ${accent}`} />
      </span>
      <div className="leading-tight">
        <p className={`font-serif font-bold tracking-tight ${s.title} ${textColor}`}>
          Mercado <span className={accent}>AHORA</span>
        </p>
        <p className={`${s.subtitle} ${variant === "light" ? "text-white/70" : "text-stone-500"}`}>
          Productos reales, productores reales
        </p>
      </div>
    </div>
  );
}
