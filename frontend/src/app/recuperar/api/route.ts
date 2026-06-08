import { NextResponse } from "next/server";

const INTERNAL_API_BASE =
  process.env.INTERNAL_API_BASE_URL ??
  (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://backend:8000/api/v1");

function apiUrl(path: string) {
  return `${INTERNAL_API_BASE.replace(/\/$/, "")}${path}`;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Solicitud invalida." }, { status: 422 });
  }

  const endpoint = "token" in payload ? "/auth/password/reset" : "/auth/password/forgot";

  try {
    const response = await fetch(apiUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Password recovery proxy failed.", error);

    return NextResponse.json(
      { message: "No pudimos conectar con el servidor. Intenta nuevamente en unos segundos." },
      { status: 502 },
    );
  }
}
