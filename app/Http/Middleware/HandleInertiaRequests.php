<?php

namespace App\Http\Middleware;

use App\Models\InAppNotification;
use App\Services\SystemSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    private const REQUEST_SETTINGS_ATTRIBUTE = 'system.public_settings';
    private static ?bool $hasNotificationsTable = null;

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $system = $request->attributes->get(self::REQUEST_SETTINGS_ATTRIBUTE);
        if (!is_array($system)) {
            $system = app(SystemSettingService::class)->getPublicSettings();
        }
        $defaultLanguage = $system['default_language'] ?? 'id';
        $canLoadNotifications = $user && $this->hasNotificationsTable();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'role' => $user->role,
                    'dashboard_role' => $this->mapDashboardRole($user->role),
                    'profile_photo_url' => $user->profile_photo_path ? Storage::disk('public')->url($user->profile_photo_path) : null,
                ] : null,
            ],
            'system' => [
                ...$system,
                'intl_locale' => $defaultLanguage === 'en' ? 'en-US' : 'id-ID',
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'notifications' => [
                'items' => fn () => $canLoadNotifications
                    ? InAppNotification::query()
                        ->where('user_id', $user->id)
                        ->latest('id')
                        ->limit(10)
                        ->get()
                    : [],
                'unread_count' => fn () => $canLoadNotifications
                    ? InAppNotification::query()
                        ->where('user_id', $user->id)
                        ->whereNull('read_at')
                        ->count()
                    : 0,
            ],
        ];
    }

    private function hasNotificationsTable(): bool
    {
        if (self::$hasNotificationsTable !== null) {
            return self::$hasNotificationsTable;
        }

        self::$hasNotificationsTable = Schema::hasTable('in_app_notifications');

        return self::$hasNotificationsTable;
    }

    private function mapDashboardRole(string $backendRole): string
    {
        return match ($backendRole) {
            'root' => 'super_admin',
            'finance' => 'finance',
            'teacher' => 'dosen',
            'student' => 'mahasiswa',
            default => 'admin',
        };
    }
}
