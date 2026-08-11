<?php

namespace App\Jobs;

use App\Contracts\PaymentGateway;
use App\Models\PaymentIntent;
use App\Models\PaymentWebhookEvent;
use App\Services\Payments\MercadoPagoPaymentProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessMercadoPagoWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 90;

    /** @var int[] */
    public array $backoff = [10, 30, 90, 180];

    public function __construct(public readonly int $eventId)
    {
    }

    public function handle(PaymentGateway $gateway, MercadoPagoPaymentProcessor $processor): void
    {
        $event = PaymentWebhookEvent::query()->find($this->eventId);
        if (! $event || in_array($event->status, ['processed', 'ignored'], true)) {
            return;
        }

        $event->increment('attempts');
        $event->update(['status' => 'processing', 'processing_error' => null]);

        try {
            $payment = $gateway->getPayment((string) $event->resource_id);
            $reference = (string) ($payment['external_reference'] ?? '');
            if ($reference !== '') {
                $intentId = PaymentIntent::query()
                    ->where('internal_reference', $reference)
                    ->value('id');
                if ($intentId) {
                    $event->update(['payment_intent_id' => $intentId]);
                }
            }
            $processor->processProviderPayment($payment, 'webhook');
            $event->update(['status' => 'processed', 'processed_at' => now(), 'processing_error' => null]);
        } catch (Throwable $exception) {
            $event->update([
                'status' => 'failed',
                'processing_error' => mb_substr($exception->getMessage(), 0, 1000),
            ]);
            throw $exception;
        }
    }
}