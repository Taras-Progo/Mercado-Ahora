<?php

return [
    'postmark' => ['key' => env('POSTMARK_API_KEY')],
    'resend' => ['key' => env('RESEND_API_KEY')],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'mercado_pago' => [
        'mode' => env('MERCADO_PAGO_MODE', 'sandbox'),
        'public_key' => env('MERCADO_PAGO_PUBLIC_KEY'),
        'access_token' => env('MERCADO_PAGO_ACCESS_TOKEN'),
        'api_url' => env('MERCADO_PAGO_API_URL', 'https://api.mercadopago.com'),
        'timeout' => (int) env('MERCADO_PAGO_TIMEOUT', 15),
        'reservation_minutes' => (int) env('MERCADO_PAGO_RESERVATION_MINUTES', 30),
        'success_url' => env('MERCADO_PAGO_SUCCESS_URL', env('FRONTEND_URL').'/checkout/pago/aprobado'),
        'pending_url' => env('MERCADO_PAGO_PENDING_URL', env('FRONTEND_URL').'/checkout/pago/pendiente'),
        'failure_url' => env('MERCADO_PAGO_FAILURE_URL', env('FRONTEND_URL').'/checkout/pago/fallido'),
        'webhook_url' => env('MERCADO_PAGO_WEBHOOK_URL', env('APP_URL').'/api/v1/payments/webhooks/mercado-pago'),
    ],
];
