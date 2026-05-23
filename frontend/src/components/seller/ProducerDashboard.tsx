"use client";

import Link from "next/link";
import { producerStatusOf, useAuth } from "@/components/AuthProvider";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import {
  BagIcon,
  BellIcon,
  CheckCircleIcon,
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

const sidebarItems = [
  { label: "Resumen", icon: TrendingUpIcon, href: "/seller", active: true },
  { label: "Pedidos", icon: PackageIcon, href: "/seller/orders", badge: 8 },
  { label: "Productos", icon: BagIcon, href: "/seller/products" },
  { label: "Mensajes", icon: MessageIcon, href: "/chat", badge: 3 },
  { label: "Novedades", icon: BellIcon, href: "/seller/posts" },
  { label: "Seguidores", icon: UsersIcon, href: "/seller/followers" },
  { label: "Estadísticas", icon: TrendingUpIcon, href: "/seller/stats" },
  { label: "EcoScore", icon: LeafIcon, href: "/seller/ecoscore", isNew: true },
  { label: "Configuración", icon: SearchIcon, href: "/seller/profile" },
];

const stats = [
  {
    title: "Ventas del mes",
    value: "$120.500",
    helper: "+18% vs. mes anterior",
    helperColor: "text-emerald-700",
    icon: TrendingUpIcon,
  },
  {
    title: "Pedidos activos",
    value: "8",
    helper: "2 en preparación",
    helperColor: "text-amber-700",
    icon: PackageIcon,
  },
  {
    title: "Productos publicados",
    value: "12",
    helper: "1 sin stock",
    helperColor: "text-stone-500",
    icon: BagIcon,
  },
  {
    title: "Valoración promedio",
    value: "4.8",
    helper: "(124 opiniones)",
    helperColor: "text-stone-500",
    icon: StarIcon,
  },
];

const orders = [
  { id: "#MA-000152", date: "20 May", status: "En preparación", statusColor: "bg-amber-100 text-amber-800", total: "$15.500" },
  { id: "#MA-000151", date: "19 May", status: "En camino", statusColor: "bg-sky-100 text-sky-800", total: "$8.700" },
  { id: "#MA-000150", date: "18 May", status: "Entregado", statusColor: "bg-emerald-100 text-emerald-800", total: "$22.000" },
];

const products = [
  { name: "Miel pura multifloral", category: "Miel y derivados", price: "$4.500", stock: 24, active: true },
  { name: "Miel cremosa natural", category: "Miel y derivados", price: "$4.500", stock: 12, active: true },
  { name: "Miel orgánica premium", category: "Miel y derivados", price: "$5.200", stock: 0, active: false },
];

const ecoChecks = [
  "Producción responsable",
  "Materiales naturales y renovables",
  "Comercio justo",
  "Envases reciclables",
];

export function ProducerDashboard() {
  const { user } = useAuth();
  const producerStatus = producerStatusOf(user);
  const isPending = producerStatus === "pending";
  const isRejected = producerStatus === "rejected";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />

      <div className="grid gap-6">
        <DashboardHeader name={user?.name ?? "Productor"} />

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
            <ul className="grid divide-y divide-border-soft">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{order.id}</p>
                    <p className="text-xs text-stone-500">{order.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${order.statusColor}`}>{order.status}</span>
                  <p className="text-sm font-bold text-olive-dark">{order.total}</p>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Mis productos"
            action={{ label: "+ Nuevo producto", href: "/seller/products" }}
            secondaryAction={{ label: "Ver todos", href: "/seller/products" }}
          >
            <ul className="grid divide-y divide-border-soft">
              {products.map((product) => (
                <li key={product.name} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{product.name}</p>
                    <p className="text-xs text-stone-500">
                      {product.category} · Stock {product.stock}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-olive-dark">{product.price}</p>
                  <Toggle active={product.active} />
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard title="EcoScore" action={{ label: "Ver detalle", href: "/seller/ecoscore" }}>
            <div className="flex items-center gap-5">
              <EcoGauge value={85} />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Nivel Alto</p>
                <p className="text-xs text-stone-500">Tu producción cumple con buenos estándares ambientales.</p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-stone-700">
              {ecoChecks.map((check) => (
                <li key={check} className="inline-flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                  {check}
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <NewsComposer />
          <RecentMessages />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NearbyBuyersBanner />
          <PendingOrdersBanner />
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
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
          <div className="h-full w-4/5 rounded-full bg-olive" />
        </div>
        <p className="mt-2 text-xs text-stone-600">80% completado</p>
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

function DashboardHeader({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          ¡Hola, {name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-stone-600">Bienvenido a tu panel de productor.</p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-white px-3 py-2 text-xs text-stone-600">
        <LeafIcon className="h-4 w-4 text-olive" /> La Colmena Natural · Alta Gracia, Córdoba
      </div>
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

function NewsComposer() {
  return (
    <DashboardCard title="Novedades para clientes">
      <p className="text-xs text-stone-500">Compartí novedades directamente con tus seguidores.</p>
      <textarea
        placeholder="Ej: Esta semana hay miel multifloral fresca."
        className="mt-3 min-h-24 w-full rounded-xl border border-border-soft bg-cream-card p-3 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-stone-500">
          <UsersIcon className="h-4 w-4" />
          124 seguidores
        </p>
        <button
          type="button"
          className="rounded-full bg-olive-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-olive"
        >
          Enviar a mis seguidores
        </button>
      </div>
    </DashboardCard>
  );
}

function RecentMessages() {
  const chats = [
    { name: "María Laura", message: "¡Hola! Quería consultar por la miel orgánica…", time: "10:32" },
    { name: "Pablo G.", message: "¿Hacés envíos a Buenos Aires?", time: "Ayer" },
    { name: "Lucía R.", message: "Gracias por el envío, ¡todo perfecto!", time: "18 May" },
  ];

  return (
    <DashboardCard title="Mensajes" action={{ label: "Ir al chat", href: "/chat" }}>
      <ul className="grid divide-y divide-border-soft">
        {chats.map((chat) => (
          <li key={chat.name} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-muted text-xs font-bold text-olive-dark">
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
            <span className="text-xs text-stone-400">{chat.time}</span>
          </li>
        ))}
      </ul>
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
          <p className="text-xs text-olive-dark/80">Hay 18 personas interesadas en tus productos a menos de 20 km.</p>
        </div>
      </div>
      <Link
        href="/seller/followers"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-olive-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-olive"
      >
        Ver interesados
      </Link>
    </div>
  );
}

function PendingOrdersBanner() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-amber-700">
          <HeartIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">Tenés 2 nuevos pedidos para preparar</p>
          <p className="text-xs text-amber-800">Coordiná el armado para mantener tus tiempos de entrega.</p>
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
