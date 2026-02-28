<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['water', 'other'])->default('water');
            $table->text('description')->nullable();
            $table->decimal('price', 8, 2);
            $table->integer('stock_quantity')->default(0);
            $table->string('unit')->default('per gallon');
            $table->integer('low_stock_threshold')->default(10);
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
