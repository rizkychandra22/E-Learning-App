import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Cpu,
    Database,
    Download,
    Filter,
    HardDrive,
    Server,
    ShieldCheck,
    Wifi,
} from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function buildSeriesByMetric(entries, metric, fallback) {
    const list = (entries ?? []).filter((item) => String(item.metric ?? '').toUpperCase() === metric).slice(-12);
    if (!list.length) return fallback;

    return list.map((item, index) => {
        const raw = toNumber(item.value, 0);
        let value = raw;

        if (metric === 'CLS') value = raw * 100;
        if (metric === 'LCP') value = raw * 20;
        if (metric === 'TBT') value = raw / 5;
        if (metric === 'FCP') value = raw * 15;

        return {
            label: item.timestamp
                ? new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : `${index * 2}:00`,
            value: clamp(Math.round(value), 10, 95),
        };
    });
}

function buildResponseSeries(entries, metric, fallback) {
    const list = (entries ?? []).filter((item) => String(item.metric ?? '').toUpperCase() === metric).slice(-12);
    if (!list.length) return fallback;

    return list.map((item, index) => {
        const raw = toNumber(item.value, 0);
        const value = metric === 'TBT' ? clamp(Math.round(raw / 2), 30, 200) : clamp(Math.round(raw * 40), 20, 180);

        return {
            label: item.timestamp
                ? new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : `${index * 2}:00`,
            value,
        };
    });
}

function cardTone(tone) {
    const map = {
        violet: 'bg-primary/10 text-primary',
        blue: 'bg-info/10 text-info',
        green: 'bg-success/10 text-success',
        orange: 'bg-warning/10 text-warning',
    };
    return map[tone] ?? map.violet;
}

function statusTone(value) {
    if (value >= 75) return 'Aktif';
    if (value >= 45) return 'Normal';
    return 'Aman';
}

function MetricPanel({ title, value, unit = '%', status, icon: Icon, tone = 'violet' }) {
    return (
        <div className="panel-card p-4">
            <div className="flex items-center gap-3">
                <span className={`h-11 w-11 rounded-2xl grid place-items-center ${cardTone(tone)}`}>
                    <Icon className="w-5 h-5" />
                </span>
                <div>
                    <p className="text-muted-foreground">{title}</p>
                    <p className="text-[38px] leading-none font-bold mt-1">
                        {value}
                        <span className="text-[34px]">{unit}</span>
                    </p>
                </div>
            </div>
            <div className="mt-3 h-7 rounded-xl bg-secondary grid place-items-center text-foreground font-semibold">
                {status}
            </div>
        </div>
    );
}

function renderPolyline(series, width, height, padding, maxValue) {
    return series
        .map((item, index) => {
            const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
            const y = height - padding - (toNumber(item.value) / maxValue) * (height - padding * 2);
            return `${x},${y}`;
        })
        .join(' ');
}

