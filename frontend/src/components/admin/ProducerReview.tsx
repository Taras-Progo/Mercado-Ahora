"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import {
  CheckCircleIcon,
  ClockIcon,
  LeafIcon,
  MapPinIcon,
  SearchIcon,
  XCircleIcon,
} from "@/components/ui/Icons";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type Producer = {
  id: number;
  business_name: string;
  status: "pending" | "approved" | "rejected";
  province?: string;
  city?: string;
  description?: string;
  user?: { name?: string; email?: string };
  created_at?: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const filters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobados" },
  { id: "rejected", label: "Rechazados" },
];

const statusStyles: Record<Producer["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<Producer["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function ProducerReview() {
  const { token, user } = useAuth();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/producers`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) {
        setFeedback({ tone: "error", text: "No se pudo cargar el listado de productores." });
        setProducers([]);
        return;
      }
      const json = await response.json();
      const list: Producer[] = json.data ?? json;
      setProducers(Array.isArray(list) ? list : []);
      setFeedback(null);
    } catch {
      setFeedback({ tone: "error", text: "No se pudo conectar con la API." });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Sync React state with external system (admin producers API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function updateStatus(id: number, status: "approved" | "rejected") {
    if (!token) return;
    setFeedback({ tone: "info", text: "Actualizando estado..." });
    try {
      const response = await fetch(`${API_BASE}/admin/producers/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setFeedback({ tone: "error", text: "No se pudo actualizar el estado." });
        return;
      }
      setFeedback({
        tone: "success",
        text: status === "approved" ? "Productor aprobado." : "Productor rechazado.",
      });
      await load();
    } catch {
      setFeedback({ tone: "error", text: "No se pudo conectar con la API." });
    }
  }

  const filtered = producers.filter((producer) => {
    if (filter !== "all" && producer.status !== filter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      producer.business_name?.toLowerCase().includes(term) ||
      producer.user?.email?.toLowerCase().includes(term) ||
      `${producer.city} ${producer.province}`.toLowerCase().includes(term)
    );
  });

  const counts = {
    all: producers.length,
    pending: producers.filter((p) => p.status === "pending").length,
    approved: producers.filter((p) => p.status === "approved").length,
    rejected: producers.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Panel administrador</h1>
        <p className="text-sm text-stone-600">
          Revisá y aprobá las postulaciones de productores para que puedan publicar en Mercado Ahora.
        </p>
      </header>

      <EmailVerificationBanner email={user?.email} verified={Boolean(user?.email_verified_at)} />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Total" value={counts.all} icon={<LeafIcon className="h-4 w-4" />} />
        <StatTile label="Pendientes" value={counts.pending} icon={<ClockIcon className="h-4 w-4" />} accent="amber" />
        <StatTile
          label="Aprobados"
          value={counts.approved}
          icon={<CheckCircleIcon className="h-4 w-4" />}
          accent="emerald"
        />
        <StatTile label="Rechazados" value={counts.rejected} icon={<XCircleIcon className="h-4 w-4" />} accent="red" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                filter === option.id
                  ? "bg-olive-dark text-white"
                  : "border border-border-soft bg-white text-stone-700 hover:border-olive hover:text-olive-dark"
              }`}
            >
              {option.label}{" "}
              <span className={filter === option.id ? "text-white/70" : "text-stone-400"}>
                ({counts[option.id]})
              </span>
            </button>
          ))}
        </div>
        <label className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, email o ciudad"
            className="w-full rounded-full border border-border-soft bg-cream-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-olive focus:ring-2 focus:ring-olive/20"
          />
        </label>
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

      <section className="grid gap-4">
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((producer) => (
            <ProducerCard key={producer.id} producer={producer} onUpdate={updateStatus} />
          ))
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  accent = "olive",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "olive" | "amber" | "emerald" | "red";
}) {
  const colors: Record<string, string> = {
    olive: "bg-olive-muted text-olive-dark",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${colors[accent]}`}>{icon}</span>
      </div>
      <p className="mt-2 font-serif text-3xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

function ProducerCard({
  producer,
  onUpdate,
}: {
  producer: Producer;
  onUpdate: (id: number, status: "approved" | "rejected") => void;
}) {
  const initials = producer.business_name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="grid gap-4 rounded-2xl border border-border-soft bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-muted text-base font-bold text-olive-dark">
        {initials}
      </span>

      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-stone-900">{producer.business_name}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[producer.status]}`}>
            {statusLabels[producer.status]}
          </span>
        </div>
        <p className="text-xs text-stone-500">{producer.user?.email}</p>
        <div className="flex flex-wrap gap-3 text-xs text-stone-500">
          {(producer.city || producer.province) && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {[producer.city, producer.province].filter(Boolean).join(", ")}
            </span>
          )}
          {producer.created_at && <span>Postulación: {new Date(producer.created_at).toLocaleDateString("es-AR")}</span>}
        </div>
        {producer.description && <p className="mt-1 text-sm text-stone-600">{producer.description}</p>}
      </div>

      {producer.status === "pending" ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onUpdate(producer.id, "rejected")}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <XCircleIcon className="h-4 w-4" />
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => onUpdate(producer.id, "approved")}
            className="inline-flex items-center gap-1.5 rounded-full bg-olive-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-olive"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Aprobar
          </button>
        </div>
      ) : (
        <div className="text-right text-xs text-stone-500">Decisión registrada</div>
      )}
    </article>
  );
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl border border-border-soft bg-white" />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border-soft bg-cream-card p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-olive">
        <LeafIcon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-stone-800">No hay productores en esta vista</p>
      <p className="text-xs text-stone-500">Probá con otro filtro o cuando lleguen nuevas postulaciones aparecerán acá.</p>
    </div>
  );
}
