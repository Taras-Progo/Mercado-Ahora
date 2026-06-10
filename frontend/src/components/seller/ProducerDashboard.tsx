"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { producerStatusOf, useAuth } from "@/components/AuthProvider";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import type { Conversation, Order, Product, SellerDashboard } from "@/lib/api";
import {
  getConversations,
  getSellerDashboard,
  getSellerOrders,
  getSellerProducts,
  money,
  orderStatusColor,
  orderStatusLabel,
} from "@/lib/api";
import {
  BagIcon,
  BellIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  LeafIcon,
  MessageIcon,
  PackageIcon,
  SearchIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/ui/Icons";

type SidebarItem = {
  label: string;
  icon: typeof TrendingUpIcon;
  href: string;
  badge?: number;
  isNew?: boolean;
  active?: boolean;
};

export function ProducerDashboard() {
  const { user } = useAuth();
  const producerStatus = producerStatusOf(user);
  const isPending = producerStatus === "pending";
  const isRejected = producerStatus === "rejected";

  const [dashboard, setDashboard] = useState<SellerDashboard>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const load = useCallback(async () => {
    const [d, o, p, c] = await Promise.all([
      getSellerDashboard(),
      getSellerOrders(),
      getSellerProducts(),
      getConversations(),
    ]);
    setDashboard(d);
    setOrders(o);
    setProducts(p);
    setConversations(c);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pendingOrders = dashboard.pending_orders_count ?? 0;
  const activeProducts =
    dashboard.active_products_count ?? products.filter((p) => p.status === "active").length;
  const totalProducts = dashboard.products_count ?? products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const producerProfile = user?.producer_profile;
  const businessName = producerProfile?.business_name;
  const profileCompletion = dashboard.profile_completion_percent ?? profileCompletionPercent(producerProfile);

  const stats = [
    {
      title: "Ventas del mes",
      value: money(
        orders
          .filter((o) => o.status === "delivered")
          .reduce((sum, o) => sum + (o.total_cents ?? 0), 0),
      ),
      helper: "Pedidos entregados",
      helperColor: "text-emerald-700",
      icon: TrendingUpIcon,
    },
    {
      title: "Pedidos activos",
      value: String(pendingOrders),
      helper: pendingOrders === 1 ? "por preparar" : "por preparar",
      helperColor: "text-amber-700",
      icon: PackageIcon,
    },
    {
      title: "Productos publicados",
      value: String(activeProducts),
      helper: outOfStock > 0 ? `${outOfStock} sin stock` : `${totalProducts} en total`,
      helperColor: "text-stone-500",
      icon: BagIcon,
    },
    {
      title: "Valoración promedio",
      value: "—",
      helper: "Disponible en Fase 2",
      helperColor: "text-stone-500",
      icon: StarIcon,
    },
  ];

  const recentOrders = orders.slice(0, 3);
  const recentProducts = products.slice(0, 3);
  const productsWithEcoScore = products.filter((product) => product.ecoscore_points != null);
  const ecoScore =
    productsWithEcoScore.length > 0
      ? Math.round(
          productsWithEcoScore.reduce((sum, product) => sum + (product.ecoscore_points ?? 0), 0) /
            productsWithEcoScore.length,
        )
      : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar pendingOrders={pendingOrders} profileCompletion={profileCompletion} />

      <div className="grid gap-6">
        <DashboardHeader name={user?.name ?? "Productor"} business={businessName} />

        <EmailVerificationBanner email={user?.email} verified={Boolean(user?.email_verified_at)} />

        {isPending && <PendingBanner />}
        {isRejected && <RejectedBanner />}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <DashboardCard title="Pedidos recientes" action={{ label: "Ver todos", href: "/seller/orders" }}>
            {recentOrders.length === 0 ? (
              <p className="py-4 text-sm text-stone-500">Todavía no recibiste pedidos.</p>
            ) : (
              <ul className="grid divide-y divide-border-soft">
                {recentOrders.map((order) => {
                  const firstItem = order.items?.[0];
                  const extraItems = Math.max((order.items?.length ?? 0) - 1, 0);
                  const productLabel = firstItem
                    ? `${firstItem.product_name}${extraItems > 0 ? ` + ${extraItems} mas` : ""}`
                    : "Producto sin detalle";

                  return (
                    <li key={order.id} className="grid gap-2 py-3">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-800">
                            {order.buyer?.name ?? "Comprador"}
                          </p>
                          <p className="truncate text-xs text-stone-500">{productLabel}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-olive-dark">{money(order.total_cents)}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${orderStatusColor(order.status)}`}>
                          {orderStatusLabel(order.status)}
                        </span>
                        <span className="text-xs text-stone-500">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "short",
                              })
                            : ""}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard
            title="Mis productos"
            action={{ label: "+ Nuevo producto", href: "/seller/products" }}
            secondaryAction={{ label: "Ver todos", href: "/seller/products" }}
          >
            {recentProducts.length === 0 ? (
              <p className="py-4 text-sm text-stone-500">Todavía no publicaste productos.</p>
            ) : (
              <ul className="grid divide-y divide-border-soft">
                {recentProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">{product.name}</p>
                      <p className="text-xs text-stone-500">
                        {product.category?.name ?? "Sin categoría"} · Stock {product.stock}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-olive-dark">{money(product.price_cents)}</p>
                    <Toggle active={product.status === "active"} />
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <div className="grid gap-6">
            <DashboardCard title="EcoScore" action={{ label: "Ver más", href: "/seller/ecoscore" }}>
              <div className="flex items-center gap-5">
                <EcoGauge value={ecoScore} />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    {ecoScore > 0 ? "EcoScore promedio" : "Sin EcoScore"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {ecoScore > 0
                      ? "Calculado sobre tus productos con validacion cargada."
                      : "Empeza en 0. Administracion validara el puntaje cuando corresponda."}
                  </p>
                </div>
              </div>
              <Link
                href="/seller/ecoscore"
                className="mt-4 inline-block text-xs font-semibold text-olive-dark hover:underline"
              >
                Como mejorar mi EcoScore?
              </Link>
            </DashboardCard>

            <SalesChart />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <NewsComposer />
          <FollowersCard />
          <RecentMessages conversations={conversations} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NearbyBuyersBanner />
          <PendingOrdersBanner pendingOrders={pendingOrders} />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ pendingOrders, profileCompletion }: { pendingOrders: number; profileCompletion: number }) {
  const sidebarItems: SidebarItem[] = [
    { label: "Resumen", icon: TrendingUpIcon, href: "/seller", active: true },
    { label: "Pedidos", icon: PackageIcon, href: "/seller/orders", badge: pendingOrders || undefined },
    { label: "Productos", icon: BagIcon, href: "/seller/products" },
    { label: "Mensajes", icon: MessageIcon, href: "/chat" },
    { label: "Novedades", icon: BellIcon, href: "/seller/posts" },
    { label: "Seguidores", icon: UsersIcon, href: "/seller/followers" },
    { label: "Estadísticas", icon: TrendingUpIcon, href: "/seller/stats" },
    { label: "EcoScore", icon: LeafIcon, href: "/seller/ecoscore", isNew: true },
    { label: "Configuración", icon: SearchIcon, href: "/seller/profile" },
    { label: "Pagos y cobros", icon: HeartIcon, href: "/seller/pagos" },
    { label: "Ayuda", icon: MessageIcon, href: "/ayuda" },
  ];

  return (
    <aside className="h-fit rounded-2xl border border-border-soft bg-white p-5 lg:sticky lg:top-24">
      <p className="px-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Panel del productor</p>
      <nav className="mt-3 grid gap-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
              item.active
                ? "border-l-2 border-olive bg-olive-muted font-semibold text-olive-dark"
                : "text-stone-700 hover:bg-cream-card"
            }`}
          >
            <span className="inline-flex items-center gap-3">
              <item.icon className={`h-4 w-4 ${item.active ? "text-olive" : "text-stone-400 group-hover:text-olive"}`} />
              {item.label}
            </span>
            {item.badge && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-olive px-1.5 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
            {item.isNew && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Nuevo
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-6 rounded-xl border border-border-soft bg-cream-card p-4">
        <p className="text-sm font-semibold text-stone-800">Completá tu perfil</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-olive" style={{ width: `${profileCompletion}%` }} />
        </div>
        <p className="mt-2 text-xs text-stone-600">{profileCompletion}% completado</p>
        <Link
          href="/seller/profile"
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-olive-dark px-3 py-2 text-xs font-semibold text-white transition hover:bg-olive"
        >
          Completar perfil
        </Link>
      </div>
    </aside>
  );
}

type ProfileCompletionSource = {
  business_name?: string;
  province?: string;
  city?: string;
  description?: string;
  production_origin?: string;
  product_types?: string;
  production_method?: string;
  story?: string;
};

function profileCompletionPercent(profile?: ProfileCompletionSource | null) {
  if (!profile) return 0;

  const fields: Array<keyof ProfileCompletionSource> = [
    "business_name",
    "province",
    "city",
    "description",
    "production_origin",
    "product_types",
    "production_method",
    "story",
  ];

  const completed = fields.filter((field) => {
    const value = profile[field];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }).length;

  return Math.round((completed / fields.length) * 100);
}

function DashboardHeader({ name, business }: { name: string; business?: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">¡Hola, {name.split(" ")[0]}! 👋</h1>
        <p className="mt-1 text-sm text-stone-600">Bienvenido a tu panel de productor.</p>
      </div>
      {business && (
        <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-white px-3 py-2 text-xs text-stone-600">
          <LeafIcon className="h-4 w-4 text-olive" /> {business}
        </div>
      )}
    </div>
  );
}

function PendingBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ClockIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">Postulación en revisión</p>
          <p className="text-sm text-amber-800">
            Un administrador revisará tu información. Mientras tanto, no podés publicar productos activos.
          </p>
        </div>
      </div>
      <Link
        href="/seller/profile"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-olive"
      >
        Revisar perfil <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function RejectedBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-red-300 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
          <ClockIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-red-800">Postulación rechazada</p>
          <p className="text-sm text-red-700">
            Tu cuenta no fue aprobada. Revisá los datos de tu postulación o contactá a soporte para más información.
          </p>
        </div>
      </div>
      <Link
        href="/ayuda"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-olive"
      >
        Contactar soporte
      </Link>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  helperColor,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  helperColor: string;
  icon: typeof TrendingUpIcon;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{title}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-muted text-olive">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-serif text-3xl font-bold text-stone-900">{value}</p>
      <p className={`mt-1 text-xs font-medium ${helperColor}`}>{helper}</p>
    </div>
  );
}

function DashboardCard({
  title,
  action,
  secondaryAction,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        <div className="flex items-center gap-2">
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="text-xs font-semibold text-stone-500 hover:text-olive-dark"
            >
              {secondaryAction.label}
            </Link>
          )}
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 rounded-full bg-olive-muted px-3 py-1.5 text-xs font-semibold text-olive-dark transition hover:bg-olive hover:text-white"
            >
              {action.label}
            </Link>
          )}
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Toggle({ active }: { active: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={active}
      className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition ${
        active ? "bg-olive" : "bg-stone-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
          active ? "left-4" : "left-0.5"
        }`}
      />
    </span>
  );
}

function EcoGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#e8efe4" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="#4a5d3f"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-serif text-2xl font-bold text-stone-900">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-stone-500">/ 100</p>
      </div>
    </div>
  );
}

function SalesChart() {
  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5">
      <h2 className="text-base font-semibold text-stone-900">Ventas de las últimas 4 semanas</h2>
      <div className="mt-5 grid h-40 place-items-center rounded-xl border border-dashed border-border-soft bg-cream-card px-5 text-center">
        <div>
          <p className="text-sm font-semibold text-stone-700">Sin ventas registradas</p>
          <p className="mt-1 text-xs text-stone-500">Las estadisticas reales apareceran cuando haya pedidos entregados.</p>
        </div>
      </div>
    </section>
  );
}

function NewsComposer() {
  return (
    <DashboardCard title="Novedades para clientes">
      <p className="text-xs text-stone-500">Proximamente vas a poder compartir novedades con tus seguidores.</p>
      <textarea
        disabled
        placeholder="Novedades disponible en una proxima etapa."
        className="mt-3 min-h-24 w-full resize-none rounded-xl border border-border-soft bg-cream-card p-3 text-sm text-stone-500 outline-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-stone-500">
          <UsersIcon className="h-4 w-4" />
          0 seguidores
        </p>
        <button
          type="button"
          disabled
          className="rounded-full bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-500"
        >
          Proximamente
        </button>
      </div>
    </DashboardCard>
  );
}

function FollowersCard() {
  return (
    <DashboardCard title="Seguidores" action={{ label: "Ver lista", href: "/seller/followers" }}>
      <p className="font-serif text-3xl font-bold text-stone-900">0</p>
      <p className="text-xs text-stone-500">Todavia no hay seguidores registrados.</p>
      <div className="mt-4 rounded-xl border border-dashed border-border-soft bg-cream-card p-4 text-xs text-stone-500">
        Esta funcionalidad pertenece a una proxima etapa. No se mostraran datos inventados en cuentas nuevas.
      </div>
    </DashboardCard>
  );
}

function RecentMessages({ conversations }: { conversations: Conversation[] }) {
  const chats = conversations.slice(0, 3).map((conversation) => {
    const buyer = (conversation as Conversation & { buyer?: { name?: string } }).buyer;
    const lastMessage = conversation.messages?.[0]?.body;
    return {
      id: conversation.id,
      name: buyer?.name ?? "Comprador",
      message: lastMessage ?? "Sin mensajes todavia",
      time: conversation.last_message_at
        ? new Date(conversation.last_message_at).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    };
  });

  return (
    <DashboardCard title="Mensajes" action={{ label: "Ir a chat", href: "/chat" }}>
      <p className="-mt-2 mb-2 text-xs text-stone-500">
        {conversations.length} conversaciones activas
      </p>
      {chats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-soft bg-cream-card p-4 text-sm text-stone-500">
          No tenes conversaciones todavia. Los mensajes reales apareceran aca cuando un comprador te contacte.
        </div>
      ) : (
        <ul className="grid divide-y divide-border-soft">
          {chats.map((chat) => (
            <li key={chat.id} className="flex items-center justify-between py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-muted text-xs font-bold text-olive-dark">
                  {chat.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-800">{chat.name}</p>
                  <p className="truncate text-xs text-stone-500">{chat.message}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-stone-400">{chat.time}</span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}

function NearbyBuyersBanner() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-olive-light/40 bg-olive-muted p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-olive-dark">
          <UsersIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-olive-dark">Compradores cerca de vos</p>
          <p className="text-xs text-olive-dark/80">Proximamente se mostraran interesados reales segun ubicacion y categorias.</p>
        </div>
      </div>
      <Link
        href="/seller/followers"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-olive-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-olive"
      >
        Proximamente
      </Link>
    </div>
  );
}

function PendingOrdersBanner({ pendingOrders }: { pendingOrders: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-amber-700">
          <PackageIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {pendingOrders > 0
              ? `Tenés ${pendingOrders} ${pendingOrders === 1 ? "pedido" : "pedidos"} para preparar`
              : "No tenés pedidos pendientes"}
          </p>
          <p className="text-xs text-amber-800">Ingresá a la sección de pedidos para ver los detalles.</p>
        </div>
      </div>
      <Link
        href="/seller/orders"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        Ir a pedidos
      </Link>
    </div>
  );
}
