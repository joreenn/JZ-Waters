<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Http\Resources\ZoneResource;
use App\Models\Product;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * List active products (public, no auth required).
     */
    public function products(Request $request): JsonResponse
    {
        $query = Product::where('is_active', true);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $products = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => ProductResource::collection($products),
        ]);
    }

    /**
     * List active delivery zones (public).
     */
    public function zones(): JsonResponse
    {
        $zones = Zone::where('is_active', true)->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => ZoneResource::collection($zones),
        ]);
    }
}
