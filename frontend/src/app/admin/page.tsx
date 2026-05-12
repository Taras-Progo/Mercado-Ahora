import { AdminReviewPanel } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Administración</h1>
          <p className="mt-1 text-sm text-stone-600">
            Revisión de productores, productos y validación manual de EcoScore.
          </p>
        </div>
        <AdminReviewPanel />
      </main>
    </>
  );
}
