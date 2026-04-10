import { ArrowUpRight, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, GraduationCap, ListChecks, Trophy } from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const KPI_GRADIENT_CLASS = {
    primary: 'gradient-primary',
    accent: 'gradient-success',
    warm: 'gradient-warm',
    success: 'gradient-accent',
};

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toRelativeLabel(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)} menit lalu`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} hari lalu`;
}

function mapTypeLabel(type) {
    if (type === 'assignment') return 'Tugas';
    if (type === 'quiz') return 'Kuis';
    return 'Aktivitas';
}

function StatCard({ item }) {
    const Icon = item.icon;
    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-4 text-white shadow-card-lg min-h-[122px]', KPI_GRADIENT_CLASS[item.tone] ?? KPI_GRADIENT_CLASS.primary)}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                <Icon className="h-4 w-4 text-white/90" />
            </div>
            <p className="text-sm text-white/85">{item.title}</p>
            <p className="mt-2 text-[42px] leading-none font-bold tracking-tight">{item.value}</p>
        </div>
    );
}

export default function StudentHome() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const displayName = user?.full_name || user?.name || user?.username || 'Mahasiswa';
    const stats = props?.stats ?? {
        active_courses: 0,
        completed_assignments: 0,
        graded_items: 0,
        today_schedule: 0,
        average_progress: 0,
    };
    const courses = props?.courses ?? [];
    const upcomingItems = props?.upcoming_items ?? [];
    const recentActivities = props?.recent_activities ?? [];
    const latestResults = props?.latest_results ?? [];
    const migrationRequired = props?.migrationRequired ?? {};

    const statItems = [
        { title: 'Mata Kuliah Aktif', value: stats.active_courses, icon: BookOpen, tone: 'primary' },
        { title: 'Tugas Selesai', value: stats.completed_assignments, icon: CheckCircle2, tone: 'accent' },
        { title: 'Nilai Dinilai', value: stats.graded_items, icon: GraduationCap, tone: 'warm' },
        { title: 'Jadwal Hari Ini', value: stats.today_schedule, icon: CalendarDays, tone: 'success' },
    ];

    const overall = Number(stats.average_progress ?? 0);

    return (
        <ProtectedLayout>
            <Head title={`Selamat datang, ${displayName}`} />
            <div className="space-y-6">
                <PageHeroBanner
                    title={`Selamat datang, ${displayName}`}
                    description="Pantau progres belajar, deadline, dan hasil nilai terbaru."
                />

                {(migrationRequired.learning || migrationRequired.assignments || migrationRequired.quizzes || migrationRequired.grades) && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Sebagian data dashboard membutuhkan migrasi terbaru. Jalankan <code className="font-mono">php artisan migrate</code>.
                    </div>
                )}

                <div className="grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-4 gap-3">
                    {statItems.map((item) => <StatCard key={item.title} item={item} />)}
                </div>

                <section className="panel-card p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-primary" />
                            Progres Belajar Keseluruhan
                        </h3>
                        <span className="text-2xl font-bold text-primary">{overall}%</span>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${overall}%` }} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Data progress diambil dari lesson yang sudah diselesaikan.</p>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <section className="panel-card p-4 xl:col-span-8">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-primary" />
                                Progress Mata Kuliah
                            </h3>
                            <Link href="/my-courses" className="text-sm text-primary hover:opacity-80 transition-opacity">Lihat Semua</Link>
                        </div>
                        <div className="mt-4 space-y-5">
                            {!courses.length && <p className="text-sm text-muted-foreground">Belum ada mata kuliah aktif.</p>}
                            {courses.map((course) => (
                                <div key={course.id}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-base">{course.title}</p>
                                            <p className="text-sm text-muted-foreground">{course?.lecturer?.name ?? '-'}</p>
                                        </div>
                                        <p className="font-semibold text-base">{course.progress_percent ?? 0}%</p>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{course.completed_lessons ?? 0}/{course.total_lessons ?? 0} materi selesai</p>
                                    <div className="mt-2 h-2.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress_percent ?? 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="panel-card p-4 xl:col-span-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-primary" />
                                Akan Datang
                            </h3>
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 space-y-2.5">
                            {!upcomingItems.length && <p className="text-sm text-muted-foreground">Tidak ada jadwal terdekat.</p>}
                            {upcomingItems.map((item, index) => (
                                <article key={`${item.type}-${index}`} className="panel-subcard p-3">
                                    <p className="font-medium text-base">{mapTypeLabel(item.type)}: {item.title}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{item.course}</p>
                                    <span className="inline-flex mt-2 rounded-full px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary">{formatDateTime(item.schedule_at)}</span>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="panel-card p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        Hasil Quiz & Assignment Terbaru
                    </h3>
                    <div className="mt-3 divide-y divide-border">
                        {!latestResults.length && <p className="py-3 text-sm text-muted-foreground">Belum ada nilai yang dipublikasikan.</p>}
                        {latestResults.map((item, index) => (
                            <article key={`${item.type}-${index}`} className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-base truncate">{mapTypeLabel(item.type)}: {item.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">{item.course}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-primary">{item.score}/{item.max_score}</p>
                                    <p className="text-xs text-muted-foreground">{formatDateTime(item.graded_at)}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="panel-card p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        Aktivitas Terakhir
                    </h3>
                    <div className="mt-3 divide-y divide-border">
                        {!recentActivities.length && <p className="py-3 text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>}
                        {recentActivities.map((item, index) => (
                            <article key={`${item.type}-${index}`} className="flex items-start justify-between gap-3 py-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                                        {item.type === 'quiz' ? <ListChecks className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-base">{item.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">{item.text}</p>
                                    </div>
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap inline-flex items-center gap-1.5">
                                    <Clock3 className="w-3.5 h-3.5" />
                                    {toRelativeLabel(item.time)}
                                </span>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}