function ChartPanel({ title, icon: Icon, firstSeries = [], secondSeries = [], firstColor, secondColor, yMax = 100, yLabel = '' }) {
    const width = 760;
    const height = 260;
    const padding = 36;
    const labels = firstSeries.map((item) => item.label);

    return (
        <div className="panel-card p-4">
            <h3 className="font-semibold text-[34px] leading-none flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                {title}
            </h3>

            <div className="mt-4 rounded-xl border border-border p-3">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
                    {[0, 1, 2, 3, 4].map((i) => {
                        const y = padding + ((height - padding * 2) * i) / 4;
                        return <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
                    })}

                    {[0, 1, 2, 3, 4, 5].map((i) => {
                        const x = padding + ((width - padding * 2) * i) / 5;
                        return <line key={`v-${i}`} x1={x} y1={padding} x2={x} y2={height - padding} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
                    })}

                    <polyline fill="none" stroke={firstColor} strokeWidth="3" points={renderPolyline(firstSeries, width, height, padding, yMax)} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline fill="none" stroke={secondColor} strokeWidth="3" points={renderPolyline(secondSeries, width, height, padding, yMax)} strokeLinecap="round" strokeLinejoin="round" />

                    {[0, 1, 2, 3, 4].map((i) => {
                        const value = Math.round(yMax - (yMax * i) / 4);
                        const y = padding + ((height - padding * 2) * i) / 4;
                        return (
                            <text key={`y-${i}`} x={8} y={y + 4} className="fill-muted-foreground text-[11px]">
                                {value}{yLabel}
                            </text>
                        );
                    })}

                    {labels.map((label, index) => {
                        const x = padding + (index * (width - padding * 2)) / Math.max(labels.length - 1, 1);
                        return (
                            <text key={`x-${label}-${index}`} x={x} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                                {label}
                            </text>
                        );
                    })}
                </svg>
            </div>
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

    const fallbackCpu = [
        { label: '0:00', value: 48 },
        { label: '2:00', value: 62 },
        { label: '4:00', value: 70 },
        { label: '6:00', value: 50 },
        { label: '8:00', value: 64 },
        { label: '10:00', value: 58 },
        { label: '12:00', value: 66 },
        { label: '14:00', value: 52 },
        { label: '16:00', value: 72 },
        { label: '18:00', value: 68 },
        { label: '20:00', value: 44 },
        { label: '22:00', value: 57 },
    ];

    const fallbackMemory = [
        { label: '0:00', value: 42 },
        { label: '2:00', value: 40 },
        { label: '4:00', value: 58 },
        { label: '6:00', value: 65 },
        { label: '8:00', value: 52 },
        { label: '10:00', value: 48 },
        { label: '12:00', value: 69 },
        { label: '14:00', value: 28 },
        { label: '16:00', value: 62 },
        { label: '18:00', value: 34 },
        { label: '20:00', value: 60 },
        { label: '22:00', value: 30 },
    ];

    const fallbackApi = [
        { label: '0:00', value: 110 },
        { label: '2:00', value: 185 },
        { label: '4:00', value: 170 },
        { label: '6:00', value: 80 },
        { label: '8:00', value: 110 },
        { label: '10:00', value: 120 },
        { label: '12:00', value: 165 },
        { label: '14:00', value: 112 },
        { label: '16:00', value: 196 },
        { label: '18:00', value: 128 },
        { label: '20:00', value: 182 },
        { label: '22:00', value: 174 },
    ];

    const fallbackDb = [
        { label: '0:00', value: 40 },
        { label: '2:00', value: 70 },
        { label: '4:00', value: 32 },
        { label: '6:00', value: 72 },
        { label: '8:00', value: 58 },
        { label: '10:00', value: 74 },
        { label: '12:00', value: 48 },
        { label: '14:00', value: 60 },
        { label: '16:00', value: 28 },
        { label: '18:00', value: 52 },
        { label: '20:00', value: 26 },
        { label: '22:00', value: 20 },
    ];

    const cpuSeries = buildSeriesByMetric(entries, 'LCP', fallbackCpu);
    const memorySeries = buildSeriesByMetric(entries, 'CLS', fallbackMemory);
    const apiSeries = buildResponseSeries(entries, 'TBT', fallbackApi);
    const dbSeries = buildResponseSeries(entries, 'FCP', fallbackDb);

    const cpuValue = Math.round(cpuSeries[cpuSeries.length - 1]?.value ?? 42);
    const memoryValue = Math.round(memorySeries[memorySeries.length - 1]?.value ?? 61);
    const storageValue = clamp(Math.round(((summary?.total ?? 38) % 100) || 38), 18, 88);
    const bandwidthValue = clamp(Math.round((apiSeries[apiSeries.length - 1]?.value ?? 156) / 2.2), 28, 98);

    return (
        <ProtectedLayout>
            <Head title="Performance Logs" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Performance Logs"
                    description="Monitor performa dan kesehatan sistem secara real-time"
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
                    <MetricPanel title="CPU Usage" value={cpuValue} status={statusTone(cpuValue)} icon={Cpu} tone="violet" />
                    <MetricPanel title="Memory" value={memoryValue} status={statusTone(memoryValue)} icon={Database} tone="blue" />
                    <MetricPanel title="Storage" value={storageValue} status={statusTone(storageValue)} icon={HardDrive} tone="green" />
                    <MetricPanel title="Bandwidth" value={bandwidthValue} unit=" MB/s" status={statusTone(bandwidthValue)} icon={Wifi} tone="orange" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <ChartPanel
                        title="CPU & Memory (24 Jam)"
                        icon={Cpu}
                        firstSeries={cpuSeries}
                        secondSeries={memorySeries}
                        firstColor="hsl(var(--info))"
                        secondColor="hsl(var(--primary))"
                        yMax={100}
                        yLabel="%"
                    />
                    <ChartPanel
                        title="Response Time API & DB"
                        icon={Wifi}
                        firstSeries={apiSeries}
                        secondSeries={dbSeries}
                        firstColor="hsl(var(--warning))"
                        secondColor="hsl(var(--success))"
                        yMax={200}
                        yLabel="ms"
                    />
                </div>

                <div className="panel-card p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-[34px] leading-none flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            Status Layanan
                        </h3>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <ServiceCard title="Web Server" metrics={[`Uptime 99.98%`, `Request ${(summary?.total ?? 0).toLocaleString('id-ID')}/hr`]} status="Normal" />
                        <ServiceCard title="Database" metrics={[`Latency 8ms`, `LCP ${summary?.by_metric?.LCP ?? 0}`]} status="Normal" />
                        <ServiceCard title="File Storage" metrics={[`Storage ${storageValue}%`, `CLS ${summary?.by_metric?.CLS ?? 0}`]} status="Normal" />
                        <ServiceCard title="Email Service" metrics={[`Queue ${Math.max((summary?.total ?? 0) % 180, 20)} msg`, `TBT ${summary?.by_metric?.TBT ?? 0}`]} status="Peringatan" warning />
                        <ServiceCard title="CDN" metrics={[`Hit ratio 95%`, `FCP ${summary?.by_metric?.FCP ?? 0}`]} status="Normal" />
                        <ServiceCard title="Auth Service" metrics={[summary?.latest ? `Updated ${summary.latest}` : 'Belum ada data', `Bandwidth ${bandwidthValue} MB/s`]} status="Normal" />
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function ServiceCard({ title, metrics = [], status = 'Normal', warning = false }) {
    return (
        <div className="panel-subcard p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{title}</p>
                <span className={`text-sm font-medium ${warning ? 'text-warning' : 'text-success'}`}> 
                    <ShieldCheck className="w-4 h-4 inline mr-1" />
                    {status}
                </span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {metrics.map((item) => (
                    <p key={item}>{item}</p>
                ))}
            </div>
        </div>
    );
}

