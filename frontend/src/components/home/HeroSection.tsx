import { HandshakeIcon, LeafIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/Icons";

const valueProps = [
  {
    icon: LeafIcon,
    title: "Productos naturales:",
    text: "sin químicos ni procesos.",
  },
  {
    icon: HandshakeIcon,
    title: "Productores locales:",
    text: "con historias reales.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Compra segura:",
    text: "y comunidad confiable.",
  },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(120deg, #2c3a23 0%, #3d4f34 35%, rgba(61,79,52,0.55) 70%, rgba(61,79,52,0.15) 100%), url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-36 text-white sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-44">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            <LeafIcon className="h-3.5 w-3.5" /> Mercado Ahora
          </p>
          <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Conectamos personas con{" "}
            <span className="text-[#d6e4c4]">productos reales</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Apoyá a productores locales, elegí natural, elegí consciente.
          </p>

          <form
            action="/buscar"
            className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-2 text-stone-800 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:gap-0 sm:p-1.5"
          >
            <label className="flex flex-1 items-center gap-3 px-4">
              <SearchIcon className="h-5 w-5 text-olive" />
              <input
                name="q"
                placeholder="¿Qué estás buscando?"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-stone-400"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-olive-dark px-7 py-3 text-sm font-semibold text-white transition hover:bg-olive"
            >
              <SearchIcon className="h-4 w-4 sm:hidden" />
              Buscar
            </button>
          </form>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {valueProps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="leading-relaxed">
                  <span className="font-semibold text-white">{title}</span> {text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block" aria-hidden />
      </div>
    </section>
  );
}
