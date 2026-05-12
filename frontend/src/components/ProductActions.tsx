"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export function ProductActions({ productId }: { productId: number }) {
  const [message, setMessage] = useState("");

  async function addToCart() {
    const token = localStorage.getItem("mercado_token");
    if (!token) {
      setMessage("Ingresá primero para agregar productos al carrito.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      setMessage(response.ok ? "Producto agregado al carrito." : "No se pudo agregar el producto.");
    } catch {
      setMessage("No se pudo conectar con la API local.");
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
