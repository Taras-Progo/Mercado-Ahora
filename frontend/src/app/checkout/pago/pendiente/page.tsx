import { Suspense } from "react";
import { PaymentReturn } from "@/components/payments/PaymentReturn";

export default function PendingPaymentPage() {
  return <Suspense fallback={null}><PaymentReturn initialView="pending" /></Suspense>;
}
