<?php

namespace App\Providers;

use App\Events\NewOrderPlaced;
use App\Events\OrderStatusUpdated;
use App\Listeners\SendOrderNotification;
use App\Listeners\UpdateInventoryOnDelivery;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(NewOrderPlaced::class, SendOrderNotification::class);
        Event::listen(OrderStatusUpdated::class, UpdateInventoryOnDelivery::class);
    }
}
