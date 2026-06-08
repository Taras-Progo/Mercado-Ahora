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
            ->subject('Verificá tu email en Mercado Ahora')
            ->view(
                [
                    'html' => 'emails.auth-action',
                    'text' => 'emails.auth-action-text',
                ],
                [
                    'preheader' => 'Confirmá tu email para proteger tu cuenta.',
                    'eyebrow' => 'Seguridad de cuenta',
                    'title' => 'Verificá tu email',
                    'greeting' => 'Hola, '.$notifiable->name,
                    'intro' => [
                        'Confirmá tu dirección de email para mejorar la seguridad de tu cuenta en Mercado Ahora.',
                        'La verificación te ayuda a recuperar el acceso y recibir avisos importantes de tu cuenta.',
                    ],
                    'actionLabel' => 'Verificar mi email',
                    'actionUrl' => $this->verificationUrl($notifiable),
                    'note' => 'Si no creaste esta cuenta, podés ignorar este mensaje.',
                    'fallbackLabel' => 'Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:',
                ],
            );
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
