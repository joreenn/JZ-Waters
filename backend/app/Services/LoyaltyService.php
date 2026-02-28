<?php

namespace App\Services;

use App\Models\User;
use App\Models\LoyaltyPointLog;

class LoyaltyService
{
    /**
     * Award points to a customer. 1 point per gallon of water ordered.
     */
    public function awardPoints(User $user, int $gallons, int $orderId): void
    {
        if ($gallons <= 0) return;

        $user->increment('points_balance', $gallons);

        LoyaltyPointLog::create([
            'customer_id'  => $user->id,
            'points_change' => $gallons,
            'reason'       => "Earned from Order #{$orderId}",
            'reference_id' => $orderId,
        ]);
    }

    /**
     * Redeem points. 100 pts = ₱50 discount.
     */
    public function redeemPoints(User $user, int $points): array
    {
        if ($points <= 0 || $user->points_balance < $points) {
            throw new \InvalidArgumentException('Insufficient points balance.');
        }

        $discountAmount = ($points / 100) * 50;

        $user->decrement('points_balance', $points);

        LoyaltyPointLog::create([
            'customer_id'  => $user->id,
            'points_change' => -$points,
            'reason'       => "Redeemed {$points} points for ₱{$discountAmount} discount",
            'reference_id' => null,
        ]);

        return [
            'discount_amount' => $discountAmount,
            'new_balance'     => $user->fresh()->points_balance,
        ];
    }

    public function getPointsBalance(User $user): int
    {
        return $user->points_balance;
    }
}
