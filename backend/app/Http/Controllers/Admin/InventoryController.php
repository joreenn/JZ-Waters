<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryLogResource;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Get inventory overview.
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->when($request->boolean('low_stock'), function ($q) {
                $q->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
            })
            ->get()
            ->map(fn ($p) => [
                'id'              => $p->id,
                'name'            => $p->name,
                'category'        => $p->category,
                'stock_quantity'  => $p->stock_quantity,
                'low_stock_threshold' => $p->low_stock_threshold,
                'is_low_stock'    => $p->isLowStock(),
                'unit'            => $p->unit,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }

    /**
     * Get inventory logs.
     */
    public function logs(Request $request): JsonResponse
    {
        $query = InventoryLog::with(['product', 'performer']);

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $logs = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => InventoryLogResource::collection($logs),
            'meta'    => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }
}
