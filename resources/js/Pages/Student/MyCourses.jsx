import { useMemo } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, PlayCircle, Target, UserPlus } from 'lucide-react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function StatCard({ icon: Icon, label, value, helper }) {
    return (
        <div className={cn(UI.panel, 'flex items-start gap-3')}>
            <div className="rounded-xl bg-primary/10 text-primary p-2.5">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold mt-1">{value}</p>
                {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
            </div>
        </div>
    );
}

function CourseCard({ course }) {
    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Kelas Aktif</p>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Mentor: {course.lecturer?.name ?? '-'}</p>
                </div>
                <span className={UI.chip}>{course.progress_percent}% selesai</span>
            </div>
            <div className="space-y-2">
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress_percent}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className={UI.chip}>{course.code}</span>
                    <span className={UI.chip}>{course.total_lessons} lesson</span>
                    <span className={UI.chip}>{course.modules.length} modul</span>
                </div>
            </div>
            <div className="panel-subcard p-3 text-sm">
                <p className="font-medium">Progress Pembelajaran</p>
                <p className="text-xs text-muted-foreground mt-1">{course.completed_lessons} dari {course.total_lessons} lesson selesai</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Link href={`/learning/${course.id}`} className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    Lanjutkan Materi
                </Link>
            </div>
        </div>
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

    const stats = [
        { label: 'Kursus Aktif', value: String(summary.active_courses ?? 0), helper: 'Kursus yang sedang dipelajari', icon: BookOpen },
        { label: 'Lesson Selesai', value: String(summary.completed_lessons ?? 0), helper: 'Akumulasi semua course', icon: CheckCircle2 },
        { label: 'Rata-rata Progress', value: `${summary.average_progress ?? 0}%`, helper: 'Ringkasan progres belajar', icon: Target },
    ];

    return (
        <ProtectedLayout>
            <Head title="Kursus Saya" />
            <div className="space-y-6">
                <PageHeroBanner title="Kursus Saya" description="Pantau kelas aktif, modul pembelajaran, dan progres belajar dalam satu tampilan." />

                <div className="flex flex-wrap gap-3 text-sm">
                    <span className={UI.chip}><CalendarDays className="w-3.5 h-3.5" />{today}</span>
                    <span className={UI.chip}>Semester Genap 2025/2026</span>
                    <span className={UI.chip}>Learning modules Sprint 3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-xs text-muted-foreground mt-1">Daftar kursus aktif yang membuka pendaftaran mandiri.</p>

                        <form onSubmit={submitEnroll} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <label className="block md:col-span-2">
                                <span className="text-sm font-medium">Pilih kursus</span>
                                <select
                                    value={enrollForm.data.course_id}
                                    onChange={(event) => enrollForm.setData('course_id', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Pilih kursus</option>
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
                                Daftar Kursus
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {courses.length > 0 ? courses.map((course) => <CourseCard key={course.id} course={course} />) : (
                        <div className={cn(UI.panel, 'text-sm text-muted-foreground lg:col-span-2')}>
                            Belum ada kursus yang terdaftar untuk mahasiswa ini.
                        </div>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}


