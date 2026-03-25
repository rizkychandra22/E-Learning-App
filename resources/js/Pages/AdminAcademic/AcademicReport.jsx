import { Head, router } from '@inertiajs/react';
import { BarChart3, Download, BookOpen, GraduationCap, Trophy, Users } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { StatCard } from '@/components/StatCard';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';

const PERIODS = [
    { value: 'monthly', label: 'Bulanan' },
    { value: 'quarterly', label: 'Kuartalan' },
    { value: 'yearly', label: 'Tahunan' },
];

export default function AcademicReport({
    filters,
    summary,
    enrollment_trend = [],
    completion_trend = [],
    progress_distribution = [],
    top_courses = [],
}) {
    const currentPeriod = filters?.period ?? 'monthly';

    const setPeriod = (period) => {
        router.get('/academic-reports', { period }, { preserveState: true, preserveScroll: true, replace: true });
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

    return (
        <ProtectedLayout>
            <Head title="Laporan Akademik" />

            <div className="space-y-6 w-full max-w-none">
                <section className="panel-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-primary" />
                                Laporan Akademik
                            </h1>
                            <p className="text-muted-foreground mt-1">Ringkasan performa akademik dan aktivitas platform</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
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
                            <a
                                href={`/academic-reports/export?period=${encodeURIComponent(currentPeriod)}`}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </a>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Pendaftar" value={summary?.total_enrollment ?? 0} change="+14% dari periode lalu" icon={Users} gradient="primary" />
                    <StatCard title="Kursus Selesai" value={summary?.completed_courses ?? 0} change="+22% dari periode lalu" icon={GraduationCap} gradient="success" />
                    <StatCard title="Kursus Aktif" value={summary?.active_courses ?? 0} change="0% dari periode lalu" icon={BookOpen} gradient="warm" />
                    <StatCard title="Rata-rata Nilai" value={summary?.average_score ?? 0} change="+3.2 dari periode lalu" icon={Trophy} gradient="accent" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <div className="xl:col-span-8">
                        <InteractiveTrendChart
                            title="Tren Pendaftaran"
                            data={trendChartData.map((item) => ({ label: item.label, value: item.value }))}
                            tone="primary"
                            chartType="line"
                            valueFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)}
                            compact
                        />
                    </div>
                    <div className="xl:col-span-4">
                        <InteractiveTrendChart
                            title="Distribusi Progress"
                            data={progressChartData}
                            tone="success"
                            chartType="donut"
                            valueFormatter={(value) => `${value}%`}
                            showTrend={false}
                            compact
                        />
                    </div>
                </div>

                <section className="panel-card p-4">
                    <h3 className="font-semibold text-xl flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Kursus Terpopuler
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
                            <p className="text-sm text-muted-foreground">Belum ada data kursus untuk periode ini.</p>
                        )}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}
