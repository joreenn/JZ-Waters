<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refill_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users')->cascadeOnDelete();
            $table->string('customer_name')->default('Walk-in');
            $table->enum('water_type', ['purified', 'alkaline', 'mineral']);
            $table->integer('gallons_count');
            $table->decimal('price_per_gallon', 8, 2);
            $table->decimal('total', 8, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refill_transactions');
    }
};
