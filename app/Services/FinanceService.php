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
                'ewallet' => 'E-Wallet',
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
            ->with(['student:id,name,code,email', 'feeComponent:id,name,code'])
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
        $settings = $this->getSettings($creatorId);
        $data['invoice_no'] = $this->generateInvoiceNo();
        $data['created_by'] = $creatorId;
        $data['status'] = $data['status'] ?? 'unpaid';
        if (empty($data['due_date'])) {
            $dueDays = max(1, (int) ($settings['default_due_days'] ?? 14));
            $data['due_date'] = now()->addDays($dueDays)->toDateString();
        }

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
            ->with(['invoice:id,invoice_no,title,status,amount', 'student:id,name,code,email'])
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
                'student:id,name,code,email',
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

    public function createPayment(array $payload, int $actorId): void
    {
        DB::transaction(function () use ($payload, $actorId) {
            $data = $payload;
            $settings = $this->getSettings($actorId);
            $autoVerify = (bool) ($settings['auto_verify_payment'] ?? false);
            $data['payment_no'] = $this->generatePaymentNo();
            if (empty($data['paid_at'])) {
                $data['paid_at'] = now()->toDateTimeString();
            }
            if ($autoVerify) {
                $data['status'] = 'verified';
                $data['verified_by'] = $actorId;
            }
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
                    'verified_payments' => 0,
                    'pending_payments' => 0,
                ],
                'summary_changes' => [
                    'verified_income' => '0% dari periode sebelumnya',
                    'pending_amount' => '0% dari periode sebelumnya',
                    'receivables' => '0% dari periode sebelumnya',
                    'total_invoices' => '0% dari periode sebelumnya',
                ],
                'top_unpaid' => [],
                'cashflow' => [],
                'payment_methods' => [],
                'receivable_by_component' => [],
                'mocked' => false,
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ];
        }

        $from = $dateFrom ? now()->parse($dateFrom)->startOfDay() : now()->startOfMonth();
        $to = $dateTo ? now()->parse($dateTo)->endOfDay() : now()->endOfDay();
        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $rangeDays = max(1, $from->diffInDays($to) + 1);
        $previousTo = $from->copy()->subSecond();
        $previousFrom = $previousTo->copy()->subDays($rangeDays - 1)->startOfDay();

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
        $verifiedPayments = (int) Payment::query()
            ->where('status', 'verified')
            ->whereBetween('paid_at', [$from, $to])
            ->count();
        $pendingPayments = (int) Payment::query()
            ->where('status', 'pending')
            ->whereBetween('created_at', [$from, $to])
            ->count();
        $totalInvoices = (int) Invoice::query()
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $previousVerifiedIncome = (float) Payment::query()
            ->where('status', 'verified')
            ->whereBetween('paid_at', [$previousFrom, $previousTo])
            ->sum('amount');
        $previousPendingAmount = (float) Payment::query()
            ->where('status', 'pending')
            ->whereBetween('created_at', [$previousFrom, $previousTo])
            ->sum('amount');
        $previousReceivables = (float) Invoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->where('created_at', '<=', $previousTo)
            ->sum('amount');
        $previousTotalInvoices = (int) Invoice::query()
            ->whereBetween('created_at', [$previousFrom, $previousTo])
            ->count();

        $topUnpaid = Invoice::query()
            ->with('student:id,name,code')
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->orderByDesc('amount')
            ->limit(10)
            ->get(['id', 'invoice_no', 'student_id', 'amount', 'due_date', 'status']);

        $paymentMethodLabels = [
            'bank_transfer' => 'Transfer Bank',
            'virtual_account' => 'Virtual Account',
            'ewallet' => 'E-Wallet',
            'cash' => 'Tunai',
        ];
        $paymentMethods = Payment::query()
            ->selectRaw('method, COUNT(*) as total')
            ->where('status', 'verified')
            ->whereBetween('paid_at', [$from, $to])
            ->whereNotNull('method')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) use ($paymentMethodLabels): array {
                $method = (string) $row->method;
                return [
                    'label' => $paymentMethodLabels[$method] ?? ucwords(str_replace('_', ' ', $method)),
                    'value' => (int) $row->total,
                ];
            })
            ->values()
            ->all();

        $receivableByComponent = Invoice::query()
            ->leftJoin('fee_components', 'fee_components.id', '=', 'invoices.fee_component_id')
            ->whereIn('invoices.status', ['unpaid', 'partial', 'overdue'])
            ->selectRaw("COALESCE(NULLIF(TRIM(fee_components.name), ''), 'Lainnya') as label")
            ->selectRaw('SUM(invoices.amount) as total_amount')
            ->groupBy('label')
            ->orderByDesc('total_amount')
            ->limit(6)
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->label,
                'value' => (float) ($row->total_amount ?? 0),
            ])
            ->values()
            ->all();

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
                'total_invoices' => $totalInvoices,
                'verified_payments' => $verifiedPayments,
                'pending_payments' => $pendingPayments,
            ],
            'summary_changes' => [
                'verified_income' => $this->formatPercentDelta($verifiedIncome, $previousVerifiedIncome),
                'pending_amount' => $this->formatPercentDelta($pendingAmount, $previousPendingAmount),
                'receivables' => $this->formatPercentDelta($receivables, $previousReceivables),
                'total_invoices' => $this->formatPercentDelta($totalInvoices, $previousTotalInvoices),
            ],
            'top_unpaid' => $topUnpaid,
            'cashflow' => $cashflow,
            'payment_methods' => $paymentMethods,
            'receivable_by_component' => $receivableByComponent,
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
            'bank_name' => 'Bank Negara Indonesia',
            'bank_account_name' => 'Smart Learning',
            'bank_account_number' => '',
            'finance_contact_email' => 'finance@univ.ac.id',
            'finance_contact_phone' => '',
            'notify_on_new_registration' => true,
            'notify_on_invoice_created' => true,
            'notify_on_payment_verified' => true,
            'security_require_note_on_reject' => true,
            'security_allow_manual_invoice_status' => true,
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
            'bank_name' => (string) ($stored[$prefix . 'bank_name'] ?? $defaults['bank_name']),
            'bank_account_name' => (string) ($stored[$prefix . 'bank_account_name'] ?? $defaults['bank_account_name']),
            'bank_account_number' => (string) ($stored[$prefix . 'bank_account_number'] ?? $defaults['bank_account_number']),
            'finance_contact_email' => (string) ($stored[$prefix . 'finance_contact_email'] ?? $defaults['finance_contact_email']),
            'finance_contact_phone' => (string) ($stored[$prefix . 'finance_contact_phone'] ?? $defaults['finance_contact_phone']),
            'notify_on_new_registration' => ($stored[$prefix . 'notify_on_new_registration'] ?? ($defaults['notify_on_new_registration'] ? '1' : '0')) === '1',
            'notify_on_invoice_created' => ($stored[$prefix . 'notify_on_invoice_created'] ?? ($defaults['notify_on_invoice_created'] ? '1' : '0')) === '1',
            'notify_on_payment_verified' => ($stored[$prefix . 'notify_on_payment_verified'] ?? ($defaults['notify_on_payment_verified'] ? '1' : '0')) === '1',
            'security_require_note_on_reject' => ($stored[$prefix . 'security_require_note_on_reject'] ?? ($defaults['security_require_note_on_reject'] ? '1' : '0')) === '1',
            'security_allow_manual_invoice_status' => ($stored[$prefix . 'security_allow_manual_invoice_status'] ?? ($defaults['security_allow_manual_invoice_status'] ? '1' : '0')) === '1',
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

    private function formatPercentDelta(float|int $current, float|int $previous): string
    {
        $currentValue = (float) $current;
        $previousValue = (float) $previous;

        if ($previousValue <= 0.0) {
            if ($currentValue <= 0.0) {
                return '0% dari periode sebelumnya';
            }

            return 'Data pembanding belum cukup';
        }

        $delta = round((($currentValue - $previousValue) / $previousValue) * 100, 1);
        $sign = $delta > 0 ? '+' : '';

        return $sign . number_format($delta, 1) . '% dari periode sebelumnya';
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



