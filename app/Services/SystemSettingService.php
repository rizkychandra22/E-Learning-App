<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class SystemSettingService
{
    private const CACHE_KEY = 'system_settings:all';

    public function getPublicSettings(): array
    {
        $defaults = [
            'platform_name' => 'Smart Learning',
            'support_email' => 'support@univ.ac.id',
            'default_language' => 'id',
            'maintenance_mode' => false,
            'allow_registration' => false,
            'notify_on_new_user' => true,
            'session_timeout_minutes' => 60,
            'max_upload_mb' => 20,
        ];

        $stored = $this->all();

        return [
            'platform_name' => (string) ($stored['platform_name'] ?? $defaults['platform_name']),
            'support_email' => (string) ($stored['support_email'] ?? $defaults['support_email']),
            'default_language' => (string) ($stored['default_language'] ?? $defaults['default_language']),
            'maintenance_mode' => ($stored['maintenance_mode'] ?? ($defaults['maintenance_mode'] ? '1' : '0')) === '1',
            'allow_registration' => ($stored['allow_registration'] ?? ($defaults['allow_registration'] ? '1' : '0')) === '1',
            'notify_on_new_user' => ($stored['notify_on_new_user'] ?? ($defaults['notify_on_new_user'] ? '1' : '0')) === '1',
            'session_timeout_minutes' => (int) ($stored['session_timeout_minutes'] ?? $defaults['session_timeout_minutes']),
            'max_upload_mb' => (int) ($stored['max_upload_mb'] ?? $defaults['max_upload_mb']),
        ];
    }

    public function isMaintenanceMode(): bool
    {
        return $this->getPublicSettings()['maintenance_mode'];
    }

    public function isRegistrationAllowed(): bool
    {
        return $this->getPublicSettings()['allow_registration'];
    }

    public function shouldNotifyOnNewUser(): bool
    {
        return $this->getPublicSettings()['notify_on_new_user'];
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, string|null>
     */
    private function all(): array
    {
        if (!Schema::hasTable('system_settings')) {
            return [];
        }

        return Cache::remember(self::CACHE_KEY, now()->addMinutes(1), function () {
            /** @var array<string, string|null> $settings */
            $settings = SystemSetting::query()->pluck('value', 'key')->toArray();
            return $settings;
        });
    }
}
