<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load(['customer', 'items.product', 'zone']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('delivery-team'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.new';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id'         => $this->order->id,
            'customer_name'    => $this->order->customer->name,
            'delivery_address' => $this->order->delivery_address,
            'total_amount'     => $this->order->total_amount,
            'items_count'      => $this->order->items->count(),
        ];
    }
}
