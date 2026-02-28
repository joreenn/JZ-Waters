<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification for a single user.
     */
    public function notifyUser(int $userId, string $title, string $message, string $type, ?int $referenceId = null): Notification
    {
        return Notification::create([
            'user_id'      => $userId,
            'title'        => $title,
            'message'      => $message,
            'type'         => $type,
            'reference_id' => $referenceId,
        ]);
    }

    /**
     * Send a notification to all admin users.
     */
    public function notifyAdmins(string $title, string $message, string $type, ?int $referenceId = null): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            $this->notifyUser($admin->id, $title, $message, $type, $referenceId);
        }
    }
}
