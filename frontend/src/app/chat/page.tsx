import { ApiPanel } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function ChatPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Chat básico</h1>
          <p className="mt-1 text-sm text-stone-600">Phase 1 usa actualización ligera. Ofertas y contraofertas quedan preparadas para futuro.</p>
        </div>
        <ApiPanel title="Conversaciones" endpoint="/conversations" emptyText="No hay conversaciones todavía." />
      </main>
    </>
  );
}
