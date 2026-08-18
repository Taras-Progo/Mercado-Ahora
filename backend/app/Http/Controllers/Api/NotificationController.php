<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->latest()->limit(50)->get();

        return response()->json([
            'data' => $notifications->map(fn (DatabaseNotification $notification) => $this->serialize($notification)),
            'meta' => ['unread_count' => $request->user()->unreadNotifications()->count()],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 4), 1), 10);
        $notifications = $request->user()->notifications()->latest()->limit($limit)->get();

        return response()->json([
            'data' => [
                'unread_count' => $request->user()->unreadNotifications()->count(),
                'notifications' => $notifications->map(fn (DatabaseNotification $notification) => $this->serialize($notification)),
            ],
        ]);
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['data' => $this->serialize($notification->fresh())]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['data' => ['unread_count' => 0]]);
    }

    private function serialize(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => class_basename($notification->type),
            'data' => $notification->data,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }
}
