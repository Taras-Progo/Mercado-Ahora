import { SellerApplicationForm } from "@/components/ApiPanel";
import { Header } from "@/components/Header";

export default function SellerApplyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-4xl gap-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">Postulación de productor</h1>
          <p className="mt-1 text-sm text-stone-600">
            El productor queda en estado pending hasta que administración revise su historia, producción y presencia digital.
          </p>
        </div>
        <SellerApplicationForm />
      </main>
    </>
  );
}
