<?php

namespace App\Http\Controllers\Customer;

use App\Events\NewOrderPlaced;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Zone;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    /**
     * List orders for the authenticated customer.
     */
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with(['items.product', 'zone', 'deliveryAssignment.deliveryStaff'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => OrderResource::collection($orders),
            'meta'    => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /**
     * Place a new order.
     */
    public function store(OrderRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $zone = Zone::findOrFail($request->zone_id);

            // Calculate subtotal
            $subtotal = 0;
            $orderItems = [];

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock_quantity < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for {$product->name}. Available: {$product->stock_quantity}",
                    ], 422);
                }

                $itemSubtotal = $product->price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal'   => $itemSubtotal,
                ];
            }

            $order = Order::create([
                'customer_id'      => $request->user()->id,
                'status'           => 'pending',
                'payment_method'   => $request->payment_method,
                'payment_status'   => 'unpaid',
                'zone_id'          => $zone->id,
                'delivery_address' => $request->delivery_address,
                'preferred_time'   => $request->preferred_time ?? null,
                'notes'            => $request->notes ?? null,
                'delivery_fee'     => $zone->delivery_fee,
                'subtotal'         => $subtotal,
                'total_amount'     => $subtotal + $zone->delivery_fee,
            ]);

            $order->items()->createMany($orderItems);

            // Create delivery assignment
            $order->deliveryAssignment()->create([
                'status' => 'pending',
            ]);

            $order->load(['items.product', 'zone', 'customer', 'deliveryAssignment']);

            // Fire event
            event(new NewOrderPlaced($order));

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully.',
                'data'    => new OrderResource($order),
            ], 201);
        });
    }

    /**
     * Show a specific order.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        if ($order->customer_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden.',
            ], 403);
        }

        $order->load(['items.product', 'zone', 'deliveryAssignment.deliveryStaff']);

        return response()->json([
            'success' => true,
            'data'    => new OrderResource($order),
        ]);
    }

    /**
     * Cancel an order (only if pending).
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->customer_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden.',
            ], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending orders can be cancelled.',
            ], 422);
        }

        $previousStatus = $order->status;
        $order->update(['status' => 'cancelled']);

        if ($order->deliveryAssignment) {
            $order->deliveryAssignment->update([
                'status'              => 'cancelled',
                'cancellation_reason' => 'Cancelled by customer',
            ]);
        }

        event(new OrderStatusUpdated($order->fresh()->load('items.product'), $previousStatus));

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully.',
        ]);
    }
}
