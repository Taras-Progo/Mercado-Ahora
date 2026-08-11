<?php

namespace App\Contracts;

interface PaymentGateway
{
    /** @return array<string, mixed> */
    public function createPreference(array $payload, string $idempotencyKey): array;

    /** @return array<string, mixed> */
    public function getPayment(string $paymentId): array;

    /** @return array<int, array<string, mixed>> */
    public function searchPaymentsByExternalReference(string $reference): array;
}