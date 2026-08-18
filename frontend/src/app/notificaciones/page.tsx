"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BellIcon } from "@/components/ui/Icons";
import type { AppNotification } from "@/lib/api";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";

export default function NotificationsPage() {
  return (
    <RoleGuard roles={["buyer", "seller", "admin"]}>
      <NotificationsContent />
    </RoleGuard>
  );
}

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await getNotifications());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function openNotification(notification: AppNotification) {
    if (!notification.read_at) {
      await markNotificationRead(notification.id);
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)),
      );
    }
    router.push(notification.data.url || "/");
  }

  async function readAll() {
    await markAllNotificationsRead();
    const timestamp = new Date().toISOString();
    setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at || timestamp })));
  }

  const unread = notifications.filter((item) => !item.read_at).length;

  return (
    <>
      <SiteHeader />
      <main className="min-h-[65vh] bg-background py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Notificaciones</h1>
              <p className="mt-1 text-sm text-brown-muted">Compras, ventas y devoluciones importantes.</p>
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => void readAll()} className="text-sm font-semibold text-olive-dark hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          {loading ? (
            <p className="py-16 text-center text-sm text-stone-500">Cargando notificaciones...</p>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button type="button" onClick={() => void load()} className="mt-2 font-semibold underline">Reintentar</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border-soft bg-white p-10 text-center">
              <BellIcon className="mx-auto h-10 w-10 text-stone-300" />
              <p className="mt-3 text-sm font-semibold text-stone-700">No tenés notificaciones todavía.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border-soft bg-white">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`flex w-full gap-3 border-b border-border-soft p-5 text-left transition last:border-b-0 hover:bg-olive-muted ${notification.read_at ? "bg-white" : "bg-emerald-50/60"}`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read_at ? "bg-stone-300" : "bg-olive"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{notification.data.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-brown-muted">{notification.data.message}</span>
                    <span className="mt-2 block text-xs text-stone-400">
                      {new Date(notification.created_at).toLocaleString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
