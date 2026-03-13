<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceLogController extends Controller
{
    public function index(Request $request): Response
    {
        $logDirectory = storage_path('logs');
        $files = $this->listPerfFiles($logDirectory);
        $selectedFile = $this->resolveSelectedFile($files, $request->query('file'));

        $entries = [];
        if ($selectedFile) {
            $entries = $this->readPerfEntries($logDirectory . DIRECTORY_SEPARATOR . $selectedFile);
        }

        $mocked = false;
        if (empty($files)) {
            $mocked = true;
            $files = $this->mockPerfFiles();
            $selectedFile = $files[0]['file'] ?? null;
            $entries = $this->mockPerfEntries();
        }

        $metrics = array_filter(array_map(fn ($entry) => $entry['metric'] ?? null, $entries));
        $byMetric = [];
        foreach ($metrics as $metric) {
            $byMetric[$metric] = ($byMetric[$metric] ?? 0) + 1;
        }

        return Inertia::render('SuperAdmin/PerformanceLogs', [
            'files' => $files,
            'selected_file' => $selectedFile,
            'entries' => $entries,
            'mocked' => $mocked,
            'summary' => [
                'total' => count($entries),
                'by_metric' => $byMetric,
                'latest' => $entries[0]['timestamp'] ?? null,
            ],
        ]);
    }

    public function download(Request $request)
    {
        $logDirectory = storage_path('logs');
        $files = $this->listPerfFiles($logDirectory);
        $selectedFile = $this->resolveSelectedFile($files, $request->query('file'));

        if (!$selectedFile) {
            return back()->withErrors(['perf_logs' => 'File log tidak ditemukan.']);
        }

        $path = $logDirectory . DIRECTORY_SEPARATOR . $selectedFile;
        if (!File::exists($path)) {
            return back()->withErrors(['perf_logs' => 'File log tidak ditemukan.']);
        }

        return response()->download($path, $selectedFile, [
            'Content-Type' => 'text/plain',
        ]);
    }

    private function listPerfFiles(string $logDirectory): array
    {
        $paths = glob($logDirectory . DIRECTORY_SEPARATOR . 'perf-vitals-*.log') ?: [];
        usort($paths, fn ($a, $b) => filemtime($b) <=> filemtime($a));

        return array_values(array_filter(array_map(function ($path) {
            $file = basename($path);
            if (!preg_match('/^perf-vitals-\d{4}-\d{2}-\d{2}\.log$/', $file)) {
                return null;
            }
            preg_match('/perf-vitals-(\d{4}-\d{2}-\d{2})\.log/', $file, $matches);
            return [
                'file' => $file,
                'date' => $matches[1] ?? $file,
            ];
        }, $paths)));
    }

    private function resolveSelectedFile(array $files, ?string $requested): ?string
    {
        if (!empty($requested)) {
            foreach ($files as $file) {
                if ($file['file'] === $requested) {
                    return $requested;
                }
            }
        }

        return $files[0]['file'] ?? null;
    }

    private function readPerfEntries(string $path): array
    {
        if (!File::exists($path)) {
            return [];
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        $lines = array_slice($lines, -200);
        $entries = [];

        foreach ($lines as $line) {
            $entry = [
                'timestamp' => null,
                'metric' => null,
                'value' => null,
                'unit' => null,
                'path' => null,
                'user_id' => null,
                'ip' => null,
                'ua' => null,
                'raw' => $line,
            ];

            if (preg_match('/^\[(?<ts>[^\]]+)\]\s+(?<env>[^.]+)\.INFO:\s+web-vitals\s+(?<json>\{.*\})\s*$/', $line, $matches)) {
                $entry['timestamp'] = $matches['ts'] ?? null;
                $context = json_decode($matches['json'], true);
                if (is_array($context)) {
                    $entry['metric'] = $context['metric'] ?? null;
                    $entry['value'] = $context['value'] ?? null;
                    $entry['unit'] = $context['unit'] ?? null;
                    $entry['path'] = $context['path'] ?? null;
                    $entry['user_id'] = $context['user_id'] ?? null;
                    $entry['ip'] = $context['ip'] ?? null;
                    $entry['ua'] = $context['ua'] ?? null;
                }
            }

            $entries[] = $entry;
        }

        return array_reverse($entries);
    }

    private function mockPerfFiles(): array
    {
        return [
            ['file' => 'perf-vitals-2026-03-12.log', 'date' => '2026-03-12'],
            ['file' => 'perf-vitals-2026-03-11.log', 'date' => '2026-03-11'],
        ];
    }

    private function mockPerfEntries(): array
    {
        return [
            [
                'timestamp' => now()->subMinutes(8)->toISOString(),
                'metric' => 'LCP',
                'value' => 2.1,
                'unit' => 's',
                'path' => '/dashboard',
                'user_id' => 1201,
                'ip' => '192.168.1.12',
                'ua' => 'Chrome 122',
                'raw' => 'mock',
            ],
            [
                'timestamp' => now()->subMinutes(12)->toISOString(),
                'metric' => 'CLS',
                'value' => 0.08,
                'unit' => 'score',
                'path' => '/courses',
                'user_id' => 1202,
                'ip' => '192.168.1.18',
                'ua' => 'Edge 122',
                'raw' => 'mock',
            ],
            [
                'timestamp' => now()->subMinutes(16)->toISOString(),
                'metric' => 'TBT',
                'value' => 180,
                'unit' => 'ms',
                'path' => '/my-courses',
                'user_id' => 1203,
                'ip' => '192.168.1.20',
                'ua' => 'Firefox 123',
                'raw' => 'mock',
            ],
            [
                'timestamp' => now()->subMinutes(22)->toISOString(),
                'metric' => 'FCP',
                'value' => 1.2,
                'unit' => 's',
                'path' => '/materials',
                'user_id' => 1204,
                'ip' => '192.168.1.35',
                'ua' => 'Chrome 122',
                'raw' => 'mock',
            ],
            [
                'timestamp' => now()->subMinutes(30)->toISOString(),
                'metric' => 'LCP',
                'value' => 2.7,
                'unit' => 's',
                'path' => '/assignments',
                'user_id' => 1205,
                'ip' => '192.168.1.44',
                'ua' => 'Safari 17',
                'raw' => 'mock',
            ],
        ];
    }
}
