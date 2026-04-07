<?php

namespace App\Console\Commands;

use App\Services\AdminAcademicService;
use Illuminate\Console\Command;

class BackfillStudentInvoices extends Command
{
    protected $signature = 'finance:backfill-student-invoices {--dry-run : Simulasikan hasil tanpa membuat invoice}';

    protected $description = 'Backfill tagihan otomatis untuk mahasiswa yang sudah diverifikasi admin universitas.';

    public function __construct(
        private readonly AdminAcademicService $adminAcademicService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $result = $this->adminAcademicService->backfillApprovedStudentInvoices($dryRun);

        if (!($result['ok'] ?? false)) {
            $this->error((string) ($result['message'] ?? 'Backfill gagal diproses.'));
            return self::FAILURE;
        }

        $mode = $dryRun ? 'DRY RUN' : 'EXECUTE';
        $this->info("Backfill student invoices ({$mode}) selesai.");
        $this->line('Total mahasiswa terverifikasi: ' . (int) ($result['total'] ?? 0));
        $this->line(($dryRun ? 'Akan dibuat' : 'Dibuat') . ': ' . (int) ($result['created'] ?? 0));
        $this->line('Dilewati: ' . (int) ($result['skipped'] ?? 0));

        return self::SUCCESS;
    }
}
