export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  children?: Category[];
};

export type ProducerProfile = {
  id: number;
  business_name: string;
  slug: string;
  province?: string;
  city?: string;
  description?: string;
  status?: string;
  production_practices?: string;
  production_origin?: string;
  product_types?: string;
  production_method?: string;
  production_since?: string;
  story?: string;
  digital_presence_notes?: string;
  logo_path?: string | null;
  products_count?: number;
  products?: Product[];
  social_links?: ProducerSocialLink[];
  socialLinks?: ProducerSocialLink[];
};

export type ProducerSocialLink = {
  id: number;
  producer_profile_id: number;
  platform: string;
  url: string;
  is_visible: boolean;
};

export type ProductImage = {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
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
  status?: string;
  category_id?: number;
  category?: Category;
  producer_profile?: ProducerProfile;
  producerProfile?: ProducerProfile;
  images?: ProductImage[];
};

export type CatalogProvinceFilter = {
  value: string;
  label: string;
  count: number;
};

export type CatalogFilters = {
  provinces: CatalogProvinceFilter[];
};

export type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_cents: number;
  subtotal_cents?: number;
  delivery_cents?: number;
  delivery_type?: string;
  delivery_address?: string;
  city?: string;
  province?: string;
  buyer_note?: string;
  created_at?: string;
  buyer?: { id: number; name: string; email?: string };
  items?: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    product?: Product;
  }>;
  status_history?: Array<{
    id: number;
    status: string;
    note?: string;
    created_at: string;
  }>;
};

export type CartItem = {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  unit_price_cents_snapshot: number;
  quantity: number;
  note?: string;
  product?: Product;
};

export type Cart = {
  id: number;
  user_id: number;
  delivery_type?: string;
  items?: CartItem[];
};

export type Conversation = {
  id: number;
  buyer_id: number;
  producer_profile_id: number;
  product_id?: number | null;
  order_id?: number | null;
  status: string;
  last_message_at?: string;
  created_at?: string;
  product?: Product;
  order?: Order;
  producer_profile?: ProducerProfile;
  messages?: Message[];
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender?: { id: number; name: string };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

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
    producer_profile: { id: 1, business_name: "Finca Raíces Verdes", slug: "finca-raices-verdes", province: "Córdoba", city: "Alta Gracia" },
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
    producer_profile: { id: 1, business_name: "Finca Raíces Verdes", slug: "finca-raices-verdes", province: "Córdoba", city: "Alta Gracia" },
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
    producer_profile: { id: 1, business_name: "Finca Raíces Verdes", slug: "finca-raices-verdes", province: "Córdoba", city: "Alta Gracia" },
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

export function ecoColor(score?: number) {
  if (!score) return "bg-stone-200 text-stone-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function statusLabel(status?: string) {
  switch (status) {
    case "draft": return "Borrador";
    case "active": return "Activo";
    case "paused": return "Pausado";
    case "rejected": return "Rechazado";
    case "pending": return "Pendiente";
    default: return status ?? "";
  }
}

export function statusColor(status?: string) {
  switch (status) {
    case "draft": return "bg-stone-100 text-stone-700";
    case "active": return "bg-emerald-100 text-emerald-800";
    case "paused": return "bg-amber-100 text-amber-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "pending": return "bg-sky-100 text-sky-800";
    default: return "bg-stone-100 text-stone-600";
  }
}

export function productionTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    natural: "Natural",
    agroecologico: "Agroecológico",
    organico: "Orgánico",
    artesanal: "Artesanal",
    regional: "Regional",
    industrial: "Industrial",
  };
  return type ? (labels[type] ?? type) : "";
}

export function deliveryTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    local: "Retiro local",
    home_delivery: "Envío a domicilio",
    pickup_point: "Punto de entrega",
    producer_pickup: "Retiro en el local",
  };
  return type ? (labels[type] ?? type) : "";
}

// ---- Public API (unauthenticated) ----

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

export async function getProducts(params?: Record<string, string>): Promise<Product[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const response = await apiGet<{ data?: Product[] } | Product[]>(`/products${qs}`, demoProducts);
  if (Array.isArray(response)) return response;
  return response.data ?? demoProducts;
}

