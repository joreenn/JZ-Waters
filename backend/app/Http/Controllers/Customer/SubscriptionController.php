<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * List subscriptions for the authenticated customer.
     */
    public function index(Request $request): JsonResponse
    {
        $subscriptions = $request->user()
            ->subscriptions()
            ->with(['product', 'zone'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => SubscriptionResource::collection($subscriptions),
        ]);
    }

    /**
     * Create a new subscription.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'product_id'     => 'required|exists:products,id',
            'quantity'        => 'required|integer|min:1',
            'zone_id'        => 'required|exists:zones,id',
            'frequency_days' => 'required|integer|in:7,14,30',
        ]);

        $subscription = Subscription::create([
            'customer_id'        => $request->user()->id,
            'product_id'         => $request->product_id,
            'quantity'           => $request->quantity,
            'zone_id'            => $request->zone_id,
            'frequency_days'     => $request->frequency_days,
            'next_delivery_date' => now()->addDays($request->frequency_days)->toDateString(),
            'is_active'          => true,
        ]);

        $subscription->load(['product', 'zone']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription created successfully.',
            'data'    => new SubscriptionResource($subscription),
        ], 201);
    }

    /**
     * Toggle subscription active status.
     */
    public function toggle(Request $request, Subscription $subscription): JsonResponse
    {
        if ($subscription->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $subscription->update(['is_active' => !$subscription->is_active]);

        return response()->json([
            'success' => true,
            'message' => $subscription->is_active ? 'Subscription activated.' : 'Subscription paused.',
            'data'    => new SubscriptionResource($subscription->fresh()->load(['product', 'zone'])),
        ]);
    }

    /**
     * Delete a subscription.
     */
    public function destroy(Request $request, Subscription $subscription): JsonResponse
    {
        if ($subscription->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $subscription->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription deleted.',
        ]);
    }
}
