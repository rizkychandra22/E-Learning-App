import { useMemo } from 'react';
import {
    ArrowRight,
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Flame,
    GraduationCap,
    ListChecks,
    MessageSquare,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

const KPI_GRADIENT_CLASS = {
    primary: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warm',
    accent: 'gradient-accent',
};

function SectionTitle({ icon: Icon, children, action }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <span>{children}</span>
            </h3>
            {action}
        </div>
    );
}

function FocusStat({ icon: Icon, label, value, helper, tone = 'primary' }) {
    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-4 text-white shadow-card-lg', KPI_GRADIENT_CLASS[tone] ?? KPI_GRADIENT_CLASS.primary)}>
            <div className="absolute -right-6 -top-7 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/16 grid place-items-center">
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm text-white/85">{label}</p>
            <p className="text-4xl font-bold mt-2 leading-none">{value}</p>
            {helper && <p className="text-xs text-white/85 mt-2">{helper}</p>}
        </div>
    );
}

function CourseCard({ title, mentor, progress, schedule, tone }) {
    const toneStyles = {
        primary: 'from-primary/25 via-primary/5 to-transparent',
        success: 'from-success/25 via-success/5 to-transparent',
        warm: 'from-warning/25 via-warning/5 to-transparent',
        accent: 'from-accent/25 via-accent/5 to-transparent',
    };

    return (
        <div className={cn(UI.panel, 'relative overflow-hidden')}>
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-70', toneStyles[tone] ?? toneStyles.primary)} />
            <div className="relative space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm text-muted-foreground">Kelas Aktif</p>
                        <p className="font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Mentor: {mentor}</p>
                    </div>
                    <span className={UI.chip}>{progress}% selesai</span>
                </div>
                <div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Sesi berikutnya: {schedule}</p>
                </div>
            </div>
        </div>
    );
}

function DeadlineItem({ title, course, due, status }) {
    const statusTone = {
        tinggi: 'text-destructive',
        sedang: 'text-warning',
        rendah: 'text-success',
    };

    return (
        <div className="flex items-start gap-3 panel-subcard p-3">
            <div className={cn('mt-1 h-2.5 w-2.5 rounded-full', status === 'tinggi' ? 'bg-destructive' : status === 'sedang' ? 'bg-warning' : 'bg-success')} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground">{course}</p>
                <p className={cn('text-xs mt-1 font-medium', statusTone[status] ?? 'text-muted-foreground')}>Deadline {due}</p>
            </div>
        </div>
    );
}

