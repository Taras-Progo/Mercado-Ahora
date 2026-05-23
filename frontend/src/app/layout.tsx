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
  title: "Mercado Ahora",
  description: "Conectamos personas con productos reales. Apoyá a productores locales.",
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
