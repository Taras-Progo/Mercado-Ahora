<?php

namespace App\Contracts;

interface PaymentGateway
{
    /** @return array<string, mixed> */
    public function createPreference(array $payload, string $idempotencyKey): array;
}
