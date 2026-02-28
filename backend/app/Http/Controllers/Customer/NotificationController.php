<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => NotificationResource::collection($notifications),
            'meta'    => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'total'        => $notifications->total(),
                'unread_count' => Notification::where('user_id', $request->user()->id)
                    ->where('is_read', false)->count(),
            ],
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}
