<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(protected LoyaltyService $loyaltyService)
    {
    }

    /**
     * Get current loyalty points and history.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $logs = $user->loyaltyLogs()->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => [
                'points_balance' => $user->points_balance,
                'history'        => $logs->items(),
                'meta'           => [
                    'current_page' => $logs->currentPage(),
                    'last_page'    => $logs->lastPage(),
                    'total'        => $logs->total(),
                ],
            ],
        ]);
    }

    /**
     * Redeem loyalty points.
     */
    public function redeem(Request $request): JsonResponse
    {
        $request->validate([
            'points' => 'required|integer|min:100',
        ]);

        $result = $this->loyaltyService->redeemPoints(
            $request->user()->id,
            $request->points
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data'    => [
                'discount'         => $result['discount'],
                'points_balance'   => $request->user()->fresh()->points_balance,
            ],
        ]);
    }
}
