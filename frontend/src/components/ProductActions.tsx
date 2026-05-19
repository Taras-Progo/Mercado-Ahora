"use client";

import { useState } from "react";
import { parseApiMessage, useAuth } from "@/components/AuthProvider";

export function ProductActions({ productId }: { productId: number }) {
  const [message, setMessage] = useState("");
  const { authFetch, token, user } = useAuth();

  async function addToCart() {
    if (!token) {
      setMessage("Ingresa primero para agregar productos al carrito.");
      return;
    }

    if (user?.role === "admin") {
      setMessage("Las cuentas admin no compran productos.");
      return;
    }

    try {
      const response = await authFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      setMessage(response.ok ? "Producto agregado al carrito." : await parseApiMessage(response));
    } catch {
      setMessage("No se pudo conectar con la API.");
    }
  }

  return (
    <div className="grid gap-2">
      <button onClick={addToCart} className="rounded-md bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900">
        Agregar al carrito
      </button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </div>
  );
}
