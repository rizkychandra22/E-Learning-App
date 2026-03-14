import { useMemo } from 'react';
import { BookOpen, CalendarDays, Clock, PlayCircle, Target, Users } from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'rounded-2xl border border-border bg-card p-4 shadow-card',
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

function CourseCard({ title, mentor, schedule, students, progress, nextTask }) {
    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Kelas Aktif</p>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Mentor: {mentor}</p>
                </div>
                <span className={UI.chip}>{progress}% selesai</span>
            </div>
            <div className="space-y-2">
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className={UI.chip}>
                        <CalendarDays className="w-3.5 h-3.5" />
                        {schedule}
                    </span>
                    <span className={UI.chip}>
                        <Users className="w-3.5 h-3.5" />
                        {students} mahasiswa
                    </span>
                </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 text-sm">
                <p className="font-medium">Tugas Berikutnya</p>
                <p className="text-xs text-muted-foreground mt-1">{nextTask}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Link href="/materials" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    Lanjutkan Materi
                </Link>
                <Link href="/assignments" className="text-xs font-medium text-muted-foreground hover:text-primary">
                    Lihat Tugas
                </Link>
            </div>
        </div>
    );
}

export default function StudentMyCourses() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const intlLocale = toIntlLocale(props?.system?.default_language);
    const today = useMemo(
        () =>
            new Intl.DateTimeFormat(intlLocale, {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(new Date()),
        [intlLocale]
    );

    const stats = [
        { label: 'Kursus Aktif', value: '5', helper: '2 sedang intensif', icon: BookOpen },
        { label: 'Target Minggu Ini', value: '12 jam', helper: 'Sisa 5 jam lagi', icon: Target },
        { label: 'Sesi Terdekat', value: '09:00', helper: 'Algoritma & Struktur Data', icon: Clock },
    ];

    const courses = [
        {
            title: 'Algoritma & Struktur Data',
            mentor: 'Dr. Nabila',
            schedule: 'Selasa, 09:00',
            students: 38,
            progress: 72,
            nextTask: 'Kumpulkan tugas 3 sebelum Jumat 23:59',
        },
        {
            title: 'Basis Data Lanjut',
            mentor: 'Pak Rio',
            schedule: 'Rabu, 13:00',
            students: 42,
            progress: 54,
            nextTask: 'Review materi normalisasi tingkat lanjut',
        },
        {
            title: 'Pemrograman Web',
            mentor: 'Bu Anya',
            schedule: 'Kamis, 10:30',
            students: 45,
            progress: 38,
            nextTask: 'Diskusi kelompok proyek minggu ini',
        },
    ];

    return (
        <ProtectedLayout>
            <Head title="Kursus Saya" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Kursus Saya"
                    description="Pantau kelas aktif, jadwal terdekat, dan progres belajar dalam satu tampilan."
                />

                <div className="flex flex-wrap gap-3 text-sm">
                    <span className={UI.chip}>
                        <CalendarDays className="w-3.5 h-3.5" />
                        {today}
                    </span>
                    <span className={UI.chip}>Semester Genap 2025/2026</span>
                    <span className={UI.chip}>Fokus: 2 kursus prioritas</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {courses.map((course) => (
                        <CourseCard key={course.title} {...course} />
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}
