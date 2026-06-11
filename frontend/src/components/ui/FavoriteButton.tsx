"use client";

import { MouseEvent, useState } from "react";
import { HeartFilledIcon, HeartIcon } from "@/components/ui/Icons";
import { useFavorites } from "@/components/FavoritesProvider";

type FavoriteButtonProps = {
  productId: number;
  redirectPath?: string;
  variant?: "icon" | "pill";
  className?: string;
  showError?: boolean;
};

export function FavoriteButton({
  productId,
  redirectPath,
  variant = "icon",
  className = "",
  showError = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const favorited = isFavorite(productId);
  const label = favorited ? "Quitar de favoritos" : "Agregar a favoritos";

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    setPending(true);
    setError("");

    const result = await toggleFavorite(productId, redirectPath);
    if (result !== null && result === favorited) {
      setError("No pudimos actualizar tus favoritos.");
    }

    setPending(false);
  }

  if (variant === "pill") {
    return (
      <div className={className}>
        <button
          type="button"
          aria-label={label}
          aria-pressed={favorited}
          disabled={pending}
          onClick={handleClick}
          className={`flex w-full items-center justify-center gap-2.5 rounded-full border px-6 py-3 text-sm font-semibold transition disabled:opacity-60 ${
            favorited
              ? "border-olive bg-olive-muted text-olive-dark hover:bg-olive-muted/80"
              : "border-border-soft bg-white text-brown-muted hover:border-brown-icon/50 hover:text-foreground"
          }`}
        >
          {favorited ? <HeartFilledIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
          {pending ? "Guardando..." : label}
        </button>
        {showError && error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={favorited}
        disabled={pending}
        onClick={handleClick}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white disabled:opacity-60 ${
          favorited ? "text-olive" : "text-brown-icon hover:text-olive"
        }`}
      >
        {favorited ? <HeartFilledIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
      </button>
      {showError && error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
