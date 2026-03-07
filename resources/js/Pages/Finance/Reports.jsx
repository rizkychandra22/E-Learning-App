import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FileBarChart2, TriangleAlert } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

export default function Reports({ migrationRequired, summary, top_unpaid, cashflow, filters }) {
    const [dateFrom, setDateFrom] = useState(filters?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters?.date_to ?? '');

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-reports', { date_from: dateFrom, date_to: dateTo }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Laporan Finance" />
            <div className="space-y-6 max-w-7xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Laporan Finance</h1>
                    <p className="text-muted-foreground mt-1">Ringkasan pemasukan, piutang, dan cashflow</p>
                </div>

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel finance belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="bg-card border border-border rounded-xl shadow-card p-4">
                    <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-2 md:items-end">
                        <label className="block md:w-52">
                            <span className="text-sm font-medium">Tanggal Dari</span>
                            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </label>
                        <label className="block md:w-52">
                            <span className="text-sm font-medium">Tanggal Sampai</span>
                            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </label>
                        <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Terapkan</button>
                    </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <SummaryCard title="Pemasukan Tervalidasi" value={summary?.verified_income ?? 0} />
                    <SummaryCard title="Nominal Pending" value={summary?.pending_amount ?? 0} />
                    <SummaryCard title="Piutang Aktif" value={summary?.receivables ?? 0} />
                    <SummaryCard title="Total Invoice" value={summary?.total_invoices ?? 0} plain />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="bg-card border border-border rounded-xl shadow-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FileBarChart2 className="w-4 h-4 text-primary" />
                            <h2 className="font-semibold">Cashflow 6 Bulan</h2>
                        </div>
                        <div className="space-y-3">
                            {cashflow.map((item) => (
                                <div key={item.month}>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>{item.month}</span>
                                        <span className="font-medium text-foreground">In: {new Intl.NumberFormat('id-ID').format(item.verified ?? 0)} | Pending: {new Intl.NumberFormat('id-ID').format(item.pending ?? 0)}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full gradient-success" style={{ width: `${Math.max((item.verified / Math.max(...cashflow.map((flow) => flow.verified), 1)) * 100, item.verified > 0 ? 8 : 0)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold">Top Piutang</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[540px]">
                                <thead className="bg-secondary/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Invoice</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Mahasiswa</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Amount</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top_unpaid.map((item) => (
                                        <tr key={item.id} className="border-t border-border">
                                            <td className="px-4 py-3 text-sm">{item.invoice_no}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{item.student?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{new Intl.NumberFormat('id-ID').format(item.amount ?? 0)}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{item.status}</td>
                                        </tr>
                                    ))}
                                    {top_unpaid.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                                Tidak ada data piutang.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function SummaryCard({ title, value, plain = false }) {
    return (
        <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{plain ? value : new Intl.NumberFormat('id-ID').format(value ?? 0)}</p>
        </div>
    );
}
