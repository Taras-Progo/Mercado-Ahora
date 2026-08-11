import { Suspense } from "react";
import { PaymentReturn } from "@/components/payments/PaymentReturn";

export default function ApprovedPaymentPage() {
  return <Suspense fallback={null}><PaymentReturn initialView="approved" /></Suspense>;
}
