import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Play, Star, Target, UserPlus } from 'lucide-react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

const KPI_GRADIENT_CLASS = {
    primary: 'gradient-primary',
    accent: 'gradient-success',
    warm: 'gradient-warm',
    success: 'gradient-accent',
};

const COURSE_CARD_THEMES = [
    {
        headerClass: 'gradient-primary',
        progressClass: 'bg-primary',
        categoryClass: 'bg-black/30 text-white',
    },
    {
        headerClass: 'gradient-accent',
        progressClass: 'bg-info',
        categoryClass: 'bg-black/30 text-white',
    },
    {
        headerClass: 'gradient-success',
        progressClass: 'bg-success',
        categoryClass: 'bg-black/30 text-white',
    },
    {
        headerClass: '',
        headerStyle: { background: 'linear-gradient(135deg, hsl(334 84% 56%), hsl(344 84% 54%))' },
        progressClass: 'bg-accent',
        categoryClass: 'bg-black/30 text-white',
    },
    {
        headerClass: 'gradient-warm',
        progressClass: 'bg-warning',
        categoryClass: 'bg-black/30 text-white',
    },
];

function StatCard({ icon: Icon, label, value, helper, tone = 'primary' }) {
    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-4 text-white shadow-card-lg min-h-[122px]', KPI_GRADIENT_CLASS[tone] ?? KPI_GRADIENT_CLASS.primary)}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                <Icon className="h-4 w-4 text-white/90" />
            </div>
            <p className="text-sm text-white/85">{label}</p>
            <p className="mt-2 text-[42px] leading-none font-bold tracking-tight">{value}</p>
            {helper && <p className="text-xs text-white/85 mt-2">{helper}</p>}
        </div>
    );
}

