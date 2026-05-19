import { Header } from "@/components/Header";
import { RoleDashboard } from "@/components/RoleDashboard";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-4xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Panel de acceso</h1>
          <p className="mt-1 text-sm text-stone-600">Entrada principal segun el rol de la cuenta.</p>
        </div>
        <RoleDashboard />
      </main>
    </>
  );
}
