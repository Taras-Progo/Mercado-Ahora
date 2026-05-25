import Image from "next/image";

type LogoProps = {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { className: "h-10 w-auto", width: 53, height: 40 },
  md: { className: "h-14 w-auto", width: 75, height: 56 },
  lg: { className: "h-20 w-auto", width: 107, height: 80 },
};

export function Logo({ variant = "dark", size = "md", className = "" }: LogoProps) {
  const s = sizes[size];
  // The PNG already has a fully styled mark (green badge, white text, leaves).
  // `variant` is kept for API compatibility — on dark surfaces we add a soft
  // glow shadow so the logo stays readable.
  const dropShadow =
    variant === "light"
      ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
      : "";

  return (
    <Image
      src="/brand/mercado-ahora-logo.png"
      alt="Mercado Ahora"
      width={s.width}
      height={s.height}
      priority
      className={`${s.className} ${dropShadow} ${className}`.trim()}
    />
  );
}
