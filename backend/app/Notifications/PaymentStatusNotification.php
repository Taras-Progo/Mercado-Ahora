<?php

namespace App\Notifications;

use App\Models\PaymentIntent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly int $paymentIntentId, private readonly string $status)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        $intent = PaymentIntent::query()->with('orders:id')->findOrFail($this->paymentIntentId);
        $orderId = $intent->orders->first()?->id;
        $copy = match ($this->status) {
            'approved' => ['Tu compra fue confirmada', 'Mercado Pago confirmó tu compra. Ya podés seguirla desde Mis pedidos.'],
            'pending' => ['Tu pago está pendiente', 'Mercado Pago todavía está procesando el pago. Te avisaremos cuando cambie.'],
            'rejected' => ['Tu pago fue rechazado', 'Podés revisar el medio de pago e intentarlo nuevamente.'],
            'cancelled' => ['Tu pago fue cancelado', 'La operación fue cancelada y la reserva de stock quedó liberada.'],
            default => ['Tu reserva de pago venció', 'Podés volver a intentar la compra si todavía hay stock.'],
        };

        return [
            'kind' => 'payment_status',
            'title' => $copy[0],
            'message' => $copy[1],
            'url' => $orderId ? '/orders?order='.$orderId : '/orders',
            'order_id' => $orderId,
            'payment_intent_id' => $intent->id,
            'payment_status' => $this->status,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $intent = PaymentIntent::query()
            ->with('orders.items:id,order_id,product_name,quantity')
            ->findOrFail($this->paymentIntentId);
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $copy = match ($this->status) {
            'approved' => ['Pago aprobado', 'Tu pago fue confirmado', 'Mercado Pago confirmó tu compra. Los productores ya pueden preparar tu pedido.'],
            'pending' => ['Pago pendiente', 'Estamos confirmando tu pago', 'Mercado Pago informó que el pago continúa pendiente. Te avisaremos cuando cambie.'],
            'rejected' => ['Pago rechazado', 'No pudimos confirmar tu pago', 'El pago fue rechazado. Podés revisar el medio de pago e intentarlo nuevamente.'],
            'cancelled' => ['Pago cancelado', 'El pago fue cancelado', 'La operación fue cancelada y la reserva de stock quedó liberada.'],
            default => ['Pago vencido', 'La reserva de pago venció', 'La reserva venció antes de confirmarse. Podés volver a intentar la compra si todavía hay stock.'],
        };

        $intro = [$copy[2]];
        $purchaseSummary = $this->purchaseSummary($intent);

        if ($purchaseSummary !== null) {
            $intro[] = $purchaseSummary;
        }

        $intro[] = 'Importe: $ '.number_format($intent->amount_cents / 100, 2, ',', '.').'.';

        return (new MailMessage)
            ->subject($copy[0].' en Mercado Ahora')
            ->view(['html' => 'emails.auth-action', 'text' => 'emails.auth-action-text'], [
                'preheader' => $copy[2],
                'eyebrow' => 'Estado del pago',
                'title' => $copy[1],
                'greeting' => 'Hola, '.$notifiable->name,
                'intro' => $intro,
                'actionLabel' => 'Ver mis pedidos',
                'actionUrl' => $frontend.'/orders',
                'note' => 'Referencia de pago: '.$intent->internal_reference,
                'fallbackLabel' => 'Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:',
            ]);
    }

    private function purchaseSummary(PaymentIntent $intent): ?string
    {
        $products = $intent->orders
            ->flatMap->items
            ->groupBy('product_name')
            ->map(function ($items, string $productName): string {
                $quantity = (int) $items->sum('quantity');

                return $quantity > 1 ? $productName.' ('.$quantity.')' : $productName;
            })
            ->values();

        if ($products->isEmpty()) {
            return null;
        }

        $label = $products->count() === 1 ? 'Producto' : 'Productos';

        return $label.': '.$products->implode(', ').'.';
    }
}
