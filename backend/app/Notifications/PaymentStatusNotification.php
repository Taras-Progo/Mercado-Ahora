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

    public function via(object $notifiable): array { return ['mail']; }

    public function toMail(object $notifiable): MailMessage
    {
        $intent = PaymentIntent::query()->with('orders')->findOrFail($this->paymentIntentId);
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $copy = match ($this->status) {
            'approved' => ['Pago aprobado', 'Tu pago fue confirmado', 'Mercado Pago confirmó tu compra. Los productores ya pueden preparar tu pedido.'],
            'pending' => ['Pago pendiente', 'Estamos confirmando tu pago', 'Mercado Pago informó que el pago continúa pendiente. Te avisaremos cuando cambie.'],
            'rejected' => ['Pago rechazado', 'No pudimos confirmar tu pago', 'El pago fue rechazado. Podés revisar el medio de pago e intentarlo nuevamente.'],
            'cancelled' => ['Pago cancelado', 'El pago fue cancelado', 'La operación fue cancelada y la reserva de stock quedó liberada.'],
            default => ['Pago vencido', 'La reserva de pago venció', 'La reserva venció antes de confirmarse. Podés volver a intentar la compra si todavía hay stock.'],
        };

        return (new MailMessage)
            ->subject($copy[0].' en Mercado Ahora')
            ->view(['html' => 'emails.auth-action', 'text' => 'emails.auth-action-text'], [
                'preheader' => $copy[2],
                'eyebrow' => 'Estado del pago',
                'title' => $copy[1],
                'greeting' => 'Hola, '.$notifiable->name,
                'intro' => [$copy[2], 'Importe: $ '.number_format($intent->amount_cents / 100, 2, ',', '.').'.'],
                'actionLabel' => 'Ver mis pedidos',
                'actionUrl' => $frontend.'/orders',
                'note' => 'Referencia de pago: '.$intent->internal_reference,
                'fallbackLabel' => 'Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:',
            ]);
    }
}