"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSellerProfile,
  getSellerSocialLinks,
  imageUrl,
  saveSellerProfile,
  saveSellerSocialLink,
  type ProducerProfile,
  type ProducerSocialLink,
  type SellerProfilePayload,
} from "@/lib/api";
import { CheckCircleIcon, LeafIcon, XCircleIcon } from "@/components/ui/Icons";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20 placeholder:text-stone-400";

const socialPlatforms = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "Ej: 5492664000000 o https://wa.me/5492664000000" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/tu-emprendimiento" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/tu-emprendimiento" },
  { key: "website", label: "Sitio web", placeholder: "https://tu-sitio.com" },
] as const;

type SocialKey = (typeof socialPlatforms)[number]["key"];

export function SellerProfileForm() {
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [links, setLinks] = useState<ProducerSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<SellerProfilePayload>({
    business_name: "",
    province: "",
    city: "",
    description: "",
    production_origin: "",
    production_method: "",
    production_since: "",
    product_types: "",
    production_practices: "",
    story: "",
    digital_presence_notes: "",
  });
  const [socialForm, setSocialForm] = useState<Record<SocialKey, string>>({
    whatsapp: "",
    instagram: "",
    facebook: "",
    website: "",
  });

  const hydrate = useCallback(async () => {
    setLoading(true);
    const [profileData, socialLinks] = await Promise.all([getSellerProfile(), getSellerSocialLinks()]);
    setProfile(profileData);
    setLinks(socialLinks);
    if (profileData) {
      setForm({
        business_name: profileData.business_name ?? "",
        province: profileData.province ?? "",
        city: profileData.city ?? "",
        description: profileData.description ?? "",
        production_origin: profileData.production_origin ?? "",
        production_method: profileData.production_method ?? "",
        production_since: profileData.production_since ?? "",
        product_types: profileData.product_types ?? "",
        production_practices: profileData.production_practices ?? "",
        story: profileData.story ?? "",
        digital_presence_notes: profileData.digital_presence_notes ?? "",
      });
    }
    setSocialForm((current) => {
      const next = { ...current };
      for (const item of socialLinks) {
        if (item.platform in next) {
          next[item.platform as SocialKey] = item.url;
        }
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void hydrate();
  }, [hydrate]);

  const completion = useMemo(() => {
    const fields: Array<keyof SellerProfilePayload> = [
      "business_name",
      "province",
      "city",
      "description",
      "production_origin",
      "production_method",
      "story",
    ];
    const completed = fields.filter((key) => String(form[key] ?? "").trim().length > 0).length;
    return Math.round((completed / fields.length) * 100);
  }, [form]);

  function updateField(name: keyof SellerProfilePayload, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateSocial(name: SocialKey, value: string) {
    setSocialForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.business_name.trim()) {
      setFeedback({ tone: "error", text: "El nombre del emprendimiento es obligatorio." });
      return;
    }

    setSaving(true);
    try {
      const saved = await saveSellerProfile(cleanPayload(form));
      const savedLinks: ProducerSocialLink[] = [];

      for (const platform of socialPlatforms) {
        const value = socialForm[platform.key].trim();
        if (!value) continue;
        savedLinks.push(
          await saveSellerSocialLink({
            platform: platform.key,
            url: normalizeSocialUrl(platform.key, value),
            is_visible: true,
          }),
        );
      }

      setProfile(saved);
      if (savedLinks.length > 0) {
        setLinks((current) => mergeLinks(current, savedLinks));
      }
      setFeedback({ tone: "success", text: "Perfil público actualizado correctamente." });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar el perfil.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-stone-500">Cargando perfil...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {feedback.tone === "success" ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
          ) : (
            <XCircleIcon className="h-5 w-5 shrink-0" />
          )}
          {feedback.text}
        </div>
      )}

      <section className="rounded-2xl border border-border-soft bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-dark">Perfil público</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900">Editar tu perfil público</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Estos datos ayudan a que los compradores conozcan tu emprendimiento, tu historia y tus canales de contacto.
            </p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-cream-card p-4 text-sm text-stone-600 md:w-64">
            <p className="font-semibold text-stone-800">Perfil completo</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-olive" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-2 text-xs">{completion}% completado</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-border-soft bg-white p-6 sm:grid-cols-2">
        <Field label="Nombre del emprendimiento" required>
          <input
            value={form.business_name}
            onChange={(event) => updateField("business_name", event.target.value)}
            className={inputClass}
            placeholder="Ej: Finca Raíces Verdes"
          />
        </Field>
        <Field label="Logo o foto principal">
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-border-soft bg-cream-card p-4">
            {profile?.logo_path ? (
              <img src={imageUrl(profile.logo_path)} alt="" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-olive">
                <LeafIcon className="h-6 w-6" />
              </span>
            )}
            <p className="text-xs leading-5 text-stone-500">
              Logo del emprendimiento se cargará en una mejora posterior. Podés completar el resto del perfil ahora.
            </p>
          </div>
        </Field>
        <Field label="Provincia">
          <input
            value={form.province}
            onChange={(event) => updateField("province", event.target.value)}
            className={inputClass}
            placeholder="Ej: San Luis"
          />
        </Field>
        <Field label="Ciudad">
          <input
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            className={inputClass}
            placeholder="Ej: Villa de Merlo"
          />
        </Field>
        <Field label="Descripción del emprendimiento" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Contá qué producís, cómo trabajás y qué te diferencia."
          />
        </Field>
        <Field label="Historia del productor" className="sm:col-span-2">
          <textarea
            value={form.story}
            onChange={(event) => updateField("story", event.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Compartí la historia del emprendimiento y el camino recorrido."
          />
        </Field>
        <Field label="Origen / lugar de producción">
          <input
            value={form.production_origin}
            onChange={(event) => updateField("production_origin", event.target.value)}
            className={inputClass}
            placeholder="Ej: Sierra de los Comechingones"
          />
        </Field>
        <Field label="Método de producción">
          <input
            value={form.production_method}
            onChange={(event) => updateField("production_method", event.target.value)}
            className={inputClass}
            placeholder="Ej: artesanal, agroecológico, familiar"
          />
        </Field>
        <Field label="Tipos de productos">
          <input
            value={form.product_types}
            onChange={(event) => updateField("product_types", event.target.value)}
            className={inputClass}
            placeholder="Ej: miel, conservas, cosmética natural"
          />
        </Field>
        <Field label="Prácticas de producción">
          <input
            value={form.production_practices}
            onChange={(event) => updateField("production_practices", event.target.value)}
            className={inputClass}
            placeholder="Ej: sin químicos, producción responsable"
          />
        </Field>
        <Field label="Información pública adicional" className="sm:col-span-2">
          <textarea
            value={form.digital_presence_notes}
            onChange={(event) => updateField("digital_presence_notes", event.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
            placeholder="Información que querés que los compradores sepan antes de contactarte."
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-border-soft bg-white p-6">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Contacto y redes</h2>
        <p className="mt-1 text-sm text-stone-600">
          Estos enlaces pueden mostrarse en tu perfil público para facilitar consultas de compradores.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {socialPlatforms.map((platform) => (
            <Field key={platform.key} label={platform.label}>
              <input
                value={socialForm[platform.key]}
                onChange={(event) => updateSocial(platform.key, event.target.value)}
                className={inputClass}
                placeholder={platform.placeholder}
              />
            </Field>
          ))}
        </div>
        {links.length > 0 && (
          <p className="mt-4 text-xs text-stone-500">
            Redes guardadas: {links.map((link) => link.platform).join(", ")}.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar perfil público"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid content-start gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-stone-800">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function cleanPayload(payload: SellerProfilePayload): SellerProfilePayload {
  return {
    business_name: payload.business_name.trim(),
    province: payload.province?.trim() || undefined,
    city: payload.city?.trim() || undefined,
    description: payload.description?.trim() || undefined,
    production_practices: payload.production_practices?.trim() || undefined,
    production_origin: payload.production_origin?.trim() || undefined,
    product_types: payload.product_types?.trim() || undefined,
    production_method: payload.production_method?.trim() || undefined,
    production_since: payload.production_since?.trim() || undefined,
    story: payload.story?.trim() || undefined,
    digital_presence_notes: payload.digital_presence_notes?.trim() || undefined,
  };
}

function normalizeSocialUrl(platform: SocialKey, value: string) {
  if (platform === "whatsapp" && !value.startsWith("http")) {
    const digits = value.replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  }

  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }

  return value;
}

function mergeLinks(current: ProducerSocialLink[], saved: ProducerSocialLink[]) {
  const map = new Map(current.map((item) => [item.platform, item]));
  for (const item of saved) {
    map.set(item.platform, item);
  }
  return Array.from(map.values());
}
