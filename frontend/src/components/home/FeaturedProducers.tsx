import { LeafIcon, MapPinIcon, StarIcon } from "@/components/ui/Icons";
import { SectionHeader } from "./CategoriesGrid";

type Producer = {
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  photo: string;
};

const producers: Producer[] = [
  {
    name: "Verde Amanecer",
    specialty: "Cosmética natural",
    location: "Villa de Merlo, San Luis",
    rating: 5.0,
    reviews: 42,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "La Colmena Natural",
    specialty: "Miel y derivados",
    location: "Alta Gracia, Córdoba",
    rating: 4.9,
    reviews: 132,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Madera Viva",
    specialty: "Carpintería artesanal",
    location: "Villa General Belgrano, Córdoba",
    rating: 4.9,
    reviews: 23,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Tierra Adentro",
    specialty: "Hortalizas agroecológicas",
    location: "Trelew, Chubut",
    rating: 4.8,
    reviews: 56,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
  },
];

export function FeaturedProducers() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
      <SectionHeader
        title="Productores destacados"
        actionLabel="Ver todos los productores"
        href="/productores"
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {producers.map((producer) => (
          <ProducerCard key={producer.name} producer={producer} />
        ))}
      </div>
    </section>
  );
}

function ProducerCard({ producer }: { producer: Producer }) {
  return (
    <article className="flex flex-col items-center rounded-2xl border border-border-soft bg-white p-6 text-center transition hover:shadow-lg">
      <div className="relative">
        <img
          src={producer.photo}
          alt={producer.name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-cream-card"
          loading="lazy"
        />
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-olive text-white ring-2 ring-white">
          <LeafIcon className="h-4 w-4" />
        </span>
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{producer.name}</h3>
      <p className="text-sm text-brown-muted">{producer.specialty}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-brown-muted">
        <MapPinIcon className="h-3.5 w-3.5 text-brown-icon" />
        {producer.location}
      </p>
      <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brown">
        <StarIcon className="h-4 w-4 text-amber-500" />
        {producer.rating.toFixed(1)}{" "}
        <span className="font-normal text-brown-muted/70">({producer.reviews})</span>
      </p>
    </article>
  );
}
