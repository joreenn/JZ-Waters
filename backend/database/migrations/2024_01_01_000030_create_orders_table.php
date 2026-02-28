<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['cod', 'gcash'])->default('cod');
            $table->enum('payment_status', ['unpaid', 'paid'])->default('unpaid');
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->text('delivery_address');
            $table->string('preferred_time')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('delivery_fee', 8, 2)->default(0);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
