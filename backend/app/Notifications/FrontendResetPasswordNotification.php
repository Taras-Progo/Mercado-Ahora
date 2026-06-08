<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FrontendResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Restablecé tu contraseña en Mercado Ahora')
            ->view(
                [
                    'html' => 'emails.auth-action',
                    'text' => 'emails.auth-action-text',
                ],
                [
                    'preheader' => 'Usá este enlace seguro para crear una nueva contraseña.',
                    'eyebrow' => 'Recuperación de acceso',
                    'title' => 'Creá una nueva contraseña',
                    'greeting' => 'Hola, '.$notifiable->name,
                    'intro' => [
                        'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Mercado Ahora.',
                        'Este enlace es seguro y vence en 60 minutos.',
                    ],
                    'actionLabel' => 'Crear nueva contraseña',
                    'actionUrl' => $this->resetUrl($notifiable),
                    'note' => 'Si no solicitaste este cambio, podés ignorar este mensaje. Tu contraseña actual seguirá siendo válida.',
                    'fallbackLabel' => 'Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:',
                ],
            );
    }

    private function resetUrl(object $notifiable): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return $frontendUrl.'/recuperar?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }
}
