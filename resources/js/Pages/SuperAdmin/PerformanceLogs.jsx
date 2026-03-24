import { Head, router } from '@inertiajs/react';
import { Activity, Download, Filter, Gauge, Timer, ShieldCheck } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';

const formatValue = (value, unit) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
    if (unit === 'score') return Number(value).toFixed(3);
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(value));
};

function MetricCard({ title, value, helper, tone = 'primary', icon: Icon = Gauge }) {
    const tones = {
        primary: 'gradient-primary',
        accent: 'gradient-accent',
        success: 'gradient-success',
        warm: 'gradient-warm',
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card-lg ${tones[tone] ?? tones.primary}`}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm text-white/85">{title}</p>
            <p className="mt-1 text-4xl leading-none font-bold">{value}</p>
            <p className="mt-2 text-xs text-white/85">{helper}</p>
        </div>
    );
}

export default function PerformanceLogs({ files = [], selected_file, entries = [], summary, mocked }) {
    const handleFileChange = (event) => {
        const file = event.target.value;
        router.visit(`/perf-logs?file=${encodeURIComponent(file)}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const groupedByMetric = entries.reduce((acc, entry) => {
        const metric = String(entry.metric ?? '').toUpperCase();
        if (!metric) return acc;
        if (!acc[metric]) acc[metric] = [];
        acc[metric].push(entry);
        return acc;
    }, {});

    const metricValue = (metric) => {
        const list = groupedByMetric[metric] ?? [];
        if (!list.length) return '-';
        const last = list[list.length - 1];
        return `${formatValue(last.value, last.unit)}${last.unit && last.unit !== 'score' ? ` ${last.unit}` : ''}`;
    };

    const buildSeries = (metric, limit = 12) => {
        const list = (groupedByMetric[metric] ?? []).slice(-limit);
        return list.map((item, idx) => ({
            label: item.timestamp ? new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : `#${idx + 1}`,
            value: Number(item.value) || 0,
        }));
    };

    const lcpSeries = buildSeries('LCP');
    const clsSeries = buildSeries('CLS');
    const tbtSeries = buildSeries('TBT');
    const fcpSeries = buildSeries('FCP');

    return (
        <ProtectedLayout>
            <Head title="Performance Logs" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Performance Logs"
                    description="Monitor performa dan kesehatan sistem secara real-time."
                />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Activity className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <MetricCard title="LCP" value={metricValue('LCP')} helper="Largest Contentful Paint" tone="primary" icon={Gauge} />
                    <MetricCard title="CLS" value={metricValue('CLS')} helper="Cumulative Layout Shift" tone="accent" icon={Gauge} />
                    <MetricCard title="TBT" value={metricValue('TBT')} helper="Total Blocking Time" tone="warm" icon={Timer} />
                    <MetricCard title="FCP" value={metricValue('FCP')} helper="First Contentful Paint" tone="success" icon={ShieldCheck} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <InteractiveTrendChart
                        title="CPU & Memory (24 Jam)"
                        data={lcpSeries.length ? lcpSeries : clsSeries}
                        tone="primary"
                        chartType="line"
                        valueFormatter={(value) => formatValue(value, '')}
                    />
                    <InteractiveTrendChart
                        title="Response Time API & DB"
                        data={tbtSeries.length ? tbtSeries : fcpSeries}
                        tone="success"
                        chartType="line"
                        valueFormatter={(value) => formatValue(value, '')}
                    />
                </div>

                <div className="panel-card p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-xl">Status Layanan</h3>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <select
                                    value={selected_file || ''}
                                    onChange={handleFileChange}
                                    className="w-full min-w-[220px] pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {files.map((file) => (
                                        <option key={file.file} value={file.file}>
                                            {file.date}
                                        </option>
                                    ))}
                                    {!files.length && <option value="">Belum ada file log</option>}
                                </select>
                            </div>
                            {selected_file && !mocked && (
                                <a
                                    href={`/perf-logs/download?file=${encodeURIComponent(selected_file)}`}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-95 transition"
                                >
                                    <Download className="w-4 h-4" />
                                    Unduh Log
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ServiceCard title="Web Server" metrics={[`Total Entry ${summary?.total ?? 0}`, `LCP ${summary?.by_metric?.LCP ?? 0}`]} status="Normal" />
                        <ServiceCard title="Database" metrics={[`CLS ${summary?.by_metric?.CLS ?? 0}`, `TBT ${summary?.by_metric?.TBT ?? 0}`]} status="Normal" />
                        <ServiceCard title="Auth Service" metrics={[`FCP ${summary?.by_metric?.FCP ?? 0}`, summary?.latest ? `Terakhir ${summary.latest}` : 'Belum ada data']} status="Normal" />
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function ServiceCard({ title, metrics = [], status = 'Normal' }) {
    return (
        <div className="panel-subcard p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{title}</p>
                <span className="text-sm font-medium text-success">{status}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {metrics.map((item) => (
                    <p key={item}>{item}</p>
                ))}
            </div>
        </div>
    );
}
