<?php

namespace App\Services;

use App\Models\Product;
use App\Models\InventoryLog;

class InventoryService
{
    /**
     * Deduct stock and log it. Notify admins if below threshold.
     */
    public function deductStock(int $productId, int $quantity, string $reason, ?int $userId = null): void
    {
        $product = Product::findOrFail($productId);
        $product->decrement('stock_quantity', $quantity);

        InventoryLog::create([
            'product_id'      => $productId,
            'change_quantity'  => -$quantity,
            'type'            => 'stock_out',
            'reason'          => $reason,
            'performed_by'    => $userId,
        ]);

        if ($this->checkLowStock($product->fresh())) {
            app(NotificationService::class)->notifyAdmins(
                'Low Stock Alert',
                "{$product->name} is now at {$product->fresh()->stock_quantity} units (threshold: {$product->low_stock_threshold}).",
                'low_stock'
            );
        }
    }

    /**
     * Add stock and log it.
     */
    public function addStock(int $productId, int $quantity, string $reason, ?int $userId = null): void
    {
        $product = Product::findOrFail($productId);
        $product->increment('stock_quantity', $quantity);

        InventoryLog::create([
            'product_id'      => $productId,
            'change_quantity'  => $quantity,
            'type'            => 'stock_in',
            'reason'          => $reason,
            'performed_by'    => $userId,
        ]);
    }

    public function checkLowStock(Product $product): bool
    {
        return $product->stock_quantity <= $product->low_stock_threshold;
    }
}
