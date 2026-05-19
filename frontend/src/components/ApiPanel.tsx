"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { parseApiMessage, useAuth } from "@/components/AuthProvider";

type ApiPanelProps = {
  title: string;
  endpoint: string;
  emptyText: string;
};

export function ApiPanel({ title, endpoint, emptyText }: ApiPanelProps) {
  const [data, setData] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const { authFetch, token } = useAuth();

  const load = useCallback(async () => {
    if (!token) {
      setMessage("Ingresa primero para ver esta seccion.");
      return;
    }

    try {
      const response = await authFetch(endpoint);
      const json = await response.json();
      setData(json.data ?? json);
      setMessage(response.ok ? "" : json.message ?? emptyText);
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }, [authFetch, emptyText, endpoint, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-stone-950">{title}</h2>
        <button onClick={load} className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
          Actualizar
        </button>
      </div>
      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
      {data ? (
        <pre className="mt-4 max-h-[520px] overflow-auto rounded-md bg-stone-950 p-4 text-xs leading-5 text-stone-50">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        !message && <p className="mt-4 text-sm text-stone-600">{emptyText}</p>
      )}
    </section>
  );
}

export function SellerProductForm() {
  const [message, setMessage] = useState("");
  const { authFetch, token } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setMessage("Ingresa como vendedor para crear productos.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const body = {
      category_id: Number(form.get("category_id")),
      name: form.get("name"),
      description: form.get("description"),
      price_cents: Number(form.get("price_cents")),
      stock: Number(form.get("stock")),
      unit: form.get("unit"),
      ecoscore_points: Number(form.get("ecoscore_points")),
      status: "active",
    };

    try {
      const response = await authFetch("/seller/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMessage(response.ok ? "Producto creado." : await parseApiMessage(response));
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Crear producto</h2>
      <input name="name" placeholder="Nombre" className="rounded-md border border-stone-300 px-3 py-2" required />
      <input name="category_id" placeholder="ID categoria" type="number" min="1" className="rounded-md border border-stone-300 px-3 py-2" required />
      <textarea name="description" placeholder="Descripcion" className="min-h-24 rounded-md border border-stone-300 px-3 py-2" />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="price_cents" placeholder="Precio en centavos" type="number" min="0" className="rounded-md border border-stone-300 px-3 py-2" required />
        <input name="stock" placeholder="Stock" type="number" min="0" className="rounded-md border border-stone-300 px-3 py-2" required />
        <input name="unit" placeholder="Unidad" className="rounded-md border border-stone-300 px-3 py-2" defaultValue="unidad" />
      </div>
      <input name="ecoscore_points" placeholder="EcoScore 0-100" type="number" min="0" max="100" className="rounded-md border border-stone-300 px-3 py-2" />
      <button className="rounded-md bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900">Guardar producto</button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </form>
  );
}

export function SellerApplicationForm() {
  const [message, setMessage] = useState("");
  const { login } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"}/auth/register-seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setMessage(await parseApiMessage(response));
        return;
      }

      const json = await response.json();
      login(json.data.token, json.data.user);
      setMessage("Postulacion enviada. El perfil queda pendiente de aprobacion.");
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Postulacion de productor</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" placeholder="Nombre responsable" className="rounded-md border border-stone-300 px-3 py-2" required />
        <input name="email" type="email" placeholder="Email" className="rounded-md border border-stone-300 px-3 py-2" required />
        <input name="password" type="password" minLength={8} placeholder="Contrasena" className="rounded-md border border-stone-300 px-3 py-2" required />
        <input name="business_name" placeholder="Nombre del emprendimiento" className="rounded-md border border-stone-300 px-3 py-2" required />
        <input name="province" placeholder="Provincia" className="rounded-md border border-stone-300 px-3 py-2" />
        <input name="city" placeholder="Ciudad" className="rounded-md border border-stone-300 px-3 py-2" />
        <input name="production_origin" placeholder="Produccion propia o reventa" className="rounded-md border border-stone-300 px-3 py-2" />
        <input name="production_method" placeholder="Natural, artesanal, agroecologico..." className="rounded-md border border-stone-300 px-3 py-2" />
        <input name="production_since" placeholder="Hace cuanto produce" className="rounded-md border border-stone-300 px-3 py-2" />
        <input name="product_types" placeholder="Tipos de productos" className="rounded-md border border-stone-300 px-3 py-2" />
      </div>
      <textarea name="story" placeholder="Historia del emprendimiento" className="min-h-24 rounded-md border border-stone-300 px-3 py-2" />
      <textarea name="digital_presence_notes" placeholder="Fotos del proceso, Instagram, WhatsApp Business, sitio web u otra presencia digital" className="min-h-20 rounded-md border border-stone-300 px-3 py-2" />
      <button className="rounded-md bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900">Enviar postulacion</button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </form>
  );
}

export function CartGroups() {
  type CartItemPreview = {
    product?: {
      producer_profile?: { business_name?: string };
      producerProfile?: { business_name?: string };
    };
  };

  const [groups, setGroups] = useState<Record<string, CartItemPreview[]>>({});
  const [message, setMessage] = useState("");
  const { authFetch, token } = useAuth();

  const load = useCallback(async () => {
    if (!token) {
      setMessage("Ingresa primero para ver el carrito agrupado.");
      return;
    }

    try {
      const response = await authFetch("/cart");
      const json = await response.json();
      const items: CartItemPreview[] = json.data?.items ?? [];
      const nextGroups = items.reduce((acc: Record<string, CartItemPreview[]>, item) => {
        const producer = item.product?.producer_profile?.business_name ?? item.product?.producerProfile?.business_name ?? "Productor";
        acc[producer] = [...(acc[producer] ?? []), item];
        return acc;
      }, {});
      setGroups(nextGroups);
      setMessage(response.ok ? "" : json.message ?? "No se pudo cargar el carrito.");
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }, [authFetch, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-stone-950">Carrito agrupado por productor</h2>
        <button onClick={load} className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900">Actualizar</button>
      </div>
      {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}
      <div className="mt-4 grid gap-3">
        {Object.entries(groups).map(([producer, items]) => (
          <div key={producer} className="rounded-md bg-stone-50 p-3">
            <p className="font-bold text-emerald-900">{producer}</p>
            <p className="mt-1 text-sm text-stone-600">{items.length} producto(s). En checkout se generara un pedido separado para este productor.</p>
          </div>
        ))}
        {!message && Object.keys(groups).length === 0 && <p className="text-sm text-stone-600">Todavia no hay productos en el carrito.</p>}
      </div>
    </section>
  );
}

type ProducerReview = {
  id: number;
  business_name: string;
  status: string;
  province?: string;
  city?: string;
  story?: string;
  user?: { name?: string; email?: string };
};

export function ProducerApprovalPanel() {
  const [items, setItems] = useState<ProducerReview[]>([]);
  const [message, setMessage] = useState("");
  const { authFetch, token } = useAuth();

  const load = useCallback(async () => {
    if (!token) {
      setMessage("Ingresa como admin para revisar postulaciones.");
      return;
    }

    try {
      const response = await authFetch("/admin/producers");
      if (!response.ok) {
        setMessage(await parseApiMessage(response));
        return;
      }
      const json = await response.json();
      setItems(json.data ?? []);
      setMessage("");
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }, [authFetch, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateProducer(id: number, action: "approve" | "reject") {
    const body = action === "approve"
      ? { approval_notes: "Productor aprobado desde panel admin." }
      : { rejection_reason: "Postulacion rechazada desde panel admin." };

    try {
      const response = await authFetch(`/admin/producers/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setMessage(response.ok ? "Estado actualizado." : await parseApiMessage(response));
      if (response.ok) void load();
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-stone-950">Revision de productores</h2>
        <button onClick={load} className="rounded-md border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
          Actualizar
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}
      <div className="mt-4 grid gap-3">
        {items.map((producer) => (
          <article key={producer.id} className="rounded-md border border-stone-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-stone-950">{producer.business_name}</p>
                <p className="mt-1 text-sm text-stone-600">{producer.user?.email} - {producer.province ?? "Provincia pendiente"} - {producer.city ?? "Ciudad pendiente"}</p>
                <p className="mt-2 text-sm text-stone-600">{producer.story ?? "Historia pendiente."}</p>
              </div>
              <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold uppercase text-stone-700">{producer.status}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => void updateProducer(producer.id, "approve")} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white">
                Aprobar
              </button>
              <button onClick={() => void updateProducer(producer.id, "reject")} className="rounded-md border border-red-700 px-3 py-2 text-sm font-semibold text-red-800">
                Rechazar
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && !message && <p className="text-sm text-stone-600">No hay productores para revisar.</p>}
      </div>
    </section>
  );
}

export function AdminReviewPanel() {
  return (
    <div className="grid gap-5">
      <ProducerApprovalPanel />
      <ApiPanel title="Productos y EcoScore" endpoint="/admin/products" emptyText="Ingresa como admin para revisar productos y EcoScore." />
    </div>
  );
}
