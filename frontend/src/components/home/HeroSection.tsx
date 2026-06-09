import { HandshakeIcon, LeafIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/Icons";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000&q=85";

const HERO_BACKGROUND = `
  linear-gradient(
    to right,
    #f2ebe1 0%,
    #f2ebe1 22%,
    rgba(242, 235, 225, 0.98) 38%,
    rgba(242, 235, 225, 0.78) 48%,
    rgba(242, 235, 225, 0.3) 60%,
    rgba(242, 235, 225, 0) 75%
  ),
  url('${HERO_IMAGE}')
`;

const valueProps = [
  {
    icon: LeafIcon,
    title: "Productos naturales",
    text: "sin químicos ni procesos",
  },
  {
    icon: HandshakeIcon,
    title: "Productores locales",
    text: "con historias reales",
  },
  {
    icon: ShieldCheckIcon,
    title: "Compra segura",
    text: "y comunidad confiable",
  },
];

export function HeroSection() {
  return (
    <section
      className="relative min-h-[420px] overflow-hidden bg-cream bg-cover bg-[center_right] bg-no-repeat sm:min-h-[480px] lg:min-h-[540px]"
      style={{ backgroundImage: HERO_BACKGROUND }}
    >
      <div className="absolute inset-0 bg-cream/65 backdrop-blur-[1px] sm:hidden" aria-hidden />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="max-w-xl lg:max-w-[48%]">
          <h1 className="font-serif text-4xl leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Conectamos personas
            <br />
            con <span className="text-accent-green">productos reales</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-brown-muted sm:text-lg">
            Apoyá a productores locales, elegí natural, elegí consciente.
          </p>

          <form
            action="/buscar"
            className="mt-8 flex max-w-xl items-center gap-1 rounded-full border border-border-soft bg-white p-1.5 card-shadow"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 pl-4">
              <SearchIcon className="h-5 w-5 shrink-0 text-brown-icon" />
              <input
                name="q"
                placeholder="¿Qué estás buscando?"
                className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-brown-muted/55"
              />
            </label>
            <button
              type="submit"
              className="btn-primary shrink-0 rounded-full px-7 py-3 text-sm font-semibold sm:px-8"
            >
              Buscar
            </button>
          </form>

          <ul className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-3 sm:gap-4">
            {valueProps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-2.5 text-sm text-brown-muted">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brown" aria-hidden />
                <p className="leading-snug">
                  <span className="block font-semibold text-brown">{title}</span>
                  <span>{text}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
