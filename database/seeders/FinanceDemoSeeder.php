<?php

namespace Database\Seeders;

use App\Models\FeeComponent;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class FinanceDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (
            !Schema::hasTable('fee_components') ||
            !Schema::hasTable('invoices') ||
            !Schema::hasTable('users')
        ) {
            return;
        }

        if (Invoice::query()->where('title', 'like', 'Demo Piutang%')->exists()) {
            return;
        }

        $students = User::query()->where('role', 'student')->orderBy('id')->get();
        if ($students->isEmpty()) {
            return;
        }

        $finance = User::query()->where('role', 'finance')->first();

        $components = [
            ['name' => 'UKT Semester', 'code' => 'UKT-SEM', 'amount' => 3500000, 'type' => 'recurring'],
            ['name' => 'Praktikum Lab', 'code' => 'LAB-FEE', 'amount' => 750000, 'type' => 'one_time'],
            ['name' => 'Ujian Akhir', 'code' => 'UAS-FEE', 'amount' => 500000, 'type' => 'one_time'],
        ];

        foreach ($components as $component) {
            FeeComponent::firstOrCreate(['code' => $component['code']], $component);
        }

        $componentMap = FeeComponent::query()->pluck('id', 'code');

        $seedInvoices = [
            [
                'title' => 'Demo Piutang UKT Semester',
                'description' => 'Tagihan UKT semester berjalan',
                'amount' => 4500000,
                'due_date' => now()->subDays(10)->toDateString(),
                'status' => 'overdue',
                'fee_component_code' => 'UKT-SEM',
            ],
            [
                'title' => 'Demo Piutang Praktikum',
                'description' => 'Tagihan praktikum lab',
                'amount' => 1250000,
                'due_date' => now()->addDays(7)->toDateString(),
                'status' => 'unpaid',
                'fee_component_code' => 'LAB-FEE',
            ],
            [
                'title' => 'Demo Piutang Ujian Akhir',
                'description' => 'Tagihan ujian akhir semester',
                'amount' => 950000,
                'due_date' => now()->addDays(14)->toDateString(),
                'status' => 'unpaid',
                'fee_component_code' => 'UAS-FEE',
            ],
            [
                'title' => 'Demo Piutang UKT Cicilan',
                'description' => 'Tagihan UKT dengan cicilan',
                'amount' => 3200000,
                'due_date' => now()->subDays(3)->toDateString(),
                'status' => 'partial',
                'fee_component_code' => 'UKT-SEM',
            ],
            [
                'title' => 'Demo Piutang Praktikum Lanjutan',
                'description' => 'Tagihan praktikum lanjutan',
                'amount' => 1750000,
                'due_date' => now()->addDays(21)->toDateString(),
                'status' => 'unpaid',
                'fee_component_code' => 'LAB-FEE',
            ],
            [
                'title' => 'Demo Piutang Ujian Susulan',
                'description' => 'Tagihan ujian susulan',
                'amount' => 1100000,
                'due_date' => now()->subDays(1)->toDateString(),
                'status' => 'overdue',
                'fee_component_code' => 'UAS-FEE',
            ],
        ];

        foreach ($seedInvoices as $index => $seed) {
            $student = $students[$index % $students->count()];
            $invoiceNo = sprintf('INV-DEMO-%s-%03d', now()->format('ymd'), $index + 1);

            Invoice::create([
                'invoice_no' => $invoiceNo,
                'student_id' => $student->id,
                'fee_component_id' => $componentMap[$seed['fee_component_code']] ?? null,
                'title' => $seed['title'],
                'description' => $seed['description'],
                'amount' => $seed['amount'],
                'due_date' => $seed['due_date'],
                'status' => $seed['status'],
                'created_by' => $finance?->id,
            ]);
        }
    }
}
