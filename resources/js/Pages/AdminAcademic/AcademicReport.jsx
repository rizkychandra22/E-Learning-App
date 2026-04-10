import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { BarChart3, Download, BookOpen, GraduationCap, Trophy, Users } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { StatCard } from '@/components/StatCard';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { cn } from '@/lib/cn';

const PERIODS = [
    { value: 'monthly', label: 'Bulanan' },
    { value: 'quarterly', label: 'Kuartalan' },
    { value: 'yearly', label: 'Tahunan' },
];

function ProgressCategoryChart({ title, data = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    if (!data.length) return null;

    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1;
    const size = 140;
    const radius = 56;
    const cx = size / 2;
    const cy = size / 2;
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

    const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
        const radians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + r * Math.cos(radians),
            y: centerY + r * Math.sin(radians),
        };
    };

    const describeArcSlice = (centerX, centerY, r, startAngle, endAngle) => {
        const start = polarToCartesian(centerX, centerY, r, endAngle);
        const end = polarToCartesian(centerX, centerY, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    };

    let cursor = 0;
    const segments = data.map((item, index) => {
        const value = Number(item.value) || 0;
        const fraction = value / total;
        const startAngle = cursor * 360;
        const endAngle = (cursor + fraction) * 360;
        cursor += fraction;
        return { item, index, value, fraction, startAngle, endAngle };
    });

    return (
        <section className="panel-card p-4 animate-fade-in">
            <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {title}
            </h3>
            <div className="mt-4 panel-subcard p-4">
                <div className="flex flex-col items-center gap-4">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {segments.map((segment) => {
                            const { item, index, startAngle, endAngle } = segment;
                            const isActive = index === activeIndex;
                            const midAngle = (startAngle + endAngle) / 2;
                            const tx = isActive ? Math.cos(((midAngle - 90) * Math.PI) / 180) * 3 : 0;
                            const ty = isActive ? Math.sin(((midAngle - 90) * Math.PI) / 180) * 3 : 0;
                            return (
                                <path
                                    key={item.label}
                                    d={describeArcSlice(cx, cy, radius, startAngle, endAngle)}
                                    fill={colors[index % colors.length]}
                                    opacity={isActive ? 1 : 0.85}
                                    transform={`translate(${tx}, ${ty})`}
                                    className="transition-all duration-200 cursor-pointer"
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => setActiveIndex(index)}
                                />
                            );
                        })}
                    </svg>

                    <div className="w-full space-y-2">
                        {segments.map((segment) => (
                            <button
                                key={segment.item.label}
                                type="button"
                                onMouseEnter={() => setActiveIndex(segment.index)}
                                onClick={() => setActiveIndex(segment.index)}
                                className={cn(
                                    'w-full flex items-center justify-between text-sm rounded-lg px-2 py-1.5 transition-colors',
                                    segment.index === activeIndex ? 'bg-primary/10' : 'hover:bg-secondary/60'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[segment.index % colors.length] }} />
                                    <span>{segment.item.label}</span>
                                </div>
                                <span className="font-semibold">{segment.value}%</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function AcademicReport({
    filters,
    summary,
    summary_changes,
    enrollment_trend = [],
    completion_trend = [],
    progress_distribution = [],
    top_courses = [],
    available_courses = [],
}) {
    const currentPeriod = filters?.period ?? 'monthly';
    const currentCourseId = filters?.course_id ?? '';

    const updateFilters = (nextPeriod, nextCourseId) => {
        const payload = { period: nextPeriod };
        if (nextCourseId) {
            payload.course_id = nextCourseId;
        }
        router.get('/academic-reports', payload, { preserveState: true, preserveScroll: true, replace: true });
    };

    const setPeriod = (period) => {
        updateFilters(period, currentCourseId);
    };

    const setCourseId = (courseId) => {
        updateFilters(currentPeriod, courseId);
    };

    const buildExportUrl = (format) => {
        const params = new URLSearchParams({ period: currentPeriod, format });
        if (currentCourseId) {
            params.set('course_id', String(currentCourseId));
        }
        return `/academic-reports/export?${params.toString()}`;
    };

    const progressChartData = progress_distribution.map((item) => ({
        label: item.label,
        value: Number(item.value) || 0,
    }));

    const trendChartData = enrollment_trend.map((item, index) => ({
        label: item.label,
        value: item.value,
        completion: completion_trend[index]?.value ?? 0,
    }));
    const firstTrend = trendChartData[0];
    const lastTrend = trendChartData[trendChartData.length - 1];
    const peakTrendValue = trendChartData.length
        ? Math.max(...trendChartData.map((item) => Number(item.value) || 0))
        : 0;
    const trendGrowth = firstTrend?.value > 0
        ? (((Number(lastTrend?.value) || 0) - Number(firstTrend.value)) / Number(firstTrend.value)) * 100
        : 0;

    return (
        <ProtectedLayout>
            <Head title="Laporan Akademik" />

            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Laporan Akademik"
                    description="Ringkasan performa akademik dan aktivitas platform"
                    icon={BarChart3}
                    action={(
                        <>
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                                {PERIODS.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setPeriod(item.value)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${currentPeriod === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={currentCourseId}
                                onChange={(event) => setCourseId(event.target.value)}
                                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            >
                                <option value="">Semua Mata Kuliah</option>
                                {available_courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                            <a
                                href={buildExportUrl('csv')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </a>
                            <a
                                href={buildExportUrl('pdf')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </a>
                        </>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Pendaftar" value={summary?.total_enrollment ?? 0} change={summary_changes?.total_enrollment ?? '0% dari periode sebelumnya'} icon={Users} gradient="primary" />
                    <StatCard title="Mata Kuliah Selesai" value={summary?.completed_courses ?? 0} change={summary_changes?.completed_courses ?? '0% dari periode sebelumnya'} icon={GraduationCap} gradient="success" />
                    <StatCard title="Mata Kuliah Aktif" value={summary?.active_courses ?? 0} change={summary_changes?.active_courses ?? '0% dari periode sebelumnya'} icon={BookOpen} gradient="warm" />
                    <StatCard title="Rata-rata Nilai" value={summary?.average_score ?? 0} change={summary_changes?.average_score ?? '0 poin dari periode sebelumnya'} icon={Trophy} gradient="accent" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                    <div className="xl:col-span-8 h-full">
                        <InteractiveTrendChart
                            title="Tren Pendaftaran"
                            data={trendChartData.map((item) => ({ label: item.label, value: item.value }))}
                            tone="primary"
                            chartType="line"
                            valueFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)}
                            compact
                            compactFooter={[
                                `Periode aktif: ${firstTrend?.label ?? '-'} - ${lastTrend?.label ?? '-'}`,
                                `Puncak pendaftaran: ${new Intl.NumberFormat('id-ID').format(peakTrendValue)} peserta`,
                                `Ringkasan tren: ${trendGrowth >= 0 ? '+' : ''}${trendGrowth.toFixed(1)}% dari awal periode`,
                            ]}
                        />
                    </div>
                    <div className="xl:col-span-4 h-full">
                        <ProgressCategoryChart title="Distribusi Progress" data={progressChartData} />
                    </div>
                </div>

                <section className="panel-card p-4">
                    <h3 className="font-semibold text-xl flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Mata Kuliah Terpopuler
                    </h3>

                    <div className="space-y-3">
                        {top_courses.map((course) => (
                            <div key={`${course.rank}-${course.name}`} className="grid grid-cols-[22px_1fr_auto] items-center gap-3">
                                <span className="text-sm font-semibold text-muted-foreground">{course.rank}</span>
                                <div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{course.name}</span>
                                        <span className="text-muted-foreground">{course.enrollment} peserta</span>
                                    </div>
                                    <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.max(8, Math.min(100, Number(course.completion) || 0))}%` }} />
                                    </div>
                                </div>
                                <span className="text-sm font-semibold">{course.completion}%</span>
                            </div>
                        ))}

                        {top_courses.length === 0 && (
                            <p className="text-sm text-muted-foreground">Belum ada data mata kuliah untuk periode ini.</p>
                        )}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}