function CourseCard({ course, index }) {
    const progress = Number(course.progress_percent ?? 0);
    const totalLessons = Number(course.total_lessons ?? 0);
    const completedLessons = Number(course.completed_lessons ?? 0);
    const isDone = progress >= 100;
    const statusLabel = isDone ? 'Selesai' : 'Sedang Belajar';
    const theme = COURSE_CARD_THEMES[index % COURSE_CARD_THEMES.length];
    const category = course.category?.trim() ? course.category : 'Programming';
    const rating = ((4.3 + (index % 5) * 0.15)).toFixed(1);
    const openMaterials = () => router.get('/materials', { course: course.id });

    return (
        <article
            className="panel-card overflow-hidden p-0 cursor-pointer transition hover:shadow-card-lg"
            role="button"
            tabIndex={0}
            onClick={openMaterials}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openMaterials();
                }
            }}
        >
            <div className={cn('relative px-4 py-4 text-white min-h-[126px]', theme.headerClass)} style={theme.headerStyle}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative flex items-start justify-between">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', theme.categoryClass)}>{category}</span>
                    <span className="inline-flex items-center rounded-full bg-white/85 text-primary px-2.5 py-1 text-xs font-semibold">{statusLabel}</span>
                </div>
                <div className="relative mt-4 flex justify-center opacity-40">
                    <BookOpen className="w-12 h-12" />
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-lg leading-tight">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.lecturer?.name ?? '-'}</p>

                <div className="mt-2 flex items-center gap-1 text-sm text-warning">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{rating}</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{completedLessons}/{totalLessons} materi</span>
                    <span className="font-semibold">{progress}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full', theme.progressClass)} style={{ width: `${progress}%` }} />
                </div>

                {isDone ? (
                    <button type="button" className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 py-2.5 text-sm font-semibold text-muted-foreground" disabled>
                        <CheckCircle2 className="w-4 h-4" />
                        Selesai
                    </button>
                ) : (
                    <Link
                        href={`/learning/${course.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                    >
                        <Play className="w-4 h-4" />
                        Lanjutkan
                    </Link>
                )}
            </div>
        </article>
    );
}

export default function StudentMyCourses({ courses = [], available_courses = [], summary = {}, migrationRequired = false, selfEnrollmentAvailable = false }) {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const enrollForm = useForm({
        course_id: '',
        enrollment_key: '',
    });

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const intlLocale = toIntlLocale(props?.system?.default_language);
    const today = useMemo(
        () => new Intl.DateTimeFormat(intlLocale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
        [intlLocale]
    );

    const selectedCourse = available_courses.find((course) => String(course.id) === String(enrollForm.data.course_id));

    const submitEnroll = (event) => {
        event.preventDefault();
        enrollForm.post('/my-courses/enroll', {
            preserveScroll: true,
            onSuccess: () => enrollForm.reset(),
        });
    };

    const countAll = courses.length;
    const countActive = courses.filter((course) => {
        const progress = Number(course.progress_percent ?? 0);
        return progress > 0 && progress < 100;
    }).length;
    const countDone = courses.filter((course) => Number(course.progress_percent ?? 0) >= 100).length;

    const stats = [
        { label: 'Mata Kuliah Aktif', value: String(summary.active_courses ?? 0), helper: 'Mata Kuliah yang sedang dipelajari', icon: BookOpen, tone: 'primary' },
        { label: 'Lesson Selesai', value: String(summary.completed_lessons ?? 0), helper: 'Akumulasi semua course', icon: CheckCircle2, tone: 'accent' },
        { label: 'Rata-rata Progress', value: `${summary.average_progress ?? 0}%`, helper: 'Ringkasan progres belajar', icon: Target, tone: 'success' },
        { label: 'Mata Kuliah Selesai', value: String(countDone), helper: 'Kelas dengan progress 100%', icon: CheckCircle2, tone: 'warm' },
    ];

    const filteredCourses = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return courses.filter((course) => {
            const progress = Number(course.progress_percent ?? 0);
            const byStatus = filter === 'all' ? true : filter === 'active' ? progress > 0 && progress < 100 : progress >= 100;
            const byKeyword = keyword === ''
                ? true
                : `${course.title} ${course.category ?? ''} ${course.lecturer?.name ?? ''}`.toLowerCase().includes(keyword);
            return byStatus && byKeyword;
        });
    }, [courses, search, filter]);

    return (
        <ProtectedLayout>
            <Head title="Mata Kuliah Saya" />
            <div className="space-y-6">
                <PageHeroBanner title="Mata Kuliah Saya" description="Pantau progress belajarmu di sini." />

                <div className="flex flex-wrap gap-3 text-sm">
                    <span className={UI.chip}><CalendarDays className="w-3.5 h-3.5" />{today}</span>
                    <span className={UI.chip}>Semester Genap 2025/2026</span>
                    <span className={UI.chip}>Learning modules Sprint 3</span>
                </div>

                <div className="grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-4 gap-3">
                    {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
                </div>

                {migrationRequired && (
                    <div className={cn(UI.panel, 'text-sm text-warning border-warning/40 bg-warning/10')}>
                        Tabel learning progress belum tersedia. Jalankan migrasi terlebih dahulu.
                    </div>
                )}

                {selfEnrollmentAvailable && (
                    <div className={UI.panel}>
                        <h3 className="font-semibold flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-primary" />
                            Self Enrollment
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Daftar mata kuliah aktif yang membuka pendaftaran mandiri.</p>

                        <form onSubmit={submitEnroll} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <label className="block md:col-span-2">
                                <span className="text-sm font-medium">Pilih mata kuliah</span>
                                <select
                                    value={enrollForm.data.course_id}
                                    onChange={(event) => enrollForm.setData('course_id', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Pilih mata kuliah</option>
                                    {available_courses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.title} ({course.code})</option>
                                    ))}
                                </select>
                                {enrollForm.errors.course_id && <span className="text-xs text-destructive mt-1 block">{enrollForm.errors.course_id}</span>}
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium">Kunci enrollment</span>
                                <input
                                    type="text"
                                    value={enrollForm.data.enrollment_key}
                                    onChange={(event) => enrollForm.setData('enrollment_key', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder={selectedCourse?.requires_key ? 'Wajib diisi' : 'Opsional'}
                                />
                                {enrollForm.errors.enrollment_key && <span className="text-xs text-destructive mt-1 block">{enrollForm.errors.enrollment_key}</span>}
                            </label>

                            <button
                                type="submit"
                                disabled={enrollForm.processing}
                                className="md:col-span-3 inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                            >
                                <UserPlus className="w-4 h-4" />
                                Daftar Mata Kuliah
                            </button>
                        </form>
                    </div>
                )}

                <section className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <label className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari mata kuliah..."
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                            />
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setFilter('all')}
                                className={cn('rounded-xl border px-4 py-2 text-sm font-semibold transition-colors', filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground')}
                            >Semua ({countAll})</button>
                            <button
                                type="button"
                                onClick={() => setFilter('active')}
                                className={cn('rounded-xl border px-4 py-2 text-sm font-semibold transition-colors', filter === 'active' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground')}
                            >Berlangsung ({countActive})</button>
                            <button
                                type="button"
                                onClick={() => setFilter('done')}
                                className={cn('rounded-xl border px-4 py-2 text-sm font-semibold transition-colors', filter === 'done' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground')}
                            >Selesai ({countDone})</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredCourses.length > 0 ? filteredCourses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />) : (
                            <div className={cn(UI.panel, 'text-sm text-muted-foreground lg:col-span-2 xl:col-span-3')}>
                                Belum ada mata kuliah yang sesuai filter.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}

