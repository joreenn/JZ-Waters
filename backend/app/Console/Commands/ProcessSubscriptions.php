<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Subscription;
use App\Models\Zone;
use App\Events\NewOrderPlaced;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessSubscriptions extends Command
{
    protected $signature = 'subscriptions:process';
    protected $description = 'Process active subscriptions and create orders for due deliveries';

    public function handle(): int
    {
        $today = now()->toDateString();

        $subscriptions = Subscription::where('is_active', true)
            ->where('next_delivery_date', '<=', $today)
            ->with(['customer', 'product', 'zone'])
            ->get();

        $processed = 0;

        foreach ($subscriptions as $subscription) {
            try {
                DB::transaction(function () use ($subscription, &$processed) {
                    $product = $subscription->product;
                    $zone    = $subscription->zone;

                    if (!$product || !$product->is_active || !$zone) {
                        return;
                    }

                    $subtotal = $product->price * $subscription->quantity;

                    $order = Order::create([
                        'customer_id'      => $subscription->customer_id,
                        'status'           => 'pending',
                        'payment_method'   => 'cod',
                        'payment_status'   => 'unpaid',
                        'zone_id'          => $zone->id,
                        'delivery_address' => $subscription->customer->address ?? 'Subscription delivery',
                        'notes'            => "Auto-generated from subscription #{$subscription->id}",
                        'delivery_fee'     => $zone->delivery_fee,
                        'subtotal'         => $subtotal,
                        'total_amount'     => $subtotal + $zone->delivery_fee,
                    ]);

                    $order->items()->create([
                        'product_id' => $product->id,
                        'quantity'   => $subscription->quantity,
                        'unit_price' => $product->price,
                        'subtotal'   => $subtotal,
                    ]);

                    $order->deliveryAssignment()->create(['status' => 'pending']);

                    // Update next delivery date
                    $subscription->update([
                        'next_delivery_date' => now()->addDays($subscription->frequency_days)->toDateString(),
                    ]);

                    event(new NewOrderPlaced($order->load(['customer', 'items.product', 'zone'])));

                    $processed++;
                });
            } catch (\Exception $e) {
                Log::error("Subscription #{$subscription->id} processing failed: " . $e->getMessage());
            }
        }

        $this->info("Processed {$processed} subscriptions.");

        return Command::SUCCESS;
    }
}
