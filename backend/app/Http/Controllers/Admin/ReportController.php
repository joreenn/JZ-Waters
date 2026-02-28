<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RefillTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Sales report.
     */
    public function sales(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $from = $request->from;
        $to   = $request->to;

        // Delivery orders revenue
        $deliveryRevenue = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->sum('total_amount');

        $deliveryCount = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->count();

        // Refill revenue
        $refillRevenue = RefillTransaction::whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->sum('total');

        $refillCount = RefillTransaction::whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->count();

        // Daily breakdown
        $dailyDelivery = Order::where('status', 'delivered')
            ->whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $dailyRefill = RefillTransaction::whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as transactions'),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top products
        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.status', 'delivered')
            ->whereBetween('orders.created_at', [$from, $to . ' 23:59:59'])
            ->select(
                'products.name',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.subtotal) as total_revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'summary' => [
                    'delivery_revenue'     => (float) $deliveryRevenue,
                    'delivery_order_count' => $deliveryCount,
                    'refill_revenue'       => (float) $refillRevenue,
                    'refill_count'         => $refillCount,
                    'total_revenue'        => (float) ($deliveryRevenue + $refillRevenue),
                ],
                'daily_delivery' => $dailyDelivery,
                'daily_refill'   => $dailyRefill,
                'top_products'   => $topProducts,
            ],
        ]);
    }
}
