<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name'                => 'Purified Water (5 Gallon)',
                'category'            => 'water',
                'description'         => 'Clean, purified drinking water in a 5-gallon container. Perfect for homes and offices.',
                'price'               => 25.00,
                'stock_quantity'      => 200,
                'unit'                => 'gallon',
                'low_stock_threshold' => 30,
                'is_active'           => true,
            ],
            [
                'name'                => 'Alkaline Water (5 Gallon)',
                'category'            => 'water',
                'description'         => 'Premium alkaline water with pH 8.5+ for better hydration and health benefits.',
                'price'               => 35.00,
                'stock_quantity'      => 150,
                'unit'                => 'gallon',
                'low_stock_threshold' => 20,
                'is_active'           => true,
            ],
            [
                'name'                => 'Mineral Water (5 Gallon)',
                'category'            => 'water',
                'description'         => 'Natural mineral water enriched with essential minerals for better taste.',
                'price'               => 40.00,
                'stock_quantity'      => 100,
                'unit'                => 'gallon',
                'low_stock_threshold' => 15,
                'is_active'           => true,
            ],
            [
                'name'                => 'Purified Water (1 Gallon)',
                'category'            => 'water',
                'description'         => 'Convenient 1-gallon purified water. Easy to carry and store.',
                'price'               => 10.00,
                'stock_quantity'      => 300,
                'unit'                => 'gallon',
                'low_stock_threshold' => 50,
                'is_active'           => true,
            ],
            [
                'name'                => 'Slim Water Bottle (500ml)',
                'category'            => 'other',
                'description'         => 'Portable 500ml water bottle for on-the-go hydration.',
                'price'               => 15.00,
                'stock_quantity'      => 500,
                'unit'                => 'piece',
                'low_stock_threshold' => 100,
                'is_active'           => true,
            ],
            [
                'name'                => 'Water Dispenser (Hot & Cold)',
                'category'            => 'other',
                'description'         => 'Top-loading water dispenser with hot and cold settings.',
                'price'               => 3500.00,
                'stock_quantity'      => 15,
                'unit'                => 'piece',
                'low_stock_threshold' => 3,
                'is_active'           => true,
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(['name' => $product['name']], $product);
        }
    }
}
