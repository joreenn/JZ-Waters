<?php

namespace App\Listeners;

use App\Events\NewOrderPlaced;
use App\Services\NotificationService;

class SendOrderNotification
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    public function handle(NewOrderPlaced $event): void
    {
        // Notify all admins about the new order
        $this->notificationService->notifyAdmins(
            'New Order Received',
            "Order #{$event->order->id} placed by {$event->order->customer->name} — ₱" . number_format($event->order->total_amount, 2),
            'new_order',
            $event->order->id
        );
    }
}
