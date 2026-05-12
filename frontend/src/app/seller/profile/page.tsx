import { ApiPanel } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function SellerProfilePage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Perfil de productor</h1>
          <p className="mt-1 text-sm text-stone-600">Información pública del vendedor/productor.</p>
        </div>
        <ApiPanel title="Perfil actual" endpoint="/seller/profile" emptyText="No hay perfil cargado." />
        <ApiPanel title="Presencia digital preparada" endpoint="/seller/social-links" emptyText="No hay enlaces sociales cargados." />
      </main>
    </>
  );
}
