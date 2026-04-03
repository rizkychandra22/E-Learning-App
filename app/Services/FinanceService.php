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
                'monthly_finance' => [],
                'payment_methods' => [],
                'recent_transactions' => [],
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
            $monthlyFinance = collect(range(0, 5))
                ->map(function (int $offset): array {
                    $date = now()->subMonths(5 - $offset);
                    $start = $date->copy()->startOfMonth();
                    $end = $date->copy()->endOfMonth();

                    $income = (float) Payment::query()
                        ->where('status', 'verified')
                        ->whereBetween('paid_at', [$start, $end])
                        ->sum('amount');

                    $billing = (float) Invoice::query()
                        ->whereBetween('created_at', [$start, $end])
                        ->sum('amount');

                    return [
                        'label' => $date->translatedFormat('M Y'),
                        'income' => $income,
                        'billing' => $billing,
                    ];
                })
                ->values();
            $paymentMethodLabels = [
                'bank_transfer' => 'Transfer Bank',
                'virtual_account' => 'Virtual Account',
                'e_wallet' => 'E-Wallet',
                'credit_card' => 'Kartu Kredit',
                'cash' => 'Tunai',
            ];
            $paymentMethods = Payment::query()
                ->selectRaw('method, COUNT(*) as value')
                ->whereNotNull('method')
                ->groupBy('method')
                ->orderByDesc('value')
                ->get()
                ->map(function ($item) use ($paymentMethodLabels): array {
                    $method = (string) $item->method;
                    return [
                        'label' => $paymentMethodLabels[$method] ?? ucwords(str_replace('_', ' ', $method)),
                        'value' => (int) $item->value,
                    ];
                })
                ->values();
            $recentTransactions = Payment::query()
                ->with([
                    'student:id,name',
                    'invoice:id,title',
                ])
                ->latest('paid_at')
                ->latest('id')
                ->limit(10)
                ->get(['id', 'student_id', 'invoice_id', 'amount', 'status', 'paid_at'])
                ->map(function (Payment $payment): array {
                    $date = $payment->paid_at ? now()->parse((string) $payment->paid_at)->translatedFormat('d M Y') : '-';

                    return [
                        'id' => (int) $payment->id,
                        'name' => (string) ($payment->student?->name ?? '-'),
                        'type' => (string) ($payment->invoice?->title ?? 'Pembayaran'),
                        'amount' => (float) ($payment->amount ?? 0),
                        'date' => $date,
                        'status' => (string) ($payment->status ?? 'pending'),
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
                'monthly_finance' => $monthlyFinance,
                'payment_methods' => $paymentMethods,
                'recent_transactions' => $recentTransactions,
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
                'mocked' => false,
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

        $mocked = false;

        return [
            'migrationRequired' => false,
            'invoices' => $invoices,
            'students' => $students,
            'feeComponents' => $feeComponents,
            'mocked' => $mocked,
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
                'mocked' => false,
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

        $mocked = false;

        return [
            'migrationRequired' => false,
            'payments' => $payments,
            'invoices' => $invoices,
            'students' => $students,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'status' => $selectedStatus,
            ],
        ];
    }

    public function getVerificationData(string $search = ''): array
    {
        if (!$this->hasFinanceTables()) {
            return [
                'migrationRequired' => true,
                'mocked' => false,
                'filters' => ['search' => $search],
                'summary' => [
                    'pending' => 0,
                    'verified' => 0,
                    'rejected' => 0,
                ],
                'verifications' => [],
            ];
        }

        $pendingQuery = Payment::query()
            ->with([
                'student:id,name,code',
                'invoice:id,invoice_no,title,status,due_date,amount',
            ])
            ->where('status', 'pending')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('payment_no', 'like', '%' . $search . '%')
                        ->orWhere('method', 'like', '%' . $search . '%')
                        ->orWhereHas('student', fn ($studentQ) => $studentQ->where('name', 'like', '%' . $search . '%'))
                        ->orWhereHas('invoice', fn ($invoiceQ) => $invoiceQ->where('invoice_no', 'like', '%' . $search . '%'));
                });
            });

        $pending = $pendingQuery->latest('id')->get();
        $summary = [
            'pending' => Payment::query()->where('status', 'pending')->count(),
            'verified' => Payment::query()->where('status', 'verified')->count(),
            'rejected' => Payment::query()->where('status', 'rejected')->count(),
        ];

        $mocked = false;

        return [
            'migrationRequired' => false,
            'mocked' => $mocked,
            'filters' => ['search' => $search],
            'summary' => $summary,
            'verifications' => $pending,
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
                'mocked' => false,
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ];
        }

        $rawFrom = $dateFrom;
        $rawTo = $dateTo;
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

        $mocked = false;

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
            'mocked' => $mocked,
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
            'nominal_spp' => 2500000,
            'late_fee_per_day' => 50000,
            'grace_period_days' => 7,
            'auto_invoice_enabled' => true,
            'auto_reminder_enabled' => true,
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
            'nominal_spp' => (int) ($stored[$prefix . 'nominal_spp'] ?? $defaults['nominal_spp']),
            'late_fee_per_day' => (int) ($stored[$prefix . 'late_fee_per_day'] ?? $defaults['late_fee_per_day']),
            'grace_period_days' => (int) ($stored[$prefix . 'grace_period_days'] ?? $defaults['grace_period_days']),
            'auto_invoice_enabled' => ($stored[$prefix . 'auto_invoice_enabled'] ?? ($defaults['auto_invoice_enabled'] ? '1' : '0')) === '1',
            'auto_reminder_enabled' => ($stored[$prefix . 'auto_reminder_enabled'] ?? ($defaults['auto_reminder_enabled'] ? '1' : '0')) === '1',
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

    private function mockStudents(): array
    {
        return [
            ['id' => 601, 'name' => 'Rani Lestari', 'code' => 'NIM2024551', 'is_mock' => true],
            ['id' => 602, 'name' => 'Agus Saputra', 'code' => 'NIM2024552', 'is_mock' => true],
        ];
    }

    private function mockFeeComponents(): array
    {
        return [
            ['id' => 701, 'name' => 'SPP Semester', 'code' => 'SPP', 'amount' => 2500000, 'is_mock' => true],
            ['id' => 702, 'name' => 'Biaya Praktikum', 'code' => 'PRK', 'amount' => 750000, 'is_mock' => true],
        ];
    }

    private function mockInvoices(array $students, array $components): array
    {
        $student = $students[0] ?? ['id' => 601, 'name' => 'Rani Lestari', 'code' => 'NIM2024551'];
        $component = $components[0] ?? ['id' => 701, 'name' => 'SPP Semester', 'code' => 'SPP', 'amount' => 2500000];

        return [
            [
                'id' => 801,
                'invoice_no' => 'INV-202603-0001',
                'title' => 'Tagihan SPP Semester Genap',
                'description' => 'Pembayaran semester genap.',
                'status' => 'unpaid',
                'amount' => $component['amount'],
                'due_date' => now()->addDays(10)->toDateString(),
                'student_id' => $student['id'],
                'fee_component_id' => $component['id'],
                'student' => $student,
                'fee_component' => $component,
                'is_mock' => true,
            ],
            [
                'id' => 802,
                'invoice_no' => 'INV-202603-0002',
                'title' => 'Tagihan Praktikum',
                'description' => 'Biaya praktikum lab.',
                'status' => 'partial',
                'amount' => 750000,
                'due_date' => now()->addDays(5)->toDateString(),
                'student_id' => $student['id'],
                'fee_component_id' => $components[1]['id'] ?? $component['id'],
                'student' => $student,
                'fee_component' => $components[1] ?? $component,
                'is_mock' => true,
            ],
        ];
    }

    private function mockPayments(array $students, array $invoices): array
    {
        $student = $students[0] ?? ['id' => 601, 'name' => 'Rani Lestari', 'code' => 'NIM2024551'];
        $invoice = $invoices[0] ?? ['id' => 801, 'invoice_no' => 'INV-202603-0001', 'title' => 'Tagihan SPP Semester Genap', 'status' => 'unpaid', 'amount' => 2500000];

        return [
            [
                'id' => 901,
                'payment_no' => 'PAY-202603-0001',
                'status' => 'pending',
                'amount' => 1250000,
                'method' => 'bank_transfer',
                'paid_at' => now()->subDays(1)->toISOString(),
                'invoice_id' => $invoice['id'],
                'student_id' => $student['id'],
                'invoice' => $invoice,
                'student' => $student,
                'is_mock' => true,
            ],
            [
                'id' => 902,
                'payment_no' => 'PAY-202603-0002',
                'status' => 'verified',
                'amount' => 750000,
                'method' => 'virtual_account',
                'paid_at' => now()->subDays(3)->toISOString(),
                'invoice_id' => $invoice['id'],
                'student_id' => $student['id'],
                'invoice' => $invoice,
                'student' => $student,
                'is_mock' => true,
            ],
        ];
    }

    private function mockReports(): array
    {
        return [
            'summary' => [
                'verified_income' => 4200000,
                'pending_amount' => 900000,
                'receivables' => 5200000,
                'total_invoices' => 18,
            ],
            'top_unpaid' => [
                [
                    'id' => 9901,
                    'invoice_no' => 'INV-202603-0042',
                    'student_id' => 601,
                    'amount' => 2500000,
                    'due_date' => now()->addDays(7)->toDateString(),
                    'status' => 'overdue',
                    'student' => ['name' => 'Rani Lestari'],
                    'is_mock' => true,
                ],
                [
                    'id' => 9902,
                    'invoice_no' => 'INV-202603-0043',
                    'student_id' => 602,
                    'amount' => 1800000,
                    'due_date' => now()->addDays(12)->toDateString(),
                    'status' => 'unpaid',
                    'student' => ['name' => 'Agus Saputra'],
                    'is_mock' => true,
                ],
            ],
            'cashflow' => collect(range(0, 5))
                ->map(function (int $offset) {
                    $date = now()->subMonths(5 - $offset);
                    return [
                        'month' => $date->translatedFormat('M Y'),
                        'verified' => 700000 + ($offset * 250000),
                        'pending' => 200000 + ($offset * 120000),
                    ];
                })
                ->values()
                ->all(),
        ];
    }
}



