import { CalendarDays, CheckCircle2, Clock3, ListChecks, BookOpen, GraduationCap, ArrowUpRight, Bell, ClipboardList } from 'lucide-react';
import { Head } from '@inertiajs/react';
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

const stats = [
    { title: 'Kursus Aktif', value: 3, icon: BookOpen, tone: 'primary' },
    { title: 'Tugas Selesai', value: 3, icon: CheckCircle2, tone: 'accent' },
    { title: 'Sertifikat', value: 1, icon: GraduationCap, tone: 'warm' },
    { title: 'Jadwal Hari Ini', value: 5, icon: CalendarDays, tone: 'success' },
];

const courses = [
    { title: 'React JS Fundamental', mentor: 'Dr. Ahmad', lessons: '16/24', percent: 68, color: 'bg-primary' },
    { title: 'Node.js Advanced', mentor: 'Budi Santoso', lessons: '8/20', percent: 42, color: 'bg-info' },
    { title: 'Database Design', mentor: 'Dr. Sari', lessons: '15/18', percent: 85, color: 'bg-success' },
];

const upcoming = [
    { title: 'Kuis: React Hooks', course: 'React JS Fundamental', due: 'Besok, 09:00', tone: 'bg-primary/15 text-primary' },
    { title: 'Tugas: ERD Database', course: 'Database Design', due: 'Rabu, 23:59', tone: 'bg-warning/20 text-warning' },
    { title: 'Ujian Tengah Semester', course: 'Algoritma & Struktur Data', due: 'Jumat, 08:00', tone: 'bg-destructive/15 text-destructive' },
];

const activities = [
    { title: 'React JS Fundamental', text: 'Melanjutkan Bab 7: Hooks', time: '2 jam lalu', icon: BookOpen },
    { title: 'Tugas: UI Design', text: 'Tugas dikumpulkan', time: '5 jam lalu', icon: ClipboardList },
    { title: 'Kuis: HTML/CSS', text: 'Nilai: 90/100', time: 'Kemarin', icon: ArrowUpRight },
    { title: 'Node.js Advanced', text: 'Bab 3 selesai', time: 'Kemarin', icon: BookOpen },
];

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
    if (!user) return null;

    const overall = 44;
    const displayName = user?.full_name || user?.name || user?.username || 'Mahasiswa';

    return (
        <ProtectedLayout>
            <Head title={`Selamat datang, ${displayName}`} />
            <div className="space-y-6">
                <PageHeroBanner
                    title={`Selamat datang, ${displayName}`}
                    description="Pantau progres belajar dan tugas kamu"
                />

                <div className="grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-4 gap-3">
                    {stats.map((item) => <StatCard key={item.title} item={item} />)}
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
                    <p className="text-sm text-muted-foreground mt-2">5 kursus terdaftar - 1 selesai</p>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <section className="panel-card p-4 xl:col-span-8">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-primary" />
                                Progress Kursus
                            </h3>
                            <button type="button" className="text-sm text-primary hover:opacity-80 transition-opacity">Lihat Semua</button>
                        </div>
                        <div className="mt-4 space-y-5">
                            {courses.map((course) => (
                                <div key={course.title}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-base">{course.title}</p>
                                            <p className="text-sm text-muted-foreground">{course.mentor}</p>
                                        </div>
                                        <p className="font-semibold text-base">{course.percent}%</p>
                                    </div>
                                    <div className="mt-2 h-2.5 rounded-full bg-secondary overflow-hidden">
                                        <div className={cn('h-full rounded-full', course.color)} style={{ width: `${course.percent}%` }} />
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
                            {upcoming.map((item) => (
                                <article key={item.title} className="panel-subcard p-3">
                                    <p className="font-medium text-base">{item.title}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{item.course}</p>
                                    <span className={cn('inline-flex mt-2 rounded-full px-2 py-0.5 text-xs font-medium', item.tone)}>{item.due}</span>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="panel-card p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        Aktivitas Terakhir
                    </h3>
                    <div className="mt-3 divide-y divide-border">
                        {activities.map((item) => {
                            const Icon = item.icon;
                            return (
                                <article key={`${item.title}-${item.time}`} className="flex items-start justify-between gap-3 py-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-base">{item.title}</p>
                                            <p className="text-sm text-muted-foreground truncate">{item.text}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-muted-foreground whitespace-nowrap inline-flex items-center gap-1.5">
                                        <Clock3 className="w-3.5 h-3.5" />
                                        {item.time}
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}



