import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    BarChart3,
    Download,
    Landmark,
    ReceiptText,
    TrendingDown,
    TrendingUp,
    TriangleAlert,
    Wallet,
} from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const PERIOD_OPTIONS = [
    { key: 'monthly', label: 'Bulanan', days: 30 },
    { key: 'quarterly', label: 'Kuartalan', days: 90 },
    { key: 'yearly', label: 'Tahunan', days: 365 },
];

export default function Reports({
    migrationRequired,
    summary,
    summary_changes,
    top_unpaid = [],
    cashflow = [],
    payment_methods = [],
    receivable_by_component = [],
    filters,
    mocked,
}) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const [activePeriod, setActivePeriod] = useState('monthly');

    const currency = (value) => `Rp ${new Intl.NumberFormat(intlLocale).format(Number(value ?? 0))}`;

    const trendData = useMemo(() => {
        return (cashflow || []).map((item) => ({
            label: String(item.month ?? '').replace(/\s\d{4}$/, ''),
            income: Number(item.verified ?? 0),
            expense: Number(item.pending ?? 0),
        }));
    }, [cashflow]);

    const methodData = useMemo(() => {
        const palette = ['#6D28D9', '#10B981', '#F59E0B', '#3B82F6', '#F43F5E', '#94A3B8'];
        return payment_methods.map((item, index) => ({
            label: item.label,
            value: Number(item.value ?? 0),
            color: palette[index % palette.length],
        }));
    }, [payment_methods]);

    const expenseData = useMemo(() => {
        return receivable_by_component.map((item) => ({
            label: item.label,
            value: Number(item.value ?? 0),
        }));
    }, [receivable_by_component]);

    const applyPeriod = (period) => {
        setActivePeriod(period.key);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - period.days);

        router.get(
            '/finance-reports',
            {
                date_from: toDateInput(start),
                date_to: toDateInput(end),
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const exportCsv = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Date From', filters?.date_from ?? '-'],
            ['Date To', filters?.date_to ?? '-'],
            ['Verified Income', Number(summary?.verified_income ?? 0)],
            ['Pending Amount', Number(summary?.pending_amount ?? 0)],
            ['Receivables', Number(summary?.receivables ?? 0)],
            ['Total Invoices', Number(summary?.total_invoices ?? 0)],
            ['Verified Payments', Number(summary?.verified_payments ?? 0)],
            ['Pending Payments', Number(summary?.pending_payments ?? 0)],
            [],
            ['Cashflow'],
            ['Month', 'Verified', 'Pending'],
            ...trendData.map((item) => [item.label, item.income, item.expense]),
            [],
            ['Top Unpaid'],
            ['Invoice', 'Student', 'Amount', 'Status', 'Due Date'],
            ...top_unpaid.map((item) => [item.invoice_no, item.student?.name ?? '-', Number(item.amount ?? 0), item.status ?? '-', item.due_date ?? '-']),
        ];

        const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan-keuangan-${filters?.date_from ?? 'awal'}-${filters?.date_to ?? 'akhir'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <ProtectedLayout>
            <Head title="Laporan Keuangan" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Laporan Keuangan"
                    description="Ringkasan finansial dan analisis pendapatan platform"
                    icon={BarChart3}
                    action={(
                        <>
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                                {PERIOD_OPTIONS.map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => applyPeriod(option)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${activePeriod === option.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </>
                    )}
                />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data contoh ditampilkan untuk evaluasi template laporan keuangan.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel finance belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <FinanceStatCard title="Total Pendapatan" value={currency(summary?.verified_income)} meta={summary_changes?.verified_income ?? '0% dari periode sebelumnya'} tone="gradient-success" icon={Wallet} />
                    <FinanceStatCard title="Total Tagihan Periode" value={new Intl.NumberFormat(intlLocale).format(Number(summary?.total_invoices ?? 0))} meta={summary_changes?.total_invoices ?? '0% dari periode sebelumnya'} tone="gradient-primary" icon={ReceiptText} />
                    <FinanceStatCard title="Tunggakan Pending" value={currency(summary?.pending_amount)} meta={`${summary?.pending_payments ?? 0} transaksi pending`} tone="bg-gradient-to-r from-pink-600 to-rose-500" icon={TrendingDown} />
                    <FinanceStatCard title="Total Piutang" value={currency(summary?.receivables)} meta={summary_changes?.receivables ?? '0% dari periode sebelumnya'} tone="gradient-accent" icon={Landmark} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1fr] gap-4 items-stretch">
                    <section className="panel-card p-4">
                        <h2 className="font-semibold text-2xl mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Tren Pemasukan vs Pengeluaran (Juta)
                        </h2>
                        <div className="panel-subcard p-4">
                            <ComparisonAreaChart data={trendData} locale={intlLocale} />
                        </div>
                    </section>

                    <section className="panel-card p-4">
                        <h2 className="font-semibold text-2xl mb-4">Distribusi Metode Pembayaran</h2>
                        <div className="panel-subcard p-4 h-full">
                            <PieBreakdown data={methodData} locale={intlLocale} />
                        </div>
                    </section>
                </div>

                <section className="panel-card p-4">
                    <h2 className="font-semibold text-2xl mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-pink-500" />
                        Piutang per Komponen
                    </h2>
                    <div className="panel-subcard p-4">
                        <ExpenseBarChart data={expenseData} locale={intlLocale} />
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}

function FinanceStatCard({ title, value, meta, tone, icon: Icon }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card ${tone}`}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/15 grid place-items-center">
                <Icon className="w-5 h-5 text-white/90" />
            </div>
            <p className="text-sm text-white/85">{title}</p>
            <p className="mt-1 text-4xl leading-none font-bold">{value}</p>
            <p className="text-sm text-white/85 mt-2">{meta}</p>
        </div>
    );
}

function ComparisonAreaChart({ data, locale }) {
    const rows = data.length ? data : [{ label: '-', income: 0, expense: 0 }];

    const width = 1000;
    const height = 260;
    const padX = 56;
    const padY = 24;

    const maxValue = Math.max(...rows.flatMap((row) => [row.income, row.expense]), 1);
    const minValue = 0;
    const range = Math.max(maxValue - minValue, 1);

    const pointFor = (index, value) => {
        const x = padX + (index * (width - padX * 2)) / Math.max(rows.length - 1, 1);
        const y = height - padY - ((value - minValue) / range) * (height - padY * 2);
        return { x, y };
    };

    const incomePoints = rows.map((row, index) => pointFor(index, row.income));
    const expensePoints = rows.map((row, index) => pointFor(index, row.expense));

    const linePath = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `M ${incomePoints[0].x} ${height - padY} ${incomePoints.map((point) => `L ${point.x} ${point.y}`).join(' ')} L ${incomePoints[incomePoints.length - 1].x} ${height - padY} Z`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
                <defs>
                    <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                    const y = padY + (height - padY * 2) * ratio;
                    return <line key={ratio} x1={padX} y1={y} x2={width - padX} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
                })}

                <path d={areaPath} fill="url(#incomeFill)" />
                <path d={linePath(incomePoints)} stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d={linePath(expensePoints)} stroke="#F43F5E" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                {incomePoints.map((point, index) => (
                    <circle key={`income-${index}`} cx={point.x} cy={point.y} r="3" fill="#10B981" />
                ))}
                {expensePoints.map((point, index) => (
                    <circle key={`expense-${index}`} cx={point.x} cy={point.y} r="2.5" fill="#F43F5E" />
                ))}

                {rows.map((row, index) => {
                    const x = padX + (index * (width - padX * 2)) / Math.max(rows.length - 1, 1);
                    return (
                        <text key={row.label + index} x={x} y={height - 2} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                            {row.label}
                        </text>
                    );
                })}
            </svg>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground mt-2">
                <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />Pemasukan</span>
                <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />Pengeluaran</span>
                <span>Tertinggi: {new Intl.NumberFormat(locale).format(Math.max(...rows.map((item) => item.income)))}</span>
            </div>
        </div>
    );
}

function PieBreakdown({ data, locale }) {
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
    let accumulator = 0;
    const slices = data.map((item) => {
        const fraction = total > 0 ? Number(item.value || 0) / total : 0;
        const start = accumulator;
        accumulator += fraction;
        return {
            ...item,
            start,
            end: accumulator,
        };
    });

    return (
        <div className="grid grid-cols-1 gap-4 h-full">
            <div className="h-[140px] flex items-center justify-center">
                <svg viewBox="0 0 180 180" className="h-full w-full max-w-[180px]">
                    {slices.map((slice) => (
                        <path
                            key={slice.label}
                            d={pieSlicePath(90, 90, 62, slice.start * 360, slice.end * 360)}
                            fill={slice.color}
                        />
                    ))}
                </svg>
            </div>

            <div className="space-y-2">
                {data.map((item) => {
                    const percent = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;
                    return (
                        <div key={item.label} className="flex items-center justify-between gap-2 text-sm">
                            <div className="inline-flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="truncate">{item.label}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{percent.toFixed(0)}%</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-xs text-muted-foreground">
                Total pendapatan: <span className="font-semibold text-foreground">Rp {new Intl.NumberFormat(locale).format(total)}</span>
            </div>
        </div>
    );
}

function ExpenseBarChart({ data, locale }) {
    const rows = data.length ? data : [];
    const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);

    return (
        <div className="space-y-3">
            {rows.map((item, index) => {
                const width = Math.max((Number(item.value || 0) / maxValue) * 100, 3);
                return (
                    <div key={item.label} className="grid grid-cols-[18px_1fr_120px_56px] items-center gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">{index + 1}</span>
                        <div className="space-y-1.5">
                            <p className="font-medium">{item.label}</p>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: `${width}%` }} />
                            </div>
                        </div>
                        <p className="text-right text-muted-foreground">{new Intl.NumberFormat(locale).format(item.value)}</p>
                        <p className="text-right font-semibold">{Math.round((Number(item.value || 0) / maxValue) * 100)}%</p>
                    </div>
                );
            })}
        </div>
    );
}

function pieSlicePath(cx, cy, r, startAngle, endAngle) {
    const start = polar(cx, cy, r, endAngle);
    const end = polar(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function polar(cx, cy, r, angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function toDateInput(dateObj) {
    return dateObj.toISOString().slice(0, 10);
}
