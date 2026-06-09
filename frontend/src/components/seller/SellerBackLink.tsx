import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/Icons";

export function SellerBackLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/seller"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brown transition hover:text-olive-dark ${className}`}
    >
      <ChevronRightIcon className="h-4 w-4 rotate-180" />
      Volver al panel del productor
    </Link>
  );
}