function PlanItem({ title, time, done }) {
    return (
        <div className="flex items-center gap-3 panel-subcard p-3">
            <div className={cn('h-9 w-9 rounded-lg grid place-items-center', done ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground')}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground">{time}</p>
            </div>
        </div>
    );
}

export default function StudentHome() {
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

    const focusStats = [
        { label: 'Target Minggu Ini', value: '12/20 jam', helper: '+2 jam hari ini', icon: Target, tone: 'primary' },
        { label: 'Learning Streak', value: '5 hari', helper: 'Pertahankan sampai Jumat', icon: Flame, tone: 'warning' },
        { label: 'Rata-rata Nilai', value: '85.4', helper: '+2.1 dari semester lalu', icon: Trophy, tone: 'success' },
    ];

    const activeCourses = [
        { title: 'Algoritma & Struktur Data', mentor: 'Dr. Nabila', progress: 72, schedule: 'Sel, 09:00', tone: 'primary' },
        { title: 'Basis Data Lanjut', mentor: 'Pak Rio', progress: 54, schedule: 'Rab, 13:00', tone: 'accent' },
        { title: 'Pemrograman Web', mentor: 'Bu Anya', progress: 38, schedule: 'Kam, 10:30', tone: 'warm' },
    ];

    const deadlines = [
        { title: 'Tugas 3: Normalisasi', course: 'Basis Data Lanjut', due: '2 hari lagi', status: 'tinggi' },
        { title: 'Kuis Mingguan 4', course: 'Pemrograman Web', due: '4 hari lagi', status: 'sedang' },
        { title: 'Resume Materi Pointer', course: 'Algoritma & Struktur Data', due: '6 hari lagi', status: 'rendah' },
    ];

    const todayPlan = [
        { title: 'Review video pointer & array', time: '08:00 - 09:00', done: true },
        { title: 'Latihan soal normalisasi', time: '10:30 - 11:30', done: false },
        { title: 'Diskusi kelompok tugas web', time: '15:00 - 15:45', done: false },
    ];

    return (
        <ProtectedLayout>
            <Head title="Beranda Mahasiswa" />
            <div className="space-y-6">
                <div className={cn(UI.panel, 'relative overflow-hidden')}>
                    <div className="absolute inset-x-0 top-0 h-1.5 gradient-primary opacity-90" />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Mahasiswa</span>
                    </div>
                    <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{`Dashboard ${user.name}`}</h1>
                    <p className="mt-1 text-sm sm:text-base text-muted-foreground">Pantau progres belajar, tugas aktif, dan jadwal hari ini dalam satu tampilan.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <GraduationCap className="w-3.5 h-3.5" />
                            Semester Genap 2025/2026
                        </span>
                        <span className={UI.chip}>
                            <Zap className="w-3.5 h-3.5 text-warning" />
                            Fokus: Persiapan Kuis
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-3 gap-4">
                            {focusStats.map((stat) => (
                                <FocusStat key={stat.label} {...stat} />
                            ))}
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle
                                icon={BookOpen}
                                action={
                                    <Link href="/my-courses" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                                        Lihat semua
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                }
                            >
                                Kelas Aktif
                            </SectionTitle>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeCourses.map((course) => (
                                    <CourseCard key={course.title} {...course} />
                                ))}
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={FileText}>Tugas Mendekati Deadline</SectionTitle>
                            <div className="mt-4 space-y-3">
                                {deadlines.map((task) => (
                                    <DeadlineItem key={task.title} {...task} />
                                ))}
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={Award}>Aksi Cepat</SectionTitle>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Link href="/assignments" className="rounded-xl border border-border p-3 hover:bg-secondary transition-colors">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <ListChecks className="w-4 h-4 text-primary" />
                                        Cek tugas aktif
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Urutkan berdasarkan deadline terdekat</p>
                                </Link>
                                <Link href="/quizzes" className="rounded-xl border border-border p-3 hover:bg-secondary transition-colors">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Award className="w-4 h-4 text-primary" />
                                        Mulai kuis berikutnya
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Latihan singkat sebelum ujian</p>
                                </Link>
                                <Link href="/materials" className="rounded-xl border border-border p-3 hover:bg-secondary transition-colors">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Buka materi baru
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Ringkasan materi minggu ini</p>
                                </Link>
                                <Link href="/discussions" className="rounded-xl border border-border p-3 hover:bg-secondary transition-colors">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                        Lanjutkan diskusi
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Balas pertanyaan terbaru di forum</p>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={UI.panel}>
                            <SectionTitle icon={Clock}>Rencana Hari Ini</SectionTitle>
                            <div className="mt-4 space-y-3">
                                {todayPlan.map((item) => (
                                    <PlanItem key={item.title} {...item} />
                                ))}
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={Zap}>Ritme Belajar</SectionTitle>
                            <div className="mt-4 space-y-3">
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">Total waktu minggu ini</p>
                                    <p className="text-lg font-semibold mt-1">12 jam 40 menit</p>
                                    <div className="mt-3 h-2.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: '63%' }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">63% dari target mingguan</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="panel-subcard p-3">
                                        <p className="text-xs text-muted-foreground">Konsistensi</p>
                                        <p className="font-semibold mt-1">88%</p>
                                    </div>
                                    <div className="panel-subcard p-3">
                                        <p className="text-xs text-muted-foreground">Fokus sesi</p>
                                        <p className="font-semibold mt-1">42 menit</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={MessageSquare}>Pengumuman</SectionTitle>
                            <div className="mt-4 space-y-3">
                                {[
                                    'Materi tambahan "Sorting Lanjut" sudah tersedia.',
                                    'Dosen membuka sesi konsultasi proyek pada Jumat.',
                                    'Forum kelas Basis Data pindah ke topik baru.',
                                ].map((note) => (
                                    <div key={note} className="panel-subcard p-3 text-sm">
                                        {note}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}


