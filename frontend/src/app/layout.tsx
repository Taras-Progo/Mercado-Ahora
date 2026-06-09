import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mercadoahora.com.ar"),
  title: "Mercado Ahora",
  description: "Conectamos personas con productos reales. Apoyá a productores locales.",
  openGraph: {
    title: "Mercado Ahora",
    description: "Productos reales, productores locales y compras más conscientes.",
    url: "https://mercadoahora.com.ar",
    siteName: "Mercado Ahora",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/brand/mercado-ahora-logo.png",
        width: 1200,
        height: 630,
        alt: "Mercado Ahora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mercado Ahora",
    description: "Productos reales, productores locales y compras más conscientes.",
    images: ["/brand/mercado-ahora-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
