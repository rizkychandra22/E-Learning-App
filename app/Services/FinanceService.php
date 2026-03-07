<?php

namespace App\Services;

use App\Models\FeeComponent;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FinanceService
{
    public function hasFinanceTables(): bool
    {
        return Schema::hasTable('fee_components')
            && Schema::hasTable('invoices')
            && Schema::hasTable('payments');
    }

    public function getDashboardData(): array
    {
        if (!$this->hasFinanceTables()) {
            return [
                'migrationRequired' => true,
                'summary' => [
                    'total_invoices' => 0,
                    'pending_payments' => 0,
                    'verified_payments' => 0,
                    'outstanding' => 0,
                    'income_month' => 0,
                ],
                'recent_activities' => [],
                'monthly_income' => [],
            ];
        }

        return Cache::remember('dashboard:finance', now()->addSeconds(30), function () {
            $this->refreshOverdueInvoices();

            $thisMonth = now()->startOfMonth();

            $monthlyIncome = collect(range(0, 5))
                ->map(function (int $offset) {
                    $date = now()->subMonths(5 - $offset);
                    $start = $date->copy()->startOfMonth();
                    $end = $date->copy()->endOfMonth();

                    return [
                        'month' => $date->translatedFormat('M Y'),
                        'total' => (float) Payment::query()
                            ->where('status', 'verified')
                            ->whereBetween('paid_at', [$start, $end])
                            ->sum('amount'),
                    ];
                })
                ->values();

            $recentInvoiceActivities = Invoice::query()
                ->latest('updated_at')
                ->limit(6)
                ->get(['id', 'invoice_no', 'title', 'status', 'updated_at'])
                ->map(fn (Invoice $invoice) => [
                    'id' => 'invoice-' . $invoice->id,
                    'action' => in_array($invoice->status, ['paid', 'partial', 'overdue'], true) ? 'update' : 'create',
                    'text' => 'Tagihan ' . $invoice->invoice_no . ' (' . $invoice->status . ')',
                    'time' => optional($invoice->updated_at)->toISOString(),
                ]);

            $recentPaymentActivities = Payment::query()
                ->latest('updated_at')
                ->limit(6)
                ->get(['id', 'payment_no', 'status', 'amount', 'updated_at'])
                ->map(fn (Payment $payment) => [
                    'id' => 'payment-' . $payment->id,
                    'action' => $payment->status === 'verified' ? 'create' : 'update',
                    'text' => 'Pembayaran ' . $payment->payment_no . ' (' . $payment->status . ')',
                    'time' => optional($payment->updated_at)->toISOString(),
                ]);

            $recentActivities = $recentInvoiceActivities
                ->concat($recentPaymentActivities)
                ->sortByDesc('time')
                ->take(10)
                ->values();

            $outstanding = (float) Invoice::query()
                ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                ->sum('amount');

            return [
                'migrationRequired' => false,
                'summary' => [
                    'total_invoices' => Invoice::count(),
                    'pending_payments' => Payment::where('status', 'pending')->count(),
                    'verified_payments' => Payment::where('status', 'verified')->count(),
                    'outstanding' => $outstanding,
                    'income_month' => (float) Payment::query()
                        ->where('status', 'verified')
                        ->where('paid_at', '>=', $thisMonth)
                        ->sum('amount'),
                ],
                'recent_activities' => $recentActivities,
                'monthly_income' => $monthlyIncome,
            ];
        });
    }

    public function getInvoicesData(string $search, string $status): array
    {
        $allowedStatus = ['all', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'];
        $selectedStatus = in_array($status, $allowedStatus, true) ? $status : 'all';

        if (!$this->hasFinanceTables()) {
            return [
                'migrationRequired' => true,
                'invoices' => [],
                'students' => [],
                'feeComponents' => [],
                'filters' => [
                    'search' => $search,
                    'status' => $selectedStatus,
                ],
            ];
        }

        $this->refreshOverdueInvoices();

        $invoices = Invoice::query()
            ->with(['student:id,name,code', 'feeComponent:id,name,code'])
            ->when($selectedStatus !== 'all', fn ($query) => $query->where('status', $selectedStatus))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('invoice_no', 'like', '%' . $search . '%')
                        ->orWhere('title', 'like', '%' . $search . '%');
                });
            })
            ->latest('id')
            ->get();

        $students = User::query()
            ->where('role', 'student')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $feeComponents = FeeComponent::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'amount']);

        return [
            'migrationRequired' => false,
            'invoices' => $invoices,
            'students' => $students,
            'feeComponents' => $feeComponents,
            'filters' => [
                'search' => $search,
                'status' => $selectedStatus,
            ],
        ];
    }

    public function createInvoice(array $payload, int $creatorId): void
    {
        $data = $payload;
        $data['invoice_no'] = $this->generateInvoiceNo();
        $data['created_by'] = $creatorId;
        $data['status'] = $data['status'] ?? 'unpaid';

        Invoice::create($data);
        Cache::forget('dashboard:finance');
    }

    public function updateInvoice(Invoice $invoice, array $payload): void
    {
        $invoice->update($payload);
        Cache::forget('dashboard:finance');
    }

    public function deleteInvoice(Invoice $invoice): void
    {
        $invoice->delete();
        Cache::forget('dashboard:finance');
    }

    public function getPaymentsData(string $search, string $status): array
    {
        $allowedStatus = ['all', 'pending', 'verified', 'rejected'];
        $selectedStatus = in_array($status, $allowedStatus, true) ? $status : 'all';

        if (!$this->hasFinanceTables()) {
            return [
                'migrationRequired' => true,
                'payments' => [],
                'invoices' => [],
                'students' => [],
                'filters' => [
                    'search' => $search,
                    'status' => $selectedStatus,
                ],
            ];
        }

        $payments = Payment::query()
            ->with(['invoice:id,invoice_no,title,status,amount', 'student:id,name,code'])
            ->when($selectedStatus !== 'all', fn ($query) => $query->where('status', $selectedStatus))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('payment_no', 'like', '%' . $search . '%')
                        ->orWhere('notes', 'like', '%' . $search . '%');
                });
            })
            ->latest('id')
            ->get();

        $invoices = Invoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->orderByDesc('id')
            ->get(['id', 'invoice_no', 'title', 'student_id', 'amount', 'status']);

        $students = User::query()
            ->where('role', 'student')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return [
            'migrationRequired' => false,
            'payments' => $payments,
            'invoices' => $invoices,
            'students' => $students,
            'filters' => [
                'search' => $search,
                'status' => $selectedStatus,
            ],
        ];
    }

    public function createPayment(array $payload): void
    {
        DB::transaction(function () use ($payload) {
            $data = $payload;
            $data['payment_no'] = $this->generatePaymentNo();
            $payment = Payment::create($data);

            if ($payment->status === 'verified' && $payment->invoice_id) {
                $this->syncInvoiceStatus((int) $payment->invoice_id);
            }
        });

        Cache::forget('dashboard:finance');
    }

    public function verifyPayment(Payment $payment, int $verifierId): void
    {
        DB::transaction(function () use ($payment, $verifierId) {
            $payment->update([
                'status' => 'verified',
                'verified_by' => $verifierId,
            ]);

            if ($payment->invoice_id) {
                $this->syncInvoiceStatus((int) $payment->invoice_id);
            }
        });

        Cache::forget('dashboard:finance');
    }

    public function rejectPayment(Payment $payment, int $verifierId): void
    {
        $payment->update([
            'status' => 'rejected',
            'verified_by' => $verifierId,
        ]);

        if ($payment->invoice_id) {
            $this->syncInvoiceStatus((int) $payment->invoice_id);
        }

        Cache::forget('dashboard:finance');
    }

    public function getReportsData(?string $dateFrom, ?string $dateTo): array
    {
        if (!$this->hasFinanceTables()) {
            return [
                'migrationRequired' => true,
                'summary' => [
                    'verified_income' => 0,
                    'pending_amount' => 0,
                    'receivables' => 0,
                    'total_invoices' => 0,
                ],
                'top_unpaid' => [],
                'cashflow' => [],
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ];
        }

        $from = $dateFrom ? now()->parse($dateFrom)->startOfDay() : now()->startOfMonth();
        $to = $dateTo ? now()->parse($dateTo)->endOfDay() : now()->endOfDay();

        $verifiedIncome = (float) Payment::query()
            ->where('status', 'verified')
            ->whereBetween('paid_at', [$from, $to])
            ->sum('amount');

        $pendingAmount = (float) Payment::query()
            ->where('status', 'pending')
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount');

        $receivables = (float) Invoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->sum('amount');

        $topUnpaid = Invoice::query()
            ->with('student:id,name,code')
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->orderByDesc('amount')
            ->limit(10)
            ->get(['id', 'invoice_no', 'student_id', 'amount', 'due_date', 'status']);

        $cashflow = collect(range(0, 5))
            ->map(function (int $offset) {
                $date = now()->subMonths(5 - $offset);
                $start = $date->copy()->startOfMonth();
                $end = $date->copy()->endOfMonth();

                return [
                    'month' => $date->translatedFormat('M Y'),
                    'verified' => (float) Payment::query()->where('status', 'verified')->whereBetween('paid_at', [$start, $end])->sum('amount'),
                    'pending' => (float) Payment::query()->where('status', 'pending')->whereBetween('created_at', [$start, $end])->sum('amount'),
                ];
            })
            ->values();

        return [
            'migrationRequired' => false,
            'summary' => [
                'verified_income' => $verifiedIncome,
                'pending_amount' => $pendingAmount,
                'receivables' => $receivables,
                'total_invoices' => Invoice::count(),
            ],
            'top_unpaid' => $topUnpaid,
            'cashflow' => $cashflow,
            'filters' => [
                'date_from' => $from->toDateString(),
                'date_to' => $to->toDateString(),
            ],
        ];
    }

    public function getSettings(int $financeId): array
    {
        $defaults = [
            'default_due_days' => 14,
            'auto_verify_payment' => false,
            'overdue_reminder_days' => 3,
        ];

        if (!Schema::hasTable('system_settings')) {
            return $defaults;
        }

        $prefix = $this->settingsPrefix($financeId);
        $stored = SystemSetting::query()
            ->where('key', 'like', $prefix . '%')
            ->pluck('value', 'key');

        return [
            'default_due_days' => (int) ($stored[$prefix . 'default_due_days'] ?? $defaults['default_due_days']),
            'auto_verify_payment' => ($stored[$prefix . 'auto_verify_payment'] ?? ($defaults['auto_verify_payment'] ? '1' : '0')) === '1',
            'overdue_reminder_days' => (int) ($stored[$prefix . 'overdue_reminder_days'] ?? $defaults['overdue_reminder_days']),
        ];
    }

    public function updateSettings(int $financeId, array $payload): bool
    {
        if (!Schema::hasTable('system_settings')) {
            return false;
        }

        $prefix = $this->settingsPrefix($financeId);
        foreach ($payload as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $prefix . $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        return true;
    }

    private function syncInvoiceStatus(int $invoiceId): void
    {
        $invoice = Invoice::find($invoiceId);
        if (!$invoice) {
            return;
        }

        $verifiedPaid = (float) Payment::query()
            ->where('invoice_id', $invoiceId)
            ->where('status', 'verified')
            ->sum('amount');

        if ($verifiedPaid >= (float) $invoice->amount) {
            $invoice->update(['status' => 'paid']);
            return;
        }

        if ($verifiedPaid > 0) {
            $invoice->update(['status' => 'partial']);
            return;
        }

        if ($invoice->due_date && now()->toDateString() > (string) $invoice->due_date) {
            $invoice->update(['status' => 'overdue']);
            return;
        }

        $invoice->update(['status' => 'unpaid']);
    }

    private function refreshOverdueInvoices(): void
    {
        Invoice::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);
    }

    private function generateInvoiceNo(): string
    {
        return 'INV-' . now()->format('Ymd-His') . '-' . strtoupper(substr(md5((string) microtime(true)), 0, 4));
    }

    private function generatePaymentNo(): string
    {
        return 'PAY-' . now()->format('Ymd-His') . '-' . strtoupper(substr(md5((string) microtime(true)), 0, 4));
    }

    private function settingsPrefix(int $financeId): string
    {
        return 'finance_' . $financeId . '_';
    }
}
