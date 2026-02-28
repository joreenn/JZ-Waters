<?php

namespace App\Http\Controllers\Refiller;

use App\Http\Controllers\Controller;
use App\Http\Requests\RefillRequest;
use App\Http\Resources\RefillTransactionResource;
use App\Models\RefillTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RefillController extends Controller
{
    /**
     * Get refill summary for today.
     */
    public function summary(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $today  = now()->toDateString();

        $todayStats = RefillTransaction::where('staff_id', $userId)
            ->whereDate('created_at', $today)
            ->selectRaw('COUNT(*) as transactions_count, COALESCE(SUM(gallons_count), 0) as total_gallons, COALESCE(SUM(total), 0) as total_revenue')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'today' => [
                    'transactions' => (int) $todayStats->transactions_count,
                    'gallons'      => (int) $todayStats->total_gallons,
                    'revenue'      => (float) $todayStats->total_revenue,
                ],
            ],
        ]);
    }

    /**
     * List refill transaction logs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RefillTransaction::where('staff_id', $request->user()->id);

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $transactions = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => RefillTransactionResource::collection($transactions),
            'meta'    => [
                'current_page' => $transactions->currentPage(),
                'last_page'    => $transactions->lastPage(),
                'total'        => $transactions->total(),
            ],
        ]);
    }

    /**
     * Record a new refill transaction.
     */
    public function store(RefillRequest $request): JsonResponse
    {
        $total = $request->gallons_count * $request->price_per_gallon;

        $transaction = RefillTransaction::create([
            'staff_id'         => $request->user()->id,
            'customer_name'    => $request->customer_name,
            'water_type'       => $request->water_type,
            'gallons_count'    => $request->gallons_count,
            'price_per_gallon' => $request->price_per_gallon,
            'total'            => $total,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Refill transaction recorded.',
            'data'    => new RefillTransactionResource($transaction),
        ], 201);
    }
}
