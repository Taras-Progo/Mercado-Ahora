<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Services\Payments\MercadoPagoGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, MercadoPagoGateway::class);
    }

    public function boot(): void
    {
        //
    }
}