export async function getCatalogFilters(params?: Record<string, string>): Promise<CatalogFilters> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const response = await apiGet<CatalogFilters>(`/catalog/filters${qs}`, { provinces: [] });
  return response ?? { provinces: [] };
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return apiGet<Product | undefined>(`/products/${slug}`, demoProducts.find((product) => product.slug === slug));
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiGet<Category[]>("/categories", demoCategories);
  return response ?? demoCategories;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return apiGet<Category | undefined>(`/categories/${slug}`, demoCategories.find((c) => c.slug === slug));
}

export async function getProducers(): Promise<ProducerProfile[]> {
  return apiGet<ProducerProfile[]>("/producers", []);
}

export async function getProducer(id: number): Promise<ProducerProfile | undefined> {
  return apiGet<ProducerProfile | undefined>(`/producers/${id}`, undefined);
}

// ---- Related Products ----

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const response = await apiGet<{ data?: Product[] } | Product[]>(`/products/${slug}/related`, []);
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

// ---- Authenticated API helpers ----

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mercado_token") ?? sessionStorage.getItem("mercado_token");
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

async function apiAuthGet<T>(path: string): Promise<T> {
  const response = await authFetch(path);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de red" }));
    throw new Error(error.message ?? "Error de red");
  }
  const json = await response.json();
  return json.data ?? json;
}

async function apiAuthPost<T>(path: string, body: unknown): Promise<T> {
  const response = await authFetch(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de red" }));
    throw new Error(error.message ?? "Error de red");
  }
  const json = await response.json();
  return json.data ?? json;
}

async function apiAuthPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await authFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de red" }));
    throw new Error(error.message ?? "Error de red");
  }
  const json = await response.json();
  return json.data ?? json;
}

async function apiAuthDelete<T>(path: string): Promise<T> {
  const response = await authFetch(path, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de red" }));
    throw new Error(error.message ?? "Error de red");
  }
  const json = await response.json();
  return json.data ?? json;
}

// ---- Seller Product API ----

export async function getSellerProducts(): Promise<Product[]> {
  try {
    return await apiAuthGet<Product[]>("/seller/products");
  } catch {
    return [];
  }
}

export async function getSellerProduct(id: number): Promise<Product> {
  return apiAuthGet<Product>(`/seller/products/${id}`);
}

export async function createProduct(data: Record<string, unknown>): Promise<Product> {
  return apiAuthPost<Product>("/seller/products", data);
}

export async function updateProduct(id: number, data: Record<string, unknown>): Promise<Product> {
  return apiAuthPatch<Product>(`/seller/products/${id}`, data);
}

export type ProductDeleteResult = {
  action: "deleted" | "paused";
  message: string;
  product?: Product;
};

export async function deleteProduct(id: number): Promise<ProductDeleteResult> {
  return apiAuthDelete<ProductDeleteResult>(`/seller/products/${id}`);
}

export async function publishProduct(id: number): Promise<Product> {
  return apiAuthPatch<Product>(`/seller/products/${id}/publish`, {});
}

export async function pauseProduct(id: number): Promise<Product> {
  return apiAuthPatch<Product>(`/seller/products/${id}/pause`, {});
}

// ---- Seller Image API ----

export async function uploadProductImage(productId: number, file: File, isPrimary?: boolean): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("image", file);
  if (isPrimary !== undefined) {
    formData.append("is_primary", isPrimary ? "1" : "0");
  }
  const response = await authFetch(`/seller/products/${productId}/images`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error al subir imagen" }));
    throw new Error(error.message ?? "Error al subir imagen");
  }
  const json = await response.json();
  return json.data;
}

export async function updateProductImage(productId: number, imageId: number, data: Record<string, unknown>): Promise<ProductImage> {
  return apiAuthPatch<ProductImage>(`/seller/products/${productId}/images/${imageId}`, data);
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await apiAuthDelete(`/seller/products/${productId}/images/${imageId}`);
}

export function imageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const configured = process.env.NEXT_PUBLIC_STORAGE_URL;
  const base =
    configured ??
    (API_BASE.startsWith("http")
      ? `${new URL(API_BASE).origin}/storage`
      : "/storage");
  return `${base}/${path}`;
}

