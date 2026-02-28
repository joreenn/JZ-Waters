<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\RefillTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard overview.
     */
    public function index(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $thisMonth = now()->startOfMonth()->toDateString();

        // Today's stats
        $todayOrders = Order::whereDate('created_at', $today)->count();
        $todayRevenue = Order::whereDate('created_at', $today)
            ->where('status', 'delivered')
            ->sum('total_amount');

        // Refill revenue today
        $todayRefillRevenue = RefillTransaction::whereDate('created_at', $today)->sum('total');

        // Monthly stats
        $monthlyOrders = Order::whereDate('created_at', '>=', $thisMonth)->count();
        $monthlyRevenue = Order::whereDate('created_at', '>=', $thisMonth)
            ->where('status', 'delivered')
            ->sum('total_amount');
        $monthlyRefillRevenue = RefillTransaction::whereDate('created_at', '>=', $thisMonth)->sum('total');

        // Counts
        $totalCustomers = User::where('role', 'customer')->count();
        $pendingOrders  = Order::where('status', 'pending')->count();
        $lowStockProducts = Product::whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('is_active', true)->count();

        // Recent orders
        $recentOrders = Order::with(['customer', 'items.product'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($order) => [
                'id'             => $order->id,
                'customer_name'  => $order->customer?->name,
                'total_amount'   => $order->total_amount,
                'status'         => $order->status,
                'created_at'     => $order->created_at->toISOString(),
            ]);

        // Order status distribution
        $ordersByStatus = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'success' => true,
            'data'    => [
                'today' => [
                    'orders'         => $todayOrders,
                    'delivery_revenue' => (float) $todayRevenue,
                    'refill_revenue'   => (float) $todayRefillRevenue,
                    'total_revenue'    => (float) ($todayRevenue + $todayRefillRevenue),
                ],
                'monthly' => [
                    'orders'           => $monthlyOrders,
                    'delivery_revenue' => (float) $monthlyRevenue,
                    'refill_revenue'   => (float) $monthlyRefillRevenue,
                    'total_revenue'    => (float) ($monthlyRevenue + $monthlyRefillRevenue),
                ],
                'counts' => [
                    'total_customers'    => $totalCustomers,
                    'pending_orders'     => $pendingOrders,
                    'low_stock_products' => $lowStockProducts,
                ],
                'recent_orders'      => $recentOrders,
                'orders_by_status'   => $ordersByStatus,
            ],
        ]);
    }
}
