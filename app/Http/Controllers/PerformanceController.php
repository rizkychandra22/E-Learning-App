<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PerformanceController extends Controller
{
    public function store(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'in:LCP,CLS,TBT,FCP'],
            'value' => ['required', 'numeric'],
            'unit' => ['nullable', 'string', 'max:20'],
            'path' => ['nullable', 'string', 'max:200'],
            'timestamp' => ['nullable', 'integer'],
        ]);

        $entry = [
            'id' => (string) Str::uuid(),
            'metric' => $payload['name'],
            'value' => (float) $payload['value'],
            'unit' => $payload['unit'] ?? null,
            'path' => $payload['path'] ?? $request->path(),
            'timestamp' => $payload['timestamp'] ?? now()->getTimestampMs(),
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'ua' => substr((string) $request->userAgent(), 0, 255),
        ];

        Log::channel('perf')->info('web-vitals', $entry);

        return response()->json(['status' => 'ok']);
    }
}
