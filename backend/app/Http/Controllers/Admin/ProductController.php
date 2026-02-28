<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(protected InventoryService $inventoryService)
    {
    }

    /**
     * List all products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        $products = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => ProductResource::collection($products),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'total'        => $products->total(),
            ],
        ]);
    }

    /**
     * Show a single product.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new ProductResource($product),
        ]);
    }

    /**
     * Create a new product.
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data'    => new ProductResource($product),
        ], 201);
    }

    /**
     * Update a product.
     */
    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data'    => new ProductResource($product->fresh()),
        ]);
    }

    /**
     * Soft-delete a product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }

    /**
     * Adjust stock manually.
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer',
            'type'     => 'required|in:stock_in,stock_out,adjustment',
            'reason'   => 'required|string|max:255',
        ]);

        if ($request->type === 'stock_in') {
            $this->inventoryService->addStock(
                $product->id,
                $request->quantity,
                $request->reason,
                $request->user()->id
            );
        } else {
            $this->inventoryService->deductStock(
                $product->id,
                abs($request->quantity),
                $request->reason
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully.',
            'data'    => new ProductResource($product->fresh()),
        ]);
    }
}
