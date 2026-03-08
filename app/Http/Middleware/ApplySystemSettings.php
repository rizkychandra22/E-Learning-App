<?php

namespace App\Http\Middleware;

use App\Services\SystemSettingService;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApplySystemSettings
{
    public function __construct(
        private readonly SystemSettingService $settings
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $system = $this->settings->getPublicSettings();
        $this->applyLocale($system['default_language']);

        if ($timeoutResponse = $this->enforceSessionTimeout($request, (int) $system['session_timeout_minutes'])) {
            return $timeoutResponse;
        }

        if ($maintenanceResponse = $this->enforceMaintenanceMode($request, (bool) $system['maintenance_mode'])) {
            return $maintenanceResponse;
        }

        if ($uploadResponse = $this->enforceUploadLimit($request, (int) $system['max_upload_mb'])) {
            return $uploadResponse;
        }

        return $next($request);
    }

    private function applyLocale(string $language): void
    {
        $locale = $language === 'en' ? 'en' : 'id';
        App::setLocale($locale);
        Carbon::setLocale($locale);
        setlocale(LC_TIME, $locale === 'en' ? 'en_US.UTF-8' : 'id_ID.UTF-8');
    }

    private function enforceSessionTimeout(Request $request, int $minutes): ?RedirectResponse
    {
        if (!Auth::check()) {
            return null;
        }

        $timeoutMinutes = max($minutes, 5);
        $timeoutSeconds = $timeoutMinutes * 60;
        $now = now()->timestamp;
        $lastActivity = (int) $request->session()->get('last_activity_at', 0);

        if ($lastActivity > 0 && ($now - $lastActivity) > $timeoutSeconds) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'session' => __('Sesi Anda berakhir karena tidak ada aktivitas. Silakan login kembali.'),
            ]);
        }

        $request->session()->put('last_activity_at', $now);

        return null;
    }

    private function enforceMaintenanceMode(Request $request, bool $enabled): ?RedirectResponse
    {
        if (!$enabled) {
            return null;
        }

        if ($request->routeIs('maintenance.notice')) {
            return null;
        }

        $user = $request->user();
        if ($user && $user->role === 'root') {
            return null;
        }

        // Keep login route reachable so super admin can still sign in.
        if (!$user && $request->is('login')) {
            return null;
        }

        if ($user && $user->role !== 'root') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('maintenance.notice');
    }

    private function enforceUploadLimit(Request $request, int $maxUploadMb): ?RedirectResponse
    {
        if (!$request->isMethod('post') && !$request->isMethod('put') && !$request->isMethod('patch')) {
            return null;
        }

        $allFiles = $this->flattenFiles($request->allFiles());
        if (empty($allFiles)) {
            return null;
        }

        $limitBytes = max($maxUploadMb, 1) * 1024 * 1024;
        foreach ($allFiles as $file) {
            if ($file->getSize() !== null && $file->getSize() > $limitBytes) {
                return back()->withErrors([
                    'file' => __('Ukuran file melebihi batas maksimum :size MB.', ['size' => $maxUploadMb]),
                ])->withInput();
            }
        }

        return null;
    }

    /**
     * @param array<string, UploadedFile|array<array-key, UploadedFile>> $files
     * @return array<int, UploadedFile>
     */
    private function flattenFiles(array $files): array
    {
        $flat = [];

        $walker = function ($item) use (&$flat, &$walker): void {
            if ($item instanceof UploadedFile) {
                $flat[] = $item;
                return;
            }

            if (is_array($item)) {
                foreach ($item as $child) {
                    $walker($child);
                }
            }
        };

        foreach ($files as $file) {
            $walker($file);
        }

        return $flat;
    }
}
