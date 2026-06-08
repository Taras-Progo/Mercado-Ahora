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
            ->subject('Restablece tu contrasena en Mercado Ahora')
            ->greeting('Hola, '.$notifiable->name)
            ->line('Recibimos una solicitud para restablecer la contrasena de tu cuenta.')
            ->action('Crear nueva contrasena', $this->resetUrl($notifiable))
            ->line('Este enlace vence en 60 minutos.')
            ->line('Si no solicitaste este cambio, podes ignorar este mensaje.');
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
