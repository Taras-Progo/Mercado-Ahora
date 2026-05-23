import { HandshakeIcon, HeartIcon, LeafIcon, ShieldCheckIcon } from "@/components/ui/Icons";

const items = [
  {
    icon: LeafIcon,
    title: "Sustentable",
    text: "Promovemos un consumo consciente y responsable.",
  },
  {
    icon: HandshakeIcon,
    title: "Comunidad",
    text: "Conectamos personas y construimos confianza.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Transparencia",
    text: "Historias reales, productos reales.",
  },
  {
    icon: HeartIcon,
    title: "Apoyo local",
    text: "Cada compra impulsa a nuestra comunidad.",
  },
];

export function ValueBanner() {
  return (
    <section className="bg-olive-dark text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="max-w-xs text-sm leading-relaxed text-white/80">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
