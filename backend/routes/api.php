<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Customer;
use App\Http\Controllers\Delivery\DeliveryController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\Refiller\RefillController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (No Auth Required)
|--------------------------------------------------------------------------
*/
Route::get('/products', [PublicController::class, 'products']);
Route::get('/zones', [PublicController::class, 'zones']);

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
    });
});

/*
|--------------------------------------------------------------------------
| Customer Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
    // Orders
    Route::get('/orders', [Customer\OrderController::class, 'index']);
    Route::post('/orders', [Customer\OrderController::class, 'store']);
    Route::get('/orders/{order}', [Customer\OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [Customer\OrderController::class, 'cancel']);

    // Subscriptions
    Route::get('/subscriptions', [Customer\SubscriptionController::class, 'index']);
    Route::post('/subscriptions', [Customer\SubscriptionController::class, 'store']);
    Route::post('/subscriptions/{subscription}/toggle', [Customer\SubscriptionController::class, 'toggle']);
    Route::delete('/subscriptions/{subscription}', [Customer\SubscriptionController::class, 'destroy']);

    // Loyalty
    Route::get('/loyalty', [Customer\LoyaltyController::class, 'index']);
    Route::post('/loyalty/redeem', [Customer\LoyaltyController::class, 'redeem']);

    // Notifications
    Route::get('/notifications', [Customer\NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [Customer\NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [Customer\NotificationController::class, 'markAllRead']);
});

/*
|--------------------------------------------------------------------------
| Refiller Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:refiller'])->prefix('refiller')->group(function () {
    Route::get('/summary', [RefillController::class, 'summary']);
    Route::get('/transactions', [RefillController::class, 'index']);
    Route::post('/transactions', [RefillController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Delivery Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:delivery'])->prefix('delivery')->group(function () {
    Route::get('/queue', [DeliveryController::class, 'queue']);
    Route::get('/stats', [DeliveryController::class, 'stats']);
    Route::post('/assignments/{delivery}/accept', [DeliveryController::class, 'accept']);
    Route::put('/assignments/{delivery}/status', [DeliveryController::class, 'updateStatus']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [Admin\DashboardController::class, 'index']);

    // Users
    Route::apiResource('/users', Admin\UserController::class);

    // Products
    Route::apiResource('/products', Admin\ProductController::class);
    Route::post('/products/{product}/stock', [Admin\ProductController::class, 'adjustStock']);

    // Orders
    Route::get('/orders', [Admin\OrderController::class, 'index']);
    Route::get('/orders/{order}', [Admin\OrderController::class, 'show']);
    Route::put('/orders/{order}/status', [Admin\OrderController::class, 'updateStatus']);

    // Zones
    Route::apiResource('/zones', Admin\ZoneController::class);

    // Inventory
    Route::get('/inventory', [Admin\InventoryController::class, 'index']);
    Route::get('/inventory/logs', [Admin\InventoryController::class, 'logs']);

    // Reports
    Route::get('/reports/sales', [Admin\ReportController::class, 'sales']);
});
