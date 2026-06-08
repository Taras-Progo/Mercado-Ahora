<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class FrontendVerifyEmailNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifica tu email en Mercado Ahora')
            ->greeting('Hola, '.$notifiable->name)
            ->line('Confirma tu email para mejorar la seguridad de tu cuenta en Mercado Ahora.')
            ->action('Verificar email', $this->verificationUrl($notifiable))
            ->line('Si no creaste esta cuenta, podes ignorar este mensaje.');
    }

    private function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }
}
