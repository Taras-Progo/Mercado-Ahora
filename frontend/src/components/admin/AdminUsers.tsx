"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminUser } from "@/lib/api";
import { getAdminUsers, resetAdminUserPassword, statusLabel } from "@/lib/api";
import { CheckCircleIcon, SearchIcon, ShieldCheckIcon, UsersIcon, XCircleIcon } from "@/components/ui/Icons";

const roleLabels: Record<AdminUser["role"], string> = {
  admin: "Admin",
  buyer: "Comprador",
  seller: "Productor",
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAdminUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [query, users]);

  const startReset = (user: AdminUser) => {
    setSelected(user);
    setPassword("");
    setPasswordConfirmation("");
    setFeedback(null);
  };

  const submitReset = async () => {
    if (!selected) return;
    if (password.length < 8) {
      setFeedback({ tone: "error", text: "La contraseña temporal debe tener al menos 8 caracteres." });
      return;
    }
    if (password !== passwordConfirmation) {
      setFeedback({ tone: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    setBusy(true);
    setFeedback({ tone: "info", text: "Restableciendo contraseña..." });
    try {
      const result = await resetAdminUserPassword(selected.id, password, passwordConfirmation);
      setFeedback({ tone: "success", text: result.message });
      setSelected(null);
      setPassword("");
      setPasswordConfirmation("");
      await load();
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo restablecer la contraseña.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-stone-500">Cargando usuarios...</div>;
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Usuarios" value={users.length} icon={<UsersIcon className="h-4 w-4" />} />
        <Stat label="Activos" value={users.filter((user) => user.status === "active").length} icon={<CheckCircleIcon className="h-4 w-4" />} />
        <Stat label="Productores" value={users.filter((user) => user.role === "seller").length} icon={<ShieldCheckIcon className="h-4 w-4" />} />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Herramienta administrativa de respaldo para restablecer contraseñas de usuarios activos. Al guardar, se cierran sus sesiones existentes.
      </div>

      {feedback && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-border-soft bg-cream-card text-stone-600"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <label className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, email, rol o estado"
          className="w-full rounded-full border border-border-soft bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
        />
      </label>

      {selected && (
        <section className="rounded-2xl border border-border-soft bg-white p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Restablecer contraseña</p>
              <p className="text-xs text-stone-500">{selected.name} - {selected.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1 self-start rounded-full px-3 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-cream-card"
            >
              <XCircleIcon className="h-4 w-4" />
              Cancelar
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nueva contraseña temporal"
              className="rounded-full border border-border-soft px-4 py-2.5 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="Confirmar contraseña"
              className="rounded-full border border-border-soft px-4 py-2.5 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <button
              type="button"
              onClick={submitReset}
              disabled={busy}
              className="rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
            >
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </section>
      )}

      <div className="overflow-hidden rounded-2xl border border-border-soft bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-soft bg-cream-card text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Productor</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filtered.map((user) => {
                const profile = user.producer_profile ?? user.producerProfile;
                const canReset = user.status === "active";
                return (
                  <tr key={user.id} className="transition hover:bg-cream-card/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-800">{user.name}</p>
                      <p className="text-xs text-stone-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{roleLabels[user.role] ?? user.role}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${canReset ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
                        {statusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {profile?.business_name ? `${profile.business_name} (${statusLabel(profile.status)})` : "-"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => startReset(user)}
                        disabled={!canReset}
                        className="rounded-full border border-border-soft px-4 py-2 text-xs font-semibold text-olive-dark transition hover:border-olive hover:bg-olive-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Reset temporal
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-olive-muted text-olive-dark">{icon}</span>
      </div>
      <p className="mt-2 font-serif text-3xl font-bold text-stone-900">{value}</p>
    </div>
  );
}
