import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <PagePlaceholder
            eyebrow="Centro de ayuda"
            title="Ayuda"
            description="Estamos preparando el centro de soporte. Mientras tanto, las consultas operativas pueden coordinarse con administracion."
            cta={{ label: "Volver al inicio", href: "/" }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
