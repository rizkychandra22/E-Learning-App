import { Shield, UserCheck, Users, BookOpen, ClipboardList, Award, TrendingUp, Clock, FileText } from 'lucide-react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';

function RecentActivity() {
    const activities = [
        { text: 'Tugas Algoritma telah dikumpulkan', time: '2 menit lalu', color: 'bg-success' },
        { text: 'Materi baru: Pengantar Machine Learning', time: '15 menit lalu', color: 'bg-primary' },
        { text: 'Kuis Basis Data dimulai', time: '1 jam lalu', color: 'bg-warning' },
        { text: 'Diskusi baru di Forum Pemrograman Web', time: '2 jam lalu', color: 'bg-info' },
        { text: 'Nilai UTS Struktur Data diumumkan', time: '3 jam lalu', color: 'bg-accent-foreground' },
    ];

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-card animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h3 className="font-semibold mb-4">Aktivitas Terbaru</h3>
            <div className="space-y-3">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', activity.color)} />
                        <div>
                            <p className="text-sm">{activity.text}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CourseProgress() {
    const courses = [
        { name: 'Algoritma & Pemrograman', progress: 85, color: 'gradient-primary' },
        { name: 'Basis Data', progress: 62, color: 'gradient-accent' },
        { name: 'Pemrograman Web', progress: 45, color: 'gradient-warm' },
        { name: 'Machine Learning', progress: 28, color: 'gradient-success' },
    ];

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-card animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h3 className="font-semibold mb-4">Progress Kursus</h3>
            <div className="space-y-4">
                {courses.map((course, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span>{course.name}</span>
                            <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all duration-700', course.color)} style={{ width: `${course.progress}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UpcomingSchedule() {
    const items = [
        { title: 'Kelas Algoritma', time: '09:00 - 10:30', type: 'Kelas' },
        { title: 'Deadline Tugas Basis Data', time: '23:59', type: 'Tugas' },
        { title: 'Kuis Pemrograman Web', time: '13:00 - 14:00', type: 'Kuis' },
    ];

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-card animate-fade-in" style={{ animationDelay: '500ms' }}>
            <h3 className="font-semibold mb-4">Jadwal Mendatang</h3>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{item.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    if (!user) return null;

    const roleGreeting = {
        super_admin: 'Selamat datang, Super Admin',
        admin: 'Selamat datang, Admin',
        dosen: 'Selamat datang, Dosen',
        mahasiswa: 'Selamat datang',
    };

    return (
        <ProtectedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6 max-w-7xl">
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-bold tracking-tight">{roleGreeting[user.role]}</h1>
                    <p className="text-muted-foreground mt-1">
                        {user.role === 'super_admin' && 'Pantau seluruh aktivitas sistem E-Learning'}
                        {user.role === 'admin' && 'Kelola pengguna dan kursus dengan mudah'}
                        {user.role === 'dosen' && 'Kelola kursus dan pantau progress mahasiswa'}
                        {user.role === 'mahasiswa' && 'Lihat kursus dan progress belajar kamu'}
                    </p>
                </div>

                {user.role === 'super_admin' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard title="Total Admin" value={12} change="+2 bulan ini" changeType="up" icon={Shield} gradient="primary" delay={0} /><StatCard title="Total Dosen" value={48} change="+5 bulan ini" changeType="up" icon={UserCheck} gradient="accent" delay={80} /><StatCard title="Total Mahasiswa" value="1,234" change="+120 bulan ini" changeType="up" icon={Users} gradient="success" delay={160} /><StatCard title="Total Kursus" value={86} change="+8 bulan ini" changeType="up" icon={BookOpen} gradient="warm" delay={240} /></div>}
                {user.role === 'admin' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard title="Total User" value="1,294" change="+127 bulan ini" changeType="up" icon={Users} gradient="primary" delay={0} /><StatCard title="Kursus Aktif" value={52} change="+3 minggu ini" changeType="up" icon={BookOpen} gradient="accent" delay={80} /><StatCard title="Menunggu Persetujuan" value={8} icon={Clock} gradient="warm" delay={160} /><StatCard title="Kategori" value={15} icon={FileText} gradient="success" delay={240} /></div>}
                {user.role === 'dosen' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard title="Kursus Saya" value={6} icon={BookOpen} gradient="primary" delay={0} /><StatCard title="Total Mahasiswa" value={182} change="+12 minggu ini" changeType="up" icon={Users} gradient="accent" delay={80} /><StatCard title="Tugas Belum Dinilai" value={23} icon={ClipboardList} gradient="warm" delay={160} /><StatCard title="Kuis Aktif" value={4} icon={Award} gradient="success" delay={240} /></div>}
                {user.role === 'mahasiswa' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard title="Kursus Diikuti" value={5} icon={BookOpen} gradient="primary" delay={0} /><StatCard title="Tugas Pending" value={3} icon={ClipboardList} gradient="warm" delay={80} /><StatCard title="Kuis Mendatang" value={2} icon={Award} gradient="accent" delay={160} /><StatCard title="Rata-rata Nilai" value="85.4" change="+2.1 dari semester lalu" changeType="up" icon={TrendingUp} gradient="success" delay={240} /></div>}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6"><RecentActivity /></div>
                    <div className="space-y-6">{(user.role === 'mahasiswa' || user.role === 'dosen') && <CourseProgress />}<UpcomingSchedule /></div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
