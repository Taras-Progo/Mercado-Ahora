@php
    $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
    $logoUrl = $frontendUrl.'/brand/mercado-ahora-logo.png';
@endphp
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e8;color:#2f211b;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        {{ $preheader }}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1e8;margin:0;padding:28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdf8;border:1px solid #e4d9ca;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(47,33,27,0.08);">
                    <tr>
                        <td style="padding:30px 32px 22px;background:#fffdf8;border-bottom:1px solid #ebe2d4;">
                            <img src="{{ $logoUrl }}" width="132" alt="Mercado Ahora" style="display:block;max-width:132px;height:auto;border:0;margin:0 0 24px;">
                            <p style="margin:0 0 10px;color:#4c693f;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                                {{ $eyebrow }}
                            </p>
                            <h1 style="margin:0;color:#2f211b;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.12;font-weight:700;">
                                {{ $title }}
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:30px 32px 8px;">
                            <p style="margin:0 0 20px;color:#2f211b;font-size:18px;line-height:1.6;">
                                {{ $greeting }}
                            </p>

                            @foreach ($intro as $paragraph)
                                <p style="margin:0 0 18px;color:#5f544e;font-size:16px;line-height:1.65;">
                                    {{ $paragraph }}
                                </p>
                            @endforeach
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:10px 32px 28px;">
                            <a href="{{ $actionUrl }}" style="display:inline-block;background:#3f5f35;color:#ffffff;text-decoration:none;border-radius:999px;padding:15px 30px;font-size:15px;font-weight:700;">
                                {{ $actionLabel }}
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px 24px;">
                            <div style="background:#f3eee5;border:1px solid #e2d8c9;border-radius:18px;padding:18px 20px;">
                                <p style="margin:0;color:#5f544e;font-size:15px;line-height:1.6;">
                                    {{ $note }}
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px 30px;">
                            <div style="border-top:1px solid #ebe2d4;padding-top:18px;">
                                <p style="margin:0 0 8px;color:#8a8179;font-size:12px;line-height:1.55;">
                                    {{ $fallbackLabel }}
                                </p>
                                <a href="{{ $actionUrl }}" style="display:block;word-break:break-all;color:#4c693f;background:#faf7f0;border:1px solid #ebe2d4;border-radius:12px;padding:10px 12px;font-size:11px;line-height:1.55;text-decoration:none;">
                                    {{ $actionUrl }}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 32px;background:#314d2a;color:#fffdf8;">
                            <p style="margin:0 0 6px;font-size:15px;line-height:1.5;font-weight:700;">
                                Mercado Ahora
                            </p>
                            <p style="margin:0;color:#e9e1d4;font-size:13px;line-height:1.55;">
                                Productos reales, productores locales y compras más conscientes.
                            </p>
                        </td>
                    </tr>
                </table>

                <p style="max-width:620px;margin:18px auto 0;color:#9a9088;font-size:12px;line-height:1.5;text-align:center;">
                    Este mensaje fue enviado automáticamente. No hace falta responderlo.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
