<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaidOrderReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly int $orderId)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array { return ['mail', 'database']; }

    public function toArray(object $notifiable): array
    {
        $order = Order::query()->findOrFail($this->orderId);

        return [
            'kind' => 'paid_sale',
            'title' => 'Realizaste una nueva venta',
            'message' => 'Mercado Pago confirmó el pago del pedido '.$order->order_number.'.',
            'url' => '/seller/orders?order='.$order->id,
            'order_id' => $order->id,
        ];
    }
    public function toMail(object $notifiable): MailMessage
    {
        $order = Order::query()->findOrFail($this->orderId);
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return (new MailMessage)
            ->subject('Nuevo pedido pagado en Mercado Ahora')
            ->view(['html' => 'emails.auth-action', 'text' => 'emails.auth-action-text'], [
                'preheader' => 'Mercado Pago confirmó un nuevo pedido.',
                'eyebrow' => 'Nuevo pedido',
                'title' => 'Tenés un pedido pagado',
                'greeting' => 'Hola, '.$notifiable->name,
                'intro' => [
                    'El pago del pedido '.$order->order_number.' fue aprobado y validado.',
                    'Ya podés comenzar a preparar el pedido y coordinar la entrega con el comprador.',
                ],
                'actionLabel' => 'Ver pedido',
                'actionUrl' => $frontend.'/seller/orders?order='.$order->id,
                'note' => 'Importe del pedido: $ '.number_format($order->total_cents / 100, 2, ',', '.').'.',
                'fallbackLabel' => 'Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:',
            ]);
    }
}