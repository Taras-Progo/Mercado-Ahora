export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type ProducerProfile = {
  id: number;
  business_name: string;
  slug: string;
  province?: string;
  city?: string;
  description?: string;
  production_origin?: string;
  product_types?: string;
  production_method?: string;
  production_since?: string;
  story?: string;
  digital_presence_notes?: string;
  status?: string;
  social_links?: Array<{ id: number; platform: string; url: string; is_visible: boolean }>;
  socialLinks?: Array<{ id: number; platform: string; url: string; is_visible: boolean }>;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price_cents: number;
  currency: string;
  stock: number;
  unit: string;
  province?: string;
  city?: string;
  production_type?: string;
  delivery_type?: string;
  ecoscore_points?: number;
  ecoscore_status?: string;
  ecoscore_validation_notes?: string;
  status?: string;
  category?: Category;
  producer_profile?: ProducerProfile;
  producerProfile?: ProducerProfile;
};

export type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_cents: number;
  created_at?: string;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    line_total_cents: number;
  }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export const demoCategories: Category[] = [
  { id: 1, name: "Alimentos naturales", slug: "alimentos-naturales", description: "Miel, mermeladas, conservas, frutos secos, granos" },
  { id: 2, name: "Huerta y productos frescos", slug: "huerta-y-productos-frescos", description: "Frutas, verduras, huevos, plantas aromáticas" },
  { id: 3, name: "Bebidas naturales", slug: "bebidas-naturales", description: "Tés, infusiones, jugos naturales" },
  { id: 4, name: "Cosmética natural", slug: "cosmetica-natural", description: "Jabones, cremas, aceites esenciales" },
  { id: 5, name: "Bienestar y salud natural", slug: "bienestar-y-salud-natural", description: "Productos herbales, suplementos naturales" },
  { id: 6, name: "Hogar sostenible", slug: "hogar-sostenible", description: "Productos reutilizables, limpieza ecológica" },
  { id: 7, name: "Artesanías y productos regionales", slug: "artesanias-y-productos-regionales", description: "Madera, cerámica, textiles" },
  { id: 8, name: "Mascotas naturales", slug: "mascotas-naturales", description: "Alimentos y accesorios naturales" },
];

export const demoProducts: Product[] = [
  {
    id: 1,
    name: "Miel natural de monte",
    slug: "miel-natural-de-monte",
    description: "Miel regional de producción familiar, cosechada en pequeños lotes.",
    price_cents: 420000,
    currency: "ARS",
    stock: 24,
    unit: "frasco",
    province: "Córdoba",
    city: "Alta Gracia",
    production_type: "natural",
    delivery_type: "local",
    ecoscore_points: 90,
    category: demoCategories[0],
    ecoscore_status: "manual_reviewed",
    ecoscore_validation_notes: "Validación demo por revisión manual.",
    producer_profile: { id: 1, business_name: "Finca Raíces Verdes", slug: "finca-raices-verdes", province: "Córdoba", city: "Alta Gracia", story: "Emprendimiento familiar enfocado en productos naturales y procesos transparentes.", status: "active" },
  },
  {
    id: 2,
    name: "Mix de hierbas para infusión",
    slug: "mix-de-hierbas-para-infusion",
    description: "Blend de hierbas regionales secadas naturalmente.",
    price_cents: 280000,
    currency: "ARS",
    stock: 40,
    unit: "paquete",
    province: "Córdoba",
    city: "Alta Gracia",
    production_type: "regional",
    delivery_type: "local",
    ecoscore_points: 78,
    category: demoCategories[2],
    ecoscore_status: "manual_reviewed",
    ecoscore_validation_notes: "Validación demo por revisión manual.",
    producer_profile: { id: 1, business_name: "Finca Raíces Verdes", slug: "finca-raices-verdes", province: "Córdoba", city: "Alta Gracia", story: "Emprendimiento familiar enfocado en productos naturales y procesos transparentes.", status: "active" },
  },
  {
    id: 3,
    name: "Jabón artesanal de caléndula",
    slug: "jabon-artesanal-de-calendula",
    description: "Jabón natural elaborado artesanalmente con aceite vegetal y caléndula.",
    price_cents: 190000,
    currency: "ARS",
    stock: 32,
    unit: "unidad",
    province: "Córdoba",
    city: "Alta Gracia",
    production_type: "artesanal",
    delivery_type: "home_delivery",
    ecoscore_points: 84,
    category: demoCategories[3],
    ecoscore_status: "manual_reviewed",
    ecoscore_validation_notes: "Validación demo por revisión manual.",
    producer_profile: { id: 1, business_name: "Finca Raíces Verdes", slug: "finca-raices-verdes", province: "Córdoba", city: "Alta Gracia", story: "Emprendimiento familiar enfocado en productos naturales y procesos transparentes.", status: "active" },
  },
];

export function money(cents: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ecoLabel(score?: number) {
  if (!score) return "Sin EcoScore";
  if (score >= 80) return "EcoScore Alto";
  if (score >= 50) return "EcoScore Medio";
  return "EcoScore Básico";
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    const json = await response.json();
    return json.data ?? json;
  } catch {
    return fallback;
  }
}

export async function getProducts(): Promise<Product[]> {
  const response = await apiGet<{ data?: Product[] } | Product[]>("/products", demoProducts);
  if (Array.isArray(response)) return response;
  return response.data ?? demoProducts;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return apiGet<Product | undefined>(`/products/${slug}`, demoProducts.find((product) => product.slug === slug));
}

export async function getCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/categories", demoCategories);
}
