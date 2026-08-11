import { Suspense } from "react";
import { PaymentReturn } from "@/components/payments/PaymentReturn";

export default function FailedPaymentPage() {
  return <Suspense fallback={null}><PaymentReturn initialView="failed" /></Suspense>;
}
