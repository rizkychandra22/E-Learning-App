import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { TriangleAlert, Wallet, Clock3, BadgeAlert, FileText } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { KPI_CARD_BASE_CLASS, KPI_CARD_HEIGHT_CLASS } from '@/lib/card';

export default function Reports({ migrationRequired, summary, top_unpaid, cashflow, filters }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const cashflowData = cashflow.map((item) => ({
        label: item.month,
        value: Number(item.verified) || 0,
    }));
    const [dateFrom, setDateFrom] = useState(filters?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters?.date_to ?? '');

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-reports', { date_from: dateFrom, date_to: dateTo }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Laporan Finance" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Laporan Finance" description="Ringkasan pemasukan, piutang, dan cashflow" />

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
                    <SummaryCard title="Pemasukan Tervalidasi" value={summary?.verified_income ?? 0} icon={Wallet} variant="success" />
                    <SummaryCard title="Nominal Pending" value={summary?.pending_amount ?? 0} icon={Clock3} variant="warm" />
                    <SummaryCard title="Piutang Aktif" value={summary?.receivables ?? 0} icon={BadgeAlert} variant="accent" />
                    <SummaryCard title="Total Invoice" value={summary?.total_invoices ?? 0} plain icon={FileText} variant="primary" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <InteractiveTrendChart
                        title="Cashflow 6 Bulan (Verified)"
                        data={cashflowData}
                        tone="success"
                        valueFormatter={(value) => new Intl.NumberFormat(intlLocale).format(value)}
                    />

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
                                            <td className="px-4 py-3 text-sm font-medium">{new Intl.NumberFormat(intlLocale).format(item.amount ?? 0)}</td>
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

function SummaryCard({ title, value, plain = false, icon: Icon, variant = 'primary' }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const variantClass = {
        primary: 'gradient-primary text-primary-foreground',
        accent: 'gradient-accent text-accent-foreground',
        warm: 'gradient-warm text-foreground',
        success: 'gradient-success text-success-foreground',
    };

    return (
        <div className={`${KPI_CARD_BASE_CLASS} ${KPI_CARD_HEIGHT_CLASS}`}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground truncate">{title}</p>
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-card ${variantClass[variant] ?? variantClass.primary}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>
            <p className="text-[2rem] leading-none font-bold">{plain ? value : new Intl.NumberFormat(intlLocale).format(value ?? 0)}</p>
        </div>
    );
}


