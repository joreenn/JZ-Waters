<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Public channel for delivery team — all staff can listen
Broadcast::channel('delivery-team', function ($user) {
    return $user->hasAnyRole(['admin', 'delivery']);
});

// Private channel per order — only the customer who placed it, assigned delivery staff, or admin
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    $order = \App\Models\Order::find($orderId);

    if (!$order) {
        return false;
    }

    return $user->id === $order->customer_id
        || ($order->deliveryAssignment && $user->id === $order->deliveryAssignment->delivery_staff_id)
        || $user->hasRole('admin');
});
