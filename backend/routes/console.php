<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('payments:sync-mercado-pago')->everyMinute()->withoutOverlapping();
Schedule::command('payments:expire-reservations')->everyMinute()->withoutOverlapping();