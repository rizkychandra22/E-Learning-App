<?php

namespace App\Http\Controllers;

use App\Models\InAppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_if(!$user, 403);

        $notifications = InAppNotification::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(100)
            ->get();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'summary' => [
                'total' => $notifications->count(),
                'unread' => $notifications->whereNull('read_at')->count(),
            ],
        ]);
    }

    public function markRead(Request $request, InAppNotification $notification): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user, 403);
        abort_if((int) $notification->user_id !== (int) $user->id, 404);

        if (!$notification->read_at) {
            $notification->update([
                'read_at' => now(),
                'status' => 'read',
            ]);
        }

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user, 403);

        InAppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'status' => 'read',
            ]);

        return back();
    }
}
