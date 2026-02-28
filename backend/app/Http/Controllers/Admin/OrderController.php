<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    /**
     * List all orders with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'items.product', 'zone', 'deliveryAssignment.deliveryStaff']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => OrderResource::collection($orders),
            'meta'    => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /**
     * Show a specific order.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load(['customer', 'items.product', 'zone', 'deliveryAssignment.deliveryStaff']);

        return response()->json([
            'success' => true,
            'data'    => new OrderResource($order),
        ]);
    }

    /**
     * Update order status (admin override).
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,out_for_delivery,delivered,cancelled',
        ]);

        $previousStatus = $order->status;
        $order->update(['status' => $request->status]);

        if ($request->status === 'delivered') {
            $order->update(['payment_status' => 'paid']);
        }

        event(new OrderStatusUpdated($order->fresh()->load('items.product'), $previousStatus));

        $this->notificationService->notifyUser(
            $order->customer_id,
            'Order Status Updated',
            "Your order #{$order->id} status has been updated to {$request->status}.",
            'order_status',
            $order->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Order status updated.',
            'data'    => new OrderResource($order->fresh()->load(['customer', 'items.product', 'zone', 'deliveryAssignment.deliveryStaff'])),
        ]);
    }
}
