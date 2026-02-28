<?php

namespace App\Http\Controllers\Delivery;

use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\DeliveryAssignmentResource;
use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    /**
     * Get delivery queue (pending & in-transit deliveries).
     */
    public function queue(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Get assigned deliveries
        $assigned = DeliveryAssignment::where('delivery_staff_id', $userId)
            ->whereIn('status', ['assigned', 'in_transit'])
            ->with(['order.customer', 'order.items.product', 'order.zone'])
            ->latest()
            ->get();

        // Get unassigned (pending) deliveries available for pickup
        $unassigned = DeliveryAssignment::whereNull('delivery_staff_id')
            ->where('status', 'pending')
            ->with(['order.customer', 'order.items.product', 'order.zone'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'assigned'   => DeliveryAssignmentResource::collection($assigned),
                'unassigned' => DeliveryAssignmentResource::collection($unassigned),
            ],
        ]);
    }

    /**
     * Get delivery stats for the current user.
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $today  = now()->toDateString();

        $todayDelivered = DeliveryAssignment::where('delivery_staff_id', $userId)
            ->where('status', 'delivered')
            ->whereDate('updated_at', $today)
            ->count();

        $totalDelivered = DeliveryAssignment::where('delivery_staff_id', $userId)
            ->where('status', 'delivered')
            ->count();

        $pending = DeliveryAssignment::where('delivery_staff_id', $userId)
            ->whereIn('status', ['assigned', 'in_transit'])
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'today_delivered' => $todayDelivered,
                'total_delivered' => $totalDelivered,
                'pending'         => $pending,
            ],
        ]);
    }

    /**
     * Accept / pick up a delivery (assign to self).
     */
    public function accept(Request $request, DeliveryAssignment $delivery): JsonResponse
    {
        if ($delivery->delivery_staff_id !== null && $delivery->delivery_staff_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'This delivery is already assigned to another driver.',
            ], 422);
        }

        $delivery->update([
            'delivery_staff_id' => $request->user()->id,
            'status'            => 'assigned',
        ]);

        $previousStatus = $delivery->order->status;
        $delivery->order->update(['status' => 'confirmed']);

        event(new OrderStatusUpdated($delivery->order->load('items.product'), $previousStatus));

        $this->notificationService->notifyUser(
            $delivery->order->customer_id,
            'Order Confirmed',
            "Your order #{$delivery->order->id} has been confirmed and a rider has been assigned.",
            'order_confirmed',
            $delivery->order->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Delivery accepted.',
            'data'    => new DeliveryAssignmentResource($delivery->fresh()->load(['order.customer', 'order.items.product', 'order.zone'])),
        ]);
    }

    /**
     * Update delivery status (out_for_delivery, delivered).
     */
    public function updateStatus(Request $request, DeliveryAssignment $delivery): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:in_transit,delivered',
        ]);

        if ($delivery->delivery_staff_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'This delivery is not assigned to you.',
            ], 403);
        }

        $newStatus = $request->status;
        $previousOrderStatus = $delivery->order->status;

        $delivery->update(['status' => $newStatus]);

        // Map delivery status to order status
        $orderStatusMap = [
            'in_transit' => 'out_for_delivery',
            'delivered'  => 'delivered',
        ];

        $delivery->order->update([
            'status'         => $orderStatusMap[$newStatus],
            'payment_status' => $newStatus === 'delivered' ? 'paid' : $delivery->order->payment_status,
        ]);

        event(new OrderStatusUpdated($delivery->order->fresh()->load('items.product'), $previousOrderStatus));

        $statusLabels = [
            'in_transit' => 'Out for Delivery',
            'delivered'  => 'Delivered',
        ];

        $this->notificationService->notifyUser(
            $delivery->order->customer_id,
            "Order {$statusLabels[$newStatus]}",
            "Your order #{$delivery->order->id} is now {$statusLabels[$newStatus]}.",
            'order_status',
            $delivery->order->id
        );

        return response()->json([
            'success' => true,
            'message' => "Delivery status updated to {$newStatus}.",
            'data'    => new DeliveryAssignmentResource($delivery->fresh()->load(['order.customer', 'order.items.product', 'order.zone', 'deliveryStaff'])),
        ]);
    }
}
