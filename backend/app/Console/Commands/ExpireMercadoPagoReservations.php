<?php

namespace App\Console\Commands;

use App\Contracts\PaymentGateway;
use App\Models\PaymentIntent;
use App\Services\Payments\MercadoPagoPaymentProcessor;
use Illuminate\Console\Command;
use Throwable;

class ExpireMercadoPagoReservations extends Command
{
    protected $signature = 'payments:expire-reservations {--limit=100}';
    protected $description = 'Verifica Mercado Pago y libera reservas de stock vencidas.';

    public function handle(PaymentGateway $gateway, MercadoPagoPaymentProcessor $processor): int
    {
        $intents = PaymentIntent::query()
            ->where('provider', 'mercado_pago')
            ->whereIn('status', ['creating', 'preference_created', 'pending'])
            ->where('expires_at', '<=', now())
            ->whereHas('reservations', fn ($query) => $query->where('status', 'active'))
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get();

        foreach ($intents as $intent) {
            try {
                $payments = $gateway->searchPaymentsByExternalReference((string) $intent->internal_reference);
                $approved = collect($payments)->first(fn (array $payment) => ($payment['status'] ?? null) === 'approved');

                if ($approved) {
                    $processor->processProviderPayment($approved, 'scheduler_sync');
                    continue;
                }

                $processor->expire($intent, 'scheduler');
            } catch (Throwable $exception) {
                report($exception);
                $intent->update([
                    'processing_error' => 'No se pudo verificar el pago antes de liberar la reserva.',
                    'last_synced_at' => now(),
                ]);
                $this->warn('No se pudo verificar '.$intent->internal_reference.'. Se mantiene la reserva para reintentar.');
            }
        }

        return self::SUCCESS;
    }
}