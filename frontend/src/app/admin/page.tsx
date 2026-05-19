import { AdminReviewPanel } from "@/components/ApiPanel";
import { ProtectedArea } from "@/components/AuthProvider";
import { Header } from "@/components/Header";

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Administracion</h1>
          <p className="mt-1 text-sm text-stone-600">Revision de productores, productos y validacion manual de EcoScore.</p>
        </div>
        <ProtectedArea roles={["admin"]}>
          <AdminReviewPanel />
        </ProtectedArea>
      </main>
    </>
  );
}
