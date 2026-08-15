<?php

namespace App\Console\Commands;

use App\Models\PaymentIntent;
use App\Services\Payments\MercadoPagoPaymentReconciler;
use Illuminate\Console\Command;
use Throwable;

class SyncMercadoPagoPayments extends Command
{
    protected $signature = 'payments:sync-mercado-pago {--limit=100}';
    protected $description = 'Sincroniza pagos pendientes con Mercado Pago.';

    public function handle(MercadoPagoPaymentReconciler $reconciler): int
    {
        $intents = PaymentIntent::query()
            ->where('provider', 'mercado_pago')
            ->whereIn('status', ['creating', 'preference_created', 'pending'])
            ->where(function ($query): void {
                $query->whereNull('last_synced_at')
                    ->orWhere('last_synced_at', '<=', now()->subSeconds(30));
            })
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get();

        foreach ($intents as $intent) {
            try {
                $reconciler->sync($intent, 'scheduled_reconciliation');
            } catch (Throwable $exception) {
                report($exception);
                $intent->update([
                    'processing_error' => 'No se pudo sincronizar el pago con Mercado Pago.',
                    'last_synced_at' => now(),
                ]);
                $this->warn('No se pudo sincronizar '.$intent->internal_reference.'.');
            }
        }

        return self::SUCCESS;
    }
}
