import { HandshakeIcon, LeafIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/Icons";

const HERO_IMAGE = "/images/home-market-hero.jpg";

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
      className="relative min-h-[500px] overflow-hidden bg-olive-dark bg-cover bg-[58%_center] bg-no-repeat sm:min-h-[520px] sm:bg-[55%_center] lg:min-h-[540px] lg:bg-center"
      style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,27,17,0.92)_0%,rgba(20,27,17,0.8)_38%,rgba(20,27,17,0.38)_68%,rgba(20,27,17,0.12)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,20,12,0.12)_0%,rgba(14,20,12,0.3)_58%,rgba(14,20,12,0.72)_100%)] sm:hidden"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="max-w-xl lg:max-w-[48%]">
          <h1 className="font-serif text-4xl leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Conectamos personas
            <br />
            con <span className="text-[#b8d6a2]">productos reales</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
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
              <li key={title} className="flex items-start gap-2.5 text-sm text-white/80">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#b8d6a2]" aria-hidden />
                <p className="leading-snug">
                  <span className="block font-semibold text-white">{title}</span>
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
