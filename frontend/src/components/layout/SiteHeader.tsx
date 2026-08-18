"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { BellIcon, CartIcon, ChevronDownIcon, HeartIcon, MessageIcon, SearchIcon } from "@/components/ui/Icons";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import type { AppNotification, Cart, Conversation } from "@/lib/api";
import { ApiError, getCart, getConversationSummary, getNotificationSummary, markAllNotificationsRead, markNotificationRead, money } from "@/lib/api";

type NavItem = { label: string; href: string };

const publicNav: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Categorías", href: "/categorias" },
  { label: "Productores", href: "/productores" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
];

type SiteHeaderProps = {
  variant?: "default" | "minimal" | "transparent";
};

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { favoriteCount } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<"messages" | "notifications" | "cart" | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [messagePreview, setMessagePreview] = useState<Conversation[]>([]);
  const [notificationPreview, setNotificationPreview] = useState<AppNotification[]>([]);
  const panelsRef = useRef<HTMLDivElement>(null);

  const transparent = variant === "transparent";
  const showNav = variant !== "minimal";

  const baseClasses = transparent
    ? "absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-transparent text-white"
    : "sticky top-0 z-30 border-b border-border-soft bg-background text-foreground";

  const linkColor = transparent
    ? "text-white/90 hover:text-white"
    : "text-brown hover:text-olive-dark";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    setOpenPanel(null);
  }, [pathname]);

  useEffect(() => {
    if (!ready || !user) {
      return;
    }

    let cancelled = false;

    async function loadCounts() {
      try {
        const [cartData, conversationSummary] = await Promise.all([getCart(), getConversationSummary(4)]);
        if (cancelled) return;
        const nextCartCount = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
        setCart(cartData);
        setCartCount(nextCartCount);
        setMessageCount(conversationSummary.unread_count);
        setMessagePreview(conversationSummary.conversations);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await logout();
        }
        if (cancelled) return;
        setCart(null);
        setCartCount(0);
      }
    }

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [logout, ready, user]);

  useEffect(() => {
    if (!ready || !user) return;

    let cancelled = false;

    async function refreshNotifications() {
      try {
        const summary = await getNotificationSummary(4);
        if (cancelled) return;
        setNotificationCount(summary.unread_count);
        setNotificationPreview(summary.notifications);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await logout();
        }
      }
    }

    void refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 30_000);
    const handleFocus = () => void refreshNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshNotifications();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [logout, ready, user]);

  async function openNotification(notification: AppNotification) {
    if (!notification.read_at) {
      await markNotificationRead(notification.id);
      setNotificationCount((count) => Math.max(0, count - 1));
      setNotificationPreview((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)),
      );
    }
    setOpenPanel(null);
    router.push(notification.data.url || "/notificaciones");
  }

  async function readAllNotifications() {
    await markAllNotificationsRead();
    setNotificationCount(0);
    setNotificationPreview((items) => items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
  }

  useEffect(() => {
    if (!openPanel) return;

    function handlePointerDown(event: PointerEvent) {
      if (panelsRef.current && !panelsRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <header className={baseClasses}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Logo variant={transparent ? "light" : "dark"} size="md" />
        </Link>

        {showNav && (
          <nav className="hidden items-center gap-1 lg:flex">
            {publicNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition ${linkColor}`}
                >
                  <span className={active ? "font-semibold" : ""}>{item.label}</span>
                  {active && (
                    <span
                      className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full ${
                        transparent ? "bg-white" : "bg-brown"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div ref={panelsRef} className="relative flex items-center gap-1 sm:gap-2">
          <IconButton transparent={transparent} ariaLabel="Buscar" href="/buscar">
            <SearchIcon className="h-5 w-5" />
          </IconButton>
          {ready && user ? (
            <HeaderIconButton
              transparent={transparent}
              ariaLabel="Mensajes"
              badge={messageCount > 0 ? messageCount : undefined}
              expanded={openPanel === "messages"}
              onClick={() => setOpenPanel((current) => (current === "messages" ? null : "messages"))}
            >
              <MessageIcon className="h-5 w-5" />
            </HeaderIconButton>
          ) : null}
          {ready && user ? (
            <HeaderIconButton
              transparent={transparent}
              ariaLabel="Notificaciones"
              badge={notificationCount > 0 ? notificationCount : undefined}
              expanded={openPanel === "notifications"}
              onClick={() => setOpenPanel((current) => (current === "notifications" ? null : "notifications"))}
            >
              <BellIcon className="h-5 w-5" />
            </HeaderIconButton>
          ) : null}
          {/* Favorites stays secondary on very small screens; messages, notifications and cart remain one tap away. */}
          <span className="hidden items-center gap-1 sm:flex sm:gap-2">
            <IconButton transparent={transparent} ariaLabel="Favoritos" href="/favoritos" badge={user && favoriteCount > 0 ? favoriteCount : undefined}>
              <HeartIcon className="h-5 w-5" />
            </IconButton>
          </span>
          <HeaderIconButton
            transparent={transparent}
            ariaLabel="Carrito"
            badge={user && cartCount > 0 ? cartCount : undefined}
            expanded={openPanel === "cart"}
            onClick={() => setOpenPanel((current) => (current === "cart" ? null : "cart"))}
          >
            <CartIcon className="h-5 w-5" />
          </HeaderIconButton>

          {ready && user && openPanel === "messages" && (
            <MessagesPreviewPanel
              conversations={messagePreview}
              userRole={user.role}
              onNavigate={() => setOpenPanel(null)}
            />
          )}

          {ready && user && openPanel === "notifications" && (
            <NotificationsPreviewPanel
              notifications={notificationPreview}
              unreadCount={notificationCount}
              onOpen={openNotification}
              onReadAll={readAllNotifications}
              onNavigate={() => setOpenPanel(null)}
            />
          )}

          {ready && user && openPanel === "cart" && (
            <CartPreviewPanel cart={cart} onNavigate={() => setOpenPanel(null)} />
          )}

          <div className="ml-1 hidden h-8 w-px bg-current opacity-20 lg:block" />

          {/* Desktop auth / account */}
          {ready && user ? (
            <div className="hidden lg:block">
              <UserMenu name={user.name} role={user.role} favoriteCount={favoriteCount} transparent={transparent} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/login"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  transparent ? "text-white hover:bg-white/10" : "text-brown hover:bg-olive-muted"
                }`}
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  transparent ? "bg-white text-olive-dark hover:bg-white/90" : "btn-primary"
                }`}
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition lg:hidden ${
              transparent ? "text-white hover:bg-white/10" : "text-brown-icon hover:bg-olive-muted hover:text-brown"
            }`}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border-soft bg-background text-foreground shadow-lg lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            {showNav && (
              <nav className="grid gap-1">
                {publicNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive(item.href)
                        ? "bg-olive-muted font-semibold text-olive-dark"
                        : "text-brown hover:bg-cream-card"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            <div className={`grid gap-2 ${showNav ? "mt-3 border-t border-border-soft pt-3" : ""}`}>
              {ready && user ? (
                <>
                  <div className="px-3 py-1">
                    <p className="text-sm font-semibold text-stone-800">{user.name}</p>
                    <p className="text-xs capitalize text-stone-500">
                      {user.role === "buyer" ? "Comprador" : user.role}
                    </p>
                  </div>
                  {user.role === "buyer" && (
                    <MobileLink href="/cuenta" onClick={() => setMenuOpen(false)}>
                      Mi cuenta
                    </MobileLink>
                  )}
                  {user.role === "seller" && (
                    <MobileLink href="/seller" onClick={() => setMenuOpen(false)}>
                      Panel del productor
                    </MobileLink>
                  )}
                  {user.role === "admin" && (
                    <MobileLink href="/admin" onClick={() => setMenuOpen(false)}>
                      Panel administrador
                    </MobileLink>
                  )}
                  <MobileLink href={user.role === "seller" ? "/seller/orders" : "/orders"} onClick={() => setMenuOpen(false)}>
                    {user.role === "seller" ? "Mis ventas" : "Mis pedidos"}
                  </MobileLink>
                  <MobileLink href="/chat" onClick={() => setMenuOpen(false)}>
                    Mensajes
                  </MobileLink>
                  <MobileLink href="/favoritos" onClick={() => setMenuOpen(false)}>
                    Favoritos{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
                  </MobileLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 rounded-xl border border-border-soft px-3 py-2.5 text-left text-sm font-medium text-brown transition hover:bg-cream-card"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-olive px-4 py-3 text-center text-sm font-semibold text-olive-dark transition hover:bg-olive-muted"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary rounded-full px-4 py-3 text-center text-sm font-semibold"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl px-3 py-2.5 text-sm font-medium text-brown transition hover:bg-cream-card"
    >
      {children}
    </Link>
  );
}

function IconButton({
  children,
  ariaLabel,
  href,
  badge,
  transparent,
  className = "",
}: {
  children: React.ReactNode;
  ariaLabel: string;
  href: string;
  badge?: number;
  transparent?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
        transparent ? "text-white hover:bg-white/10" : "text-brown-icon hover:bg-olive-muted hover:text-brown"
      } ${className}`}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function HeaderIconButton({
  children,
  ariaLabel,
  badge,
  transparent,
  expanded,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  badge?: number;
  transparent?: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={expanded}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
        transparent ? "text-white hover:bg-white/10" : "text-brown-icon hover:bg-olive-muted hover:text-brown"
      }`}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MessagesPreviewPanel({
  conversations,
  userRole,
  onNavigate,
}: {
  conversations: Conversation[];
  userRole: string;
  onNavigate: () => void;
}) {
  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-soft bg-white text-foreground shadow-xl">
      <div className="border-b border-border-soft bg-cream-card px-4 py-3">
        <p className="text-sm font-semibold text-stone-900">Mensajes recientes</p>
        <p className="text-xs text-stone-500">Últimas conversaciones de Mercado Ahora</p>
      </div>
      {conversations.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-stone-500">No tenés mensajes recientes.</div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {conversations.map((conversation) => {
            const name = conversationPreviewName(conversation, userRole);
            const initials = initialsFor(name);
            const lastMessage = conversation.messages?.[0]?.body ?? "Sin mensajes todavía";

            return (
              <Link
                key={conversation.id}
                href={`/chat?id=${conversation.id}`}
                onClick={onNavigate}
                className="grid grid-cols-[2.5rem_1fr_auto] gap-3 border-b border-border-soft px-4 py-3 text-left transition last:border-b-0 hover:bg-olive-muted"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-muted text-xs font-bold text-olive-dark">
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-900">{name}</span>
                  <span className="block truncate text-xs text-stone-500">{lastMessage}</span>
                </span>
                <span className="whitespace-nowrap text-[11px] text-stone-400">
                  {relativeTime(conversation.last_message_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <Link
        href="/chat"
        onClick={onNavigate}
        className="block border-t border-border-soft px-4 py-3 text-center text-sm font-semibold text-olive-dark transition hover:bg-cream-card"
      >
        Ver todos los mensajes
      </Link>
    </div>
  );
}

function NotificationsPreviewPanel({
  notifications,
  unreadCount,
  onOpen,
  onReadAll,
  onNavigate,
}: {
  notifications: AppNotification[];
  unreadCount: number;
  onOpen: (notification: AppNotification) => Promise<void>;
  onReadAll: () => Promise<void>;
  onNavigate: () => void;
}) {
  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-soft bg-white text-foreground shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft bg-cream-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Notificaciones</p>
          <p className="text-xs text-stone-500">{unreadCount ? `${unreadCount} sin leer` : "Todo está al día"}</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => void onReadAll()} className="text-xs font-semibold text-olive-dark hover:underline">
            Marcar todas como leídas
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-stone-500">No tenés notificaciones recientes.</div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void onOpen(notification)}
              className={`block w-full border-b border-border-soft px-4 py-3 text-left transition last:border-b-0 hover:bg-olive-muted ${notification.read_at ? "bg-white" : "bg-emerald-50/60"}`}
            >
              <span className="flex items-start gap-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read_at ? "bg-stone-300" : "bg-olive"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-900">{notification.data.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-stone-600">{notification.data.message}</span>
                  <span className="mt-1 block text-[11px] text-stone-400">{relativeTime(notification.created_at)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Link
        href="/notificaciones"
        onClick={onNavigate}
        className="block border-t border-border-soft px-4 py-3 text-center text-sm font-semibold text-olive-dark transition hover:bg-cream-card"
      >
        Ver todas las notificaciones
      </Link>
    </div>
  );
}

function CartPreviewPanel({ cart, onNavigate }: { cart: Cart | null; onNavigate: () => void }) {
  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price_cents_snapshot * item.quantity,
    0,
  );

  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-soft bg-white text-foreground shadow-xl">
      <div className="border-b border-border-soft bg-cream-card px-4 py-3">
        <p className="text-sm font-semibold text-stone-900">Tu carrito</p>
        <p className="text-xs text-stone-500">
          {items.length > 0 ? `${items.length} producto${items.length !== 1 ? "s" : ""} seleccionado${items.length !== 1 ? "s" : ""}` : "Sin productos seleccionados"}
        </p>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-stone-500">Todavía no agregaste productos.</div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-border-soft px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{item.product_name_snapshot}</p>
                  <p className="text-xs text-stone-500">
                    {item.quantity} x {money(item.unit_price_cents_snapshot)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-olive-dark">
                  {money(item.unit_price_cents_snapshot * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border-soft px-4 py-3">
            <span className="text-sm font-semibold text-stone-700">Subtotal</span>
            <span className="text-base font-bold text-stone-900">{money(subtotal)}</span>
          </div>
        </>
      )}
      <div className="grid gap-2 border-t border-border-soft bg-cream-card p-3 sm:grid-cols-2">
        <Link
          href="/cart"
          onClick={onNavigate}
          className="rounded-full border border-olive px-4 py-2 text-center text-sm font-semibold text-olive-dark transition hover:bg-white"
        >
          Ver carrito
        </Link>
        <Link
          href="/checkout"
          onClick={onNavigate}
          className="rounded-full bg-olive px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-olive-dark"
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}

function conversationPreviewName(conversation: Conversation, userRole: string): string {
  if (userRole === "seller") {
    return (conversation as Conversation & { buyer?: { name?: string } }).buyer?.name ?? "Comprador";
  }

  return conversation.producer_profile?.business_name ?? "Productor";
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MA";
}

function relativeTime(value?: string): string {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return "recién";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffHours < 48) return "ayer";
  return new Date(value).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function UserMenu({
  name,
  role,
  favoriteCount,
  transparent,
  onLogout,
}: {
  name: string;
  role: string;
  favoriteCount: number;
  transparent?: boolean;
  onLogout: () => void;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <details className="relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition ${
          transparent ? "hover:bg-white/10" : "hover:bg-olive-muted"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-olive text-xs font-bold text-white">
          {initials || "U"}
        </span>
        <span className={`hidden text-sm font-semibold sm:inline ${transparent ? "text-white" : "text-brown"}`}>
          Mi cuenta
        </span>
        <ChevronDownIcon className={`h-4 w-4 ${transparent ? "text-white" : "text-brown-icon"}`} />
      </summary>
      <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-lg">
        <div className="border-b border-border-soft bg-cream-card px-4 py-3">
          <p className="text-sm font-semibold text-stone-800">{name}</p>
          <p className="text-xs capitalize text-stone-500">{role === "buyer" ? "Comprador" : role}</p>
        </div>
        <nav className="grid py-1 text-sm text-stone-700">
          {role === "buyer" && (
            <Link className="px-4 py-2 hover:bg-olive-muted" href="/cuenta">
              Mi cuenta
            </Link>
          )}
          {role === "seller" && (
            <Link className="px-4 py-2 hover:bg-olive-muted" href="/seller">
              Panel del productor
            </Link>
          )}
          {role === "admin" && (
            <Link className="px-4 py-2 hover:bg-olive-muted" href="/admin">
              Panel administrador
            </Link>
          )}
          <Link className="px-4 py-2 hover:bg-olive-muted" href={role === "seller" ? "/seller/orders" : "/orders"}>
            {role === "seller" ? "Mis ventas" : "Mis pedidos"}
          </Link>
          <Link className="px-4 py-2 hover:bg-olive-muted" href="/favoritos">
            Favoritos{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="border-t border-border-soft px-4 py-2 text-left text-stone-700 hover:bg-olive-muted"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </details>
  );
}
