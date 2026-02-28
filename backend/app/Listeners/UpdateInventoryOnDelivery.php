<?php

namespace App\Listeners;

use App\Events\OrderStatusUpdated;
use App\Services\InventoryService;
use App\Services\LoyaltyService;
use App\Services\NotificationService;

class UpdateInventoryOnDelivery
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected LoyaltyService $loyaltyService,
        protected NotificationService $notificationService,
    ) {
    }

    public function handle(OrderStatusUpdated $event): void
    {
        // Only process when order is delivered
        if ($event->order->status !== 'delivered') {
            return;
        }

        // Deduct inventory for each item
        foreach ($event->order->items as $item) {
            $this->inventoryService->deductStock(
                $item->product_id,
                $item->quantity,
                "Order #{$event->order->id} delivered"
            );
        }

        // Award loyalty points (1 point per gallon for water products)
        $totalGallons = 0;
        foreach ($event->order->items as $item) {
            if ($item->product && $item->product->category === 'water') {
                $totalGallons += $item->quantity;
            }
        }

        if ($totalGallons > 0) {
            $this->loyaltyService->awardPoints(
                $event->order->customer_id,
                $totalGallons,
                "Order #{$event->order->id} delivered"
            );
        }

        // Notify customer
        $this->notificationService->notifyUser(
            $event->order->customer_id,
            'Order Delivered',
            "Your order #{$event->order->id} has been delivered successfully!",
            'order_delivered',
            $event->order->id
        );
    }
}
