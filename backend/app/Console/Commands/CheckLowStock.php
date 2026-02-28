<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class CheckLowStock extends Command
{
    protected $signature = 'inventory:check-low-stock';
    protected $description = 'Check for low-stock products and notify admins';

    public function handle(NotificationService $notificationService): int
    {
        $lowStockProducts = Product::where('is_active', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->get();

        if ($lowStockProducts->isEmpty()) {
            $this->info('No low-stock products found.');
            return Command::SUCCESS;
        }

        foreach ($lowStockProducts as $product) {
            $notificationService->notifyAdmins(
                'Low Stock Alert',
                "{$product->name} has only {$product->stock_quantity} {$product->unit}(s) left (threshold: {$product->low_stock_threshold}).",
                'low_stock',
                $product->id
            );
        }

        $this->info("Notified admins about {$lowStockProducts->count()} low-stock products.");

        return Command::SUCCESS;
    }
}