// ---- Cart API ----

export async function getCart(): Promise<Cart> {
  try {
    return await apiAuthGet<Cart>("/cart");
  } catch {
    return { id: 0, user_id: 0, items: [] };
  }
}

export async function addToCart(productId: number, quantity?: number): Promise<Cart> {
  return apiAuthPost<Cart>("/cart/items", { product_id: productId, quantity: quantity ?? 1 });
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return apiAuthPatch<Cart>(`/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  return apiAuthDelete<Cart>(`/cart/items/${itemId}`);
}

// ---- Buy Now API ----

export async function buyNow(data: {
  product_id: number;
  quantity?: number;
  delivery_type?: string;
  delivery_address?: string;
  city?: string;
  province?: string;
  buyer_note?: string;
}): Promise<Order> {
  return apiAuthPost<Order>("/checkout/buy-now", data);
}

// ---- Checkout API ----

export async function checkoutCart(data: {
  delivery_type?: string;
  delivery_address?: string;
  city?: string;
  province?: string;
  buyer_note?: string;
}): Promise<{ orders: Order[]; orders_count: number; message: string }> {
  return apiAuthPost<{ orders: Order[]; orders_count: number; message: string }>("/checkout/cart", data);
}

// ---- Orders API ----

export async function getOrders(): Promise<Order[]> {
  try {
    return await apiAuthGet<Order[]>("/orders");
  } catch {
    return [];
  }
}

export async function getOrder(id: number): Promise<Order> {
  return apiAuthGet<Order>(`/orders/${id}`);
}

// ---- Seller Dashboard API ----

export type SellerDashboard = {
  profile_status?: string;
  can_publish_products?: boolean;
  approval_message?: string;
  products_count?: number;
  active_products_count?: number;
  pending_orders_count?: number;
  profile_completion_percent?: number;
};

export async function getSellerDashboard(): Promise<SellerDashboard> {
  try {
    return await apiAuthGet<SellerDashboard>("/seller/dashboard");
  } catch {
    return {};
  }
}

// ---- Become a producer (existing account) ----

export type SellerApplyPayload = {
  business_name: string;
  province?: string;
  city?: string;
  description?: string;
  production_practices?: string;
  production_origin?: string;
  product_types?: string;
  production_method?: string;
  production_since?: string;
  story?: string;
  digital_presence_notes?: string;
};

export type SellerApplyResult = {
  message?: string;
  status?: "pending" | "active" | "rejected";
};

// Upgrades the currently logged-in account to a producer (no new email/password).
export async function applyAsSeller(payload: SellerApplyPayload): Promise<SellerApplyResult> {
  return apiAuthPost<SellerApplyResult>("/seller/apply", payload);
}

// ---- Seller Profile API ----

export type SellerProfilePayload = {
  business_name: string;
  province?: string;
  city?: string;
  description?: string;
  production_practices?: string;
  production_origin?: string;
  product_types?: string;
  production_method?: string;
  production_since?: string;
  story?: string;
  digital_presence_notes?: string;
};

export async function getSellerProfile(): Promise<ProducerProfile | null> {
  try {
    return await apiAuthGet<ProducerProfile | null>("/seller/profile");
  } catch {
    return null;
  }
}

export async function saveSellerProfile(payload: SellerProfilePayload): Promise<ProducerProfile> {
  return apiAuthPatch<ProducerProfile>("/seller/profile", payload);
}

export async function getSellerSocialLinks(): Promise<ProducerSocialLink[]> {
  try {
    return await apiAuthGet<ProducerSocialLink[]>("/seller/social-links");
  } catch {
    return [];
  }
}

export async function saveSellerSocialLink(payload: {
  platform: string;
  url: string;
  is_visible?: boolean;
}): Promise<ProducerSocialLink> {
  return apiAuthPost<ProducerSocialLink>("/seller/social-links", payload);
}

// ---- Seller Orders API ----

export async function getSellerOrders(): Promise<Order[]> {
  try {
    return await apiAuthGet<Order[]>("/seller/orders");
  } catch {
    return [];
  }
}

export async function getSellerOrder(id: number): Promise<Order> {
  return apiAuthGet<Order>(`/seller/orders/${id}`);
}

export async function updateSellerOrderStatus(id: number, status: string, note?: string): Promise<Order> {
  return apiAuthPatch<Order>(`/seller/orders/${id}/status`, { status, note });
}

export async function createSellerOrderConversation(id: number): Promise<Conversation> {
  return apiAuthPost<Conversation>(`/seller/orders/${id}/conversation`, {});
}

export const SELLER_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// ---- Chat / Conversations API ----

export async function getConversations(): Promise<Conversation[]> {
  try {
    return await apiAuthGet<Conversation[]>("/conversations");
  } catch {
    return [];
  }
}

export async function createConversation(data: {
  producer_profile_id: number;
  product_id?: number;
  message?: string;
}): Promise<Conversation> {
  return apiAuthPost<Conversation>("/conversations", data);
}

export async function getConversation(id: number): Promise<Conversation> {
  return apiAuthGet<Conversation>(`/conversations/${id}`);
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  try {
    return await apiAuthGet<Message[]>(`/conversations/${conversationId}/messages`);
  } catch {
    return [];
  }
}

export async function sendMessage(conversationId: number, body: string): Promise<Message> {
  return apiAuthPost<Message>(`/conversations/${conversationId}/messages`, { body });
}

// ---- Admin API ----

export type ReturnRequest = {
  id: number;
  order_id: number;
  buyer_id: number;
  reason: string;
  details?: string;
  status: string;
  created_at?: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "buyer" | "seller" | "admin";
  status: string;
  created_at?: string;
  email_verified_at?: string | null;
  producer_profile?: ProducerProfile | null;
  producerProfile?: ProducerProfile | null;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    return await apiAuthGet<AdminUser[]>("/admin/users");
  } catch {
    return [];
  }
}

export async function resetAdminUserPassword(
  id: number,
  password: string,
  passwordConfirmation: string,
): Promise<{ user: AdminUser; message: string }> {
  return apiAuthPatch<{ user: AdminUser; message: string }>(`/admin/users/${id}/password`, {
    password,
    password_confirmation: passwordConfirmation,
  });
}

export async function getAdminProducts(): Promise<Product[]> {
  try {
    return await apiAuthGet<Product[]>("/admin/products");
  } catch {
    return [];
  }
}

export async function approveAdminProduct(id: number): Promise<Product> {
  return apiAuthPatch<Product>(`/admin/products/${id}/approve`, {});
}

export async function rejectAdminProduct(id: number): Promise<Product> {
  return apiAuthPatch<Product>(`/admin/products/${id}/reject`, {});
}

export async function updateAdminProductStatus(id: number, status: string): Promise<Product> {
  return apiAuthPatch<Product>(`/admin/products/${id}/status`, { status });
}

export async function getAdminOrders(): Promise<Order[]> {
  try {
    return await apiAuthGet<Order[]>("/admin/orders");
  } catch {
    return [];
  }
}

export async function updateAdminOrderStatus(id: number, status: string, note?: string): Promise<Order> {
  return apiAuthPatch<Order>(`/admin/orders/${id}/status`, { status, note });
}

export async function getAdminReturns(): Promise<ReturnRequest[]> {
  try {
    return await apiAuthGet<ReturnRequest[]>("/admin/returns");
  } catch {
    return [];
  }
}

export async function updateAdminReturnStatus(id: number, status: string): Promise<ReturnRequest> {
  return apiAuthPatch<ReturnRequest>(`/admin/returns/${id}/status`, { status });
}

export function orderStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    processing: "En preparación",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    returned: "Devuelto",
  };
  return status ? (labels[status] ?? status) : "";
}

export function orderStatusColor(status?: string): string {
  switch (status) {
    case "pending": return "bg-sky-100 text-sky-800";
    case "confirmed": return "bg-blue-100 text-blue-800";
    case "processing": return "bg-amber-100 text-amber-800";
    case "shipped": return "bg-purple-100 text-purple-800";
    case "delivered": return "bg-emerald-100 text-emerald-800";
    case "cancelled": return "bg-red-100 text-red-800";
    case "returned": return "bg-orange-100 text-orange-800";
    default: return "bg-stone-100 text-stone-600";
  }
}
