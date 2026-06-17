<?php

namespace App\Notifications;

use App\Models\ProductModerationNote;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProductModerationNoteNotification extends Notification
{
    use Queueable;

    public function __construct(private ProductModerationNote $note)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $product = $this->note->product;
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return (new MailMessage)
            ->subject('Revisión de publicación en Mercado Ahora')
            ->view(
                [
                    'html' => 'emails.auth-action',
                    'text' => 'emails.auth-action-text',
                ],
                [
                    'preheader' => 'Administración dejó una observación sobre una publicación.',
                    'eyebrow' => 'Moderación de producto',
                    'title' => 'Revisá tu publicación',
                    'greeting' => 'Hola, '.$notifiable->name,
                    'intro' => [
                        'Administración de Mercado Ahora dejó una observación sobre el producto "'.$product->name.'".',
                        $this->note->note,
                    ],
                    'actionLabel' => 'Ver mis productos',
                    'actionUrl' => $frontendUrl.'/seller/products',
                    'note' => 'Podés editar la publicación desde tu panel de productor y volver a dejarla lista para revisión.',
                    'fallbackLabel' => 'Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:',
                ],
            );
    }
}
