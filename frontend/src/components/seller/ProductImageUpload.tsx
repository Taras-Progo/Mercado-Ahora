"use client";

import { useCallback, useRef, useState } from "react";
import type { ProductImage } from "@/lib/api";
import { deleteProductImage, imageUrl, updateProductImage, uploadProductImage } from "@/lib/api";
import { StarIcon, XCircleIcon } from "@/components/ui/Icons";

type Props = {
  productId: number;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
};

export function ProductImageUpload({ productId, images, onImagesChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar 5 MB.");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const isPrimary = images.length === 0;
        const newImage = await uploadProductImage(productId, file, isPrimary);
        onImagesChange([...images, newImage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir la imagen.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [productId, images, onImagesChange],
  );

  const handleDelete = useCallback(
    async (imageId: number) => {
      try {
        await deleteProductImage(productId, imageId);
        onImagesChange(images.filter((img) => img.id !== imageId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar la imagen.");
      }
    },
    [productId, images, onImagesChange],
  );

  const handleSetPrimary = useCallback(
    async (imageId: number) => {
      try {
        await updateProductImage(productId, imageId, { is_primary: true });
        onImagesChange(
          images.map((img) => ({
            ...img,
            is_primary: img.id === imageId,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cambiar imagen principal.");
      }
    },
    [productId, images, onImagesChange],
  );

  const emptySlots = Math.max(0, 4 - images.length);

  return (
    <div>
      {error && <p className="mb-3 text-xs font-medium text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border-soft"
          >
            <img
              src={imageUrl(image.path)}
              alt={image.alt_text ?? "Imagen del producto"}
              className="h-full w-full object-cover"
            />
            {(image.is_primary || (index === 0 && !images.some((i) => i.is_primary))) && (
              <span className="absolute left-2 top-2 rounded-full bg-olive-dark px-2 py-0.5 text-[10px] font-semibold text-white">
                Principal
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSetPrimary(image.id)}
              title={image.is_primary ? "Imagen principal" : "Marcar como principal"}
              className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition ${
                image.is_primary
                  ? "bg-amber-400 text-white"
                  : "bg-white/90 text-stone-400 hover:text-amber-500"
              }`}
            >
              <StarIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              title="Eliminar imagen"
              className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm hover:bg-red-50"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < 5 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-soft text-stone-400 transition hover:border-olive hover:bg-olive-muted/40 hover:text-olive">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
              {images.length === 0 ? (
                <>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </>
              ) : (
                <path d="M12 5v14M5 12h14" />
              )}
            </svg>
            <span className="text-center text-[11px] font-medium leading-tight">
              {uploading
                ? "Subiendo..."
                : images.length === 0
                  ? "Imagen principal (Obligatoria)"
                  : "Agregar foto"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-soft/60 text-stone-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-[11px] font-medium">Agregar foto</span>
          </div>
        ))}
      </div>
    </div>
  );
}