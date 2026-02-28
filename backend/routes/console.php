<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduled Commands
Schedule::command('subscriptions:process')->dailyAt('06:00');
Schedule::command('inventory:check-low-stock')->dailyAt('08:00');
