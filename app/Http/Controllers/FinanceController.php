<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Finance\StoreInvoiceRequest;
use App\Http\Requests\Finance\StorePaymentRequest;
use App\Http\Requests\Finance\UpdateInvoiceRequest;
use App\Http\Requests\Finance\UpdateSettingsRequest;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\FinanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function __construct(
        private readonly FinanceService $service
    ) {
    }

    public function invoices(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));

        return Inertia::render('Finance/Invoices', $this->service->getInvoicesData($search, $status));
    }

    public function storeInvoice(StoreInvoiceRequest $request): RedirectResponse
    {
        if (!$this->service->hasFinanceTables()) {
            return back()->withErrors([
                'finance' => 'Tabel finance belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->createInvoice($request->validated(), (int) auth()->id());

        return back()->with('success', 'Tagihan berhasil dibuat.');
    }

    public function updateInvoice(UpdateInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        if (!$this->service->hasFinanceTables()) {
            return back()->withErrors([
                'finance' => 'Tabel finance belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->updateInvoice($invoice, $request->validated());

        return back()->with('success', 'Tagihan berhasil diperbarui.');
    }

    public function destroyInvoice(Invoice $invoice): RedirectResponse
    {
        if (!$this->service->hasFinanceTables()) {
            return back()->withErrors([
                'finance' => 'Tabel finance belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->deleteInvoice($invoice);

        return back()->with('success', 'Tagihan berhasil dihapus.');
    }

    public function payments(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));

        return Inertia::render('Finance/Payments', $this->service->getPaymentsData($search, $status));
    }

    public function verifications(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('Finance/Verifications', $this->service->getVerificationData($search));
    }

    public function storePayment(StorePaymentRequest $request): RedirectResponse
    {
        if (!$this->service->hasFinanceTables()) {
            return back()->withErrors([
                'finance' => 'Tabel finance belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->createPayment($request->validated(), (int) auth()->id());

        return back()->with('success', 'Pembayaran berhasil dicatat.');
    }

    public function verifyPayment(Payment $payment): RedirectResponse
    {
        if (!$this->service->hasFinanceTables()) {
            return back()->withErrors([
                'finance' => 'Tabel finance belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->verifyPayment($payment, (int) auth()->id());

        return back()->with('success', 'Pembayaran berhasil diverifikasi.');
    }

    public function rejectPayment(Payment $payment): RedirectResponse
    {
        if (!$this->service->hasFinanceTables()) {
            return back()->withErrors([
                'finance' => 'Tabel finance belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->rejectPayment($payment, (int) auth()->id());

        return back()->with('success', 'Pembayaran ditandai ditolak.');
    }

    public function reports(Request $request): Response
    {
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        return Inertia::render('Finance/Reports', $this->service->getReportsData($dateFrom, $dateTo));
    }

    public function settings(): Response
    {
        return Inertia::render('Finance/Settings', [
            'settings' => $this->service->getSettings((int) auth()->id()),
            'migrationRequired' => !$this->service->hasFinanceTables(),
        ]);
    }

    public function updateSettings(UpdateSettingsRequest $request): RedirectResponse
    {
        $updated = $this->service->updateSettings((int) auth()->id(), $request->validated());
        if (!$updated) {
            return back()->withErrors([
                'settings' => 'Tabel system_settings belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        return back()->with('success', 'Pengaturan finance berhasil diperbarui.');
    }
}
