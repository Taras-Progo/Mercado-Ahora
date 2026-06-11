"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { addFavorite, getFavoriteIds, removeFavorite } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

type FavoritesContextValue = {
  favoriteIds: number[];
  favoriteCount: number;
  lastError: string | null;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number, redirectPath?: string) => Promise<boolean | null>;
  refreshFavorites: () => Promise<void>;
  clearError: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshFavorites = useCallback(async () => {
    if (!ready || !user || user.role === "admin") {
      setFavoriteIds([]);
      return;
    }

    const ids = await getFavoriteIds();
    setFavoriteIds(ids);
  }, [ready, user]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!ready || !user || user.role === "admin") {
        setFavoriteIds([]);
        return;
      }

      try {
        const ids = await getFavoriteIds();
        if (!cancelled) {
          setFavoriteIds(ids);
          setLastError(null);
        }
      } catch {
        if (!cancelled) setFavoriteIds([]);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  const isFavorite = useCallback((productId: number) => favoriteIds.includes(productId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (productId: number, redirectPath?: string) => {
      if (!ready || !user) {
        const currentPath =
          redirectPath ??
          (typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/favoritos");
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return null;
      }

      if (user.role === "admin") {
        setLastError("Los administradores no pueden guardar favoritos.");
        return null;
      }

      const wasFavorite = favoriteIds.includes(productId);
      setLastError(null);
      setFavoriteIds((current) =>
        wasFavorite
          ? current.filter((id) => id !== productId)
          : current.includes(productId)
            ? current
            : [...current, productId],
      );

      try {
        if (wasFavorite) {
          await removeFavorite(productId);
        } else {
          await addFavorite(productId);
        }

        return !wasFavorite;
      } catch (error) {
        setFavoriteIds((current) =>
          wasFavorite
            ? current.includes(productId)
              ? current
              : [...current, productId]
            : current.filter((id) => id !== productId),
        );
        setLastError(error instanceof Error ? error.message : "No pudimos actualizar tus favoritos.");
        return wasFavorite;
      }
    },
    [favoriteIds, ready, router, user],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      favoriteCount: favoriteIds.length,
      lastError,
      isFavorite,
      toggleFavorite,
      refreshFavorites,
      clearError: () => setLastError(null),
    }),
    [favoriteIds, isFavorite, lastError, refreshFavorites, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside <FavoritesProvider>");
  }
  return context;
}
