import { AuthPanel } from "@/components/AuthPanel";
import { Header } from "@/components/Header";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-md gap-5 px-4 py-10">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Crear cuenta comprador</h1>
          <p className="mt-1 text-sm text-stone-600">El rol vendedor se habilita desde el flujo de productor.</p>
        </div>
        <AuthPanel mode="register" />
      </main>
    </>
  );
}
