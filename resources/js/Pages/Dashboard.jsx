import { useId, useMemo, useState } from 'react';
import {
    Activity,
    Award,
    BarChart3,
    BookOpen,
    CalendarDays,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    Clock,
    Crown,
    FileText,
    GraduationCap,
    ListChecks,
    MessageSquare,
    Shield,
    TrendingUp,
    UserCheck,
    Users,
    Wallet,
} from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { KPI_CARD_BASE_CLASS, KPI_CARD_HEIGHT_CLASS } from '@/lib/card';

const UI = {
    kpiCardHeight: KPI_CARD_HEIGHT_CLASS,
    panelClass: 'bg-card rounded-xl border border-border p-4 shadow-card',
    kpiGridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr',
    miniGridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr',
    miniGridFourClass: 'grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr',
    chartHeightClass: 'h-[210px]',
};

function SectionTitle({ icon: Icon, children }) {
    return (
        <h3 className="font-semibold flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <span>{children}</span>
        </h3>
    );
}

function DashboardIcon({ icon: Icon, variant = 'primary' }) {
    const variantClass = {
        primary: 'gradient-primary text-primary-foreground',
        accent: 'gradient-accent text-accent-foreground',
        warm: 'gradient-warm text-foreground',
        success: 'gradient-success text-success-foreground',
    };

    return (
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-card', variantClass[variant] ?? variantClass.primary)}>
            {Icon && <Icon className="w-5 h-5" strokeWidth={2.25} />}
        </div>
    );
}

function HeroSection({ user, greeting, subtitle, intlLocale = 'id-ID' }) {
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

    return (
        <section className="space-y-3 animate-fade-in">
            <PageHeroBanner title={greeting} description={subtitle} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">Role Aktif</p>
                    <p className="font-semibold mt-1 capitalize">{String(user.role).replace('_', ' ')}</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Hari Ini
                    </p>
                    <p className="font-semibold mt-1">{today}</p>
                </div>
            </div>
        </section>
    );
}

function RecentActivity({ activities = [], intlLocale = 'id-ID' }) {
    const [showAll, setShowAll] = useState(false);
    const fallbackActivities = [
        { text: 'Tugas Algoritma telah dikumpulkan', timeText: '2 menit lalu', color: 'bg-success' },
        { text: 'Materi baru: Pengantar Machine Learning', timeText: '15 menit lalu', color: 'bg-primary' },
        { text: 'Kuis Basis Data dimulai', timeText: '1 jam lalu', color: 'bg-warning' },
        { text: 'Diskusi baru di Forum Pemrograman Web', timeText: '2 jam lalu', color: 'bg-info' },
        { text: 'Pengumuman kelas Pemrograman Web dipublikasikan', timeText: '3 jam lalu', color: 'bg-accent' },
    ];
    const list = activities.length ? activities : fallbackActivities;
    const visibleList = showAll ? list : list.slice(0, 4);

    const colorByAction = {
        create: 'bg-success',
        update: 'bg-info',
        delete: 'bg-destructive',
    };

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '250ms' }}>
            <div className="flex items-center justify-between mb-4">
                <SectionTitle icon={ListChecks}>Aktivitas Terbaru</SectionTitle>
                {list.length > 4 && (
                    <button
                        type="button"
                        onClick={() => setShowAll((prev) => !prev)}
                        className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                    >
                        {showAll ? 'Tampilkan sedikit' : 'Lihat semua'}
                    </button>
                )}
            </div>
            <div className="space-y-3">
                {visibleList.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors">
                        <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', colorByAction[activity.action] ?? activity.color ?? 'bg-muted-foreground')} />
                        <div className="min-w-0">
                            <p className="text-sm leading-relaxed">{activity.text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.timeText ?? (activity.time ? new Date(activity.time).toLocaleString(intlLocale) : '-')}
                            </p>
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
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '300ms' }}>
            <SectionTitle icon={GraduationCap}>Progress Kursus</SectionTitle>
            <div className="mb-4" />
            <div className="space-y-4">
                {courses.map((course, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span>{course.name}</span>
                            <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all duration-700', course.color)} style={{ width: `${course.progress}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UpcomingSchedule() {
    const [activeType, setActiveType] = useState('Semua');
    const items = [
        { title: 'Kelas Algoritma', time: '09:00 - 10:30', type: 'Kelas' },
        { title: 'Deadline Tugas Basis Data', time: '23:59', type: 'Tugas' },
        { title: 'Kuis Pemrograman Web', time: '13:00 - 14:00', type: 'Kuis' },
        { title: 'Review Materi Cloud Computing', time: '16:00 - 16:45', type: 'Kelas' },
    ];

    const filteredItems = activeType === 'Semua' ? items : items.filter((item) => item.type === activeType);
    const tabClass = (type) =>
        cn(
            'text-xs px-2.5 py-1 rounded-full border transition-colors',
            activeType === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-secondary'
        );

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '350ms' }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <SectionTitle icon={Clock}>Jadwal Mendatang</SectionTitle>
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    {['Semua', 'Kelas', 'Tugas', 'Kuis'].map((type) => (
                        <button key={type} type="button" className={tabClass(type)} onClick={() => setActiveType(type)}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                {filteredItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/45 hover:bg-secondary/75 transition-colors">
                        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{item.type}</span>
                    </div>
                ))}
                {!filteredItems.length && <p className="text-sm text-muted-foreground">Belum ada jadwal untuk filter ini.</p>}
            </div>
        </div>
    );
}

function ModernTrendChart({ title, data = [], valueFormatter = (value) => String(value), tone = 'primary' }) {
    const gradientId = useId();
    const [activeIndex, setActiveIndex] = useState(data.length ? data.length - 1 : 0);
    const chartWidth = 760;
    const chartHeight = 220;
    const paddingX = 24;
    const paddingY = 18;
    const values = data.map((item) => Number(item.value) || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = Math.max(maxValue - minValue, 1);
    const strokeColor = tone === 'success' ? 'hsl(var(--success))' : 'hsl(var(--primary))';

    const points = data.map((item, index) => {
        const x = paddingX + (index * (chartWidth - paddingX * 2)) / Math.max(data.length - 1, 1);
        const ratio = (Number(item.value) - minValue) / range;
        const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
        return { x, y, item };
    });

    const linePath = points.map((point) => `${point.x},${point.y}`).join(' ');
    const areaPath = points.length
        ? `M ${points[0].x} ${chartHeight - paddingY} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${points[points.length - 1].x} ${chartHeight - paddingY} Z`
        : '';

    const clampedActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(data.length - 1, 0));
    const activeItem = data[clampedActiveIndex];
    const trendPercent = data.length > 1 && values[0] > 0 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;

    const handleMouseMove = (event) => {
        if (data.length < 2) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
        const ratioX = relativeX / bounds.width;
        setActiveIndex(Math.round(ratioX * (data.length - 1)));
    };

    if (!data.length) return null;

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '380ms' }}>
            <div className="flex items-center justify-between gap-4">
                <SectionTitle icon={BarChart3}>{title}</SectionTitle>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Trend</p>
                    <p className={cn('text-sm font-semibold', trendPercent >= 0 ? 'text-success' : 'text-destructive')}>
                        {trendPercent >= 0 ? '+' : ''}
                        {trendPercent.toFixed(1)}%
                    </p>
                </div>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-background/55 p-3">
                <div className="w-full overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIndex(data.length ? data.length - 1 : 0)}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={cn('w-full', UI.chartHeightClass)}>
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                            const y = paddingY + (chartHeight - paddingY * 2) * ratio;
                            return <line key={ratio} x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
                        })}
                        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
                        <polyline fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={linePath} />
                        {points.map((point, index) => (
                            <circle
                                key={point.item.label}
                                cx={point.x}
                                cy={point.y}
                                r={index === clampedActiveIndex ? 6 : 4}
                                fill={index === clampedActiveIndex ? strokeColor : 'hsl(var(--background))'}
                                stroke={strokeColor}
                                strokeWidth={index === clampedActiveIndex ? 3 : 2}
                                className="transition-all duration-150"
                                onMouseEnter={() => setActiveIndex(index)}
                            />
                        ))}
                    </svg>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Nilai Aktif</p>
                        <p className="font-semibold mt-1">{activeItem ? valueFormatter(activeItem.value) : '-'}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Periode</p>
                        <p className="font-semibold mt-1">{activeItem?.label ?? '-'}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Titik Tertinggi</p>
                        <p className="font-semibold mt-1">{valueFormatter(maxValue)}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {data.map((item, index) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                                index === clampedActiveIndex ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-secondary'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CompactStatCard({ title, value, change, changeType = 'up', icon: Icon, gradient = 'primary', delay = 0 }) {
    const changeTone = changeType === 'down' ? 'text-destructive' : 'text-success';

    return (
        <div className={cn('h-full hover:-translate-y-0.5 transition-transform animate-fade-in', KPI_CARD_BASE_CLASS)} style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground truncate">{title}</p>
                </div>
                {Icon && <DashboardIcon icon={Icon} variant={gradient} />}
            </div>
            <div>
                <p className="text-[2rem] leading-none font-bold">{value}</p>
                <p className={cn('text-sm font-semibold mt-2 min-h-[20px]', change ? changeTone : 'opacity-0')}>{change ?? '-'}</p>
            </div>
        </div>
    );
}

function MiniRoleCard({ title, value, icon: Icon, iconVariant = 'primary' }) {
    return (
        <div className={cn('h-full hover:-translate-y-0.5 transition-transform', KPI_CARD_BASE_CLASS)}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground truncate">{title}</p>
                {Icon && <DashboardIcon icon={Icon} variant={iconVariant} />}
            </div>
            <p className="text-[2rem] leading-none font-bold">{value}</p>
        </div>
    );
}

function EqualCard({ children }) {
    return <div className={cn('h-full [&>*]:h-full', UI.kpiCardHeight)}>{children}</div>;
}

export default function Dashboard() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const superAdmin = props.superAdmin;
    const adminAcademic = props.adminAcademic;
    const financeData = props.financeData;
    const intlLocale = toIntlLocale(props?.system?.default_language);
    const roleStats = superAdmin?.role_stats ?? {};
    const monthlyUsers = superAdmin?.monthly_users ?? [];
    const adminRoleStats = adminAcademic?.role_stats ?? {};
    const monthlyIncome = financeData?.monthly_income ?? [];

    const roleGreeting = {
        super_admin: 'Selamat datang, Super Admin',
        admin: 'Selamat datang, Admin Akademik',
        finance: 'Selamat datang, Tim Finance',
        dosen: 'Selamat datang, Dosen',
        mahasiswa: 'Selamat datang, Mahasiswa',
    };

    const roleSubtitle = {
        super_admin: 'Pantau seluruh aktivitas lintas role, performa pengguna, dan kesehatan platform E-Learning secara real-time.',
        admin: 'Pantau operasional akademik, approval akun, serta kualitas data dan kursus dalam satu tampilan.',
        finance: 'Kontrol tagihan, verifikasi pembayaran, dan cashflow pembelajaran dengan alur kerja yang lebih cepat.',
        dosen: 'Kelola kelas, materi, penilaian, dan respons mahasiswa dari dashboard yang ringkas dan fokus.',
        mahasiswa: 'Ikuti ritme belajarmu dengan progress kursus, jadwal penting, dan aktivitas terbaru.',
    };

    const superAdminChartData = monthlyUsers.map((item) => ({
        label: item.month,
        value: Number(item.total) || 0,
    }));

    const financeChartData = monthlyIncome.map((item) => ({
        label: item.month,
        value: Number(item.total) || 0,
    }));

    return (
        <ProtectedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6 w-full max-w-none">
                <HeroSection user={user} greeting={roleGreeting[user.role]} subtitle={roleSubtitle[user.role]} intlLocale={intlLocale} />

                {user.role === 'super_admin' && (
                    <>
                        <div className={UI.kpiGridClass}>
                            <EqualCard><CompactStatCard title="Total Pengguna" value={superAdmin?.summary?.total_users ?? 0} change={`+${superAdmin?.summary?.new_this_month ?? 0} bulan ini`} changeType="up" icon={Users} gradient="primary" delay={0} /></EqualCard>
                            <EqualCard><CompactStatCard title="Admin Akademik" value={roleStats.admin ?? 0} icon={Shield} gradient="accent" delay={80} /></EqualCard>
                            <EqualCard><CompactStatCard title="Dosen" value={roleStats.teacher ?? 0} icon={UserCheck} gradient="warm" delay={160} /></EqualCard>
                            <EqualCard><CompactStatCard title="Mahasiswa" value={roleStats.student ?? 0} icon={BookOpen} gradient="success" delay={240} /></EqualCard>
                        </div>
                        <div className={UI.miniGridClass}>
                            <EqualCard><MiniRoleCard title="Finance" value={roleStats.finance ?? 0} icon={Wallet} iconVariant="primary" /></EqualCard>
                            <EqualCard><MiniRoleCard title="Super Admin" value={roleStats.root ?? 0} icon={Crown} iconVariant="accent" /></EqualCard>
                            <EqualCard><MiniRoleCard title="Sesi Aktif (15m)" value={superAdmin?.summary?.active_sessions ?? 0} icon={Activity} iconVariant="success" /></EqualCard>
                        </div>
                    </>
                )}

                {user.role === 'admin' && (
                    <>
                        <div className={UI.kpiGridClass}>
                            <EqualCard><CompactStatCard title="Total User Akademik" value={adminAcademic?.summary?.total_users ?? 0} change={`+${adminAcademic?.summary?.new_users_month ?? 0} bulan ini`} changeType="up" icon={Users} gradient="primary" delay={0} /></EqualCard>
                            <EqualCard><CompactStatCard title="Menunggu Persetujuan" value={adminAcademic?.summary?.pending_approvals ?? 0} icon={Clock} gradient="warm" delay={80} /></EqualCard>
                            <EqualCard><CompactStatCard title="Total Kursus" value={adminAcademic?.summary?.courses_count ?? 0} icon={BookOpen} gradient="accent" delay={160} /></EqualCard>
                            <EqualCard><CompactStatCard title="Kursus Aktif" value={adminAcademic?.summary?.active_courses_count ?? 0} icon={FileText} gradient="success" delay={240} /></EqualCard>
                        </div>
                        <div className={UI.miniGridFourClass}>
                            <EqualCard><MiniRoleCard title="Admin" value={adminRoleStats.admin ?? 0} icon={Shield} iconVariant="accent" /></EqualCard>
                            <EqualCard><MiniRoleCard title="Finance" value={adminRoleStats.finance ?? 0} icon={Wallet} iconVariant="primary" /></EqualCard>
                            <EqualCard><MiniRoleCard title="Dosen" value={adminRoleStats.teacher ?? 0} icon={UserCheck} iconVariant="warm" /></EqualCard>
                            <EqualCard><MiniRoleCard title="Mahasiswa" value={adminRoleStats.student ?? 0} icon={BookOpen} iconVariant="success" /></EqualCard>
                        </div>
                    </>
                )}

                {user.role === 'finance' && (
                    <div className={UI.kpiGridClass}>
                        <EqualCard><CompactStatCard title="Total Tagihan" value={financeData?.summary?.total_invoices ?? 0} icon={FileText} gradient="primary" delay={0} /></EqualCard>
                        <EqualCard><CompactStatCard title="Pembayaran Pending" value={financeData?.summary?.pending_payments ?? 0} icon={Clock} gradient="warm" delay={80} /></EqualCard>
                        <EqualCard><CompactStatCard title="Pembayaran Terverifikasi" value={financeData?.summary?.verified_payments ?? 0} icon={Shield} gradient="accent" delay={160} /></EqualCard>
                        <EqualCard><CompactStatCard title="Pendapatan Bulan Ini" value={new Intl.NumberFormat(intlLocale).format(financeData?.summary?.income_month ?? 0)} icon={TrendingUp} gradient="success" delay={240} /></EqualCard>
                    </div>
                )}

                {user.role === 'dosen' && (
                    <div className={UI.kpiGridClass}>
                        <EqualCard><CompactStatCard title="Kursus Saya" value={6} icon={BookOpen} gradient="primary" delay={0} /></EqualCard>
                        <EqualCard><CompactStatCard title="Total Mahasiswa" value={182} change="+12 minggu ini" changeType="up" icon={Users} gradient="accent" delay={80} /></EqualCard>
                        <EqualCard><CompactStatCard title="Tugas Belum Dinilai" value={23} icon={ClipboardList} gradient="warm" delay={160} /></EqualCard>
                        <EqualCard><CompactStatCard title="Kuis Aktif" value={4} icon={Award} gradient="success" delay={240} /></EqualCard>
                    </div>
                )}

                {user.role === 'mahasiswa' && (
                    <div className={UI.kpiGridClass}>
                        <EqualCard><CompactStatCard title="Kursus Diikuti" value={5} icon={BookOpen} gradient="primary" delay={0} /></EqualCard>
                        <EqualCard><CompactStatCard title="Tugas Pending" value={3} icon={ClipboardList} gradient="warm" delay={80} /></EqualCard>
                        <EqualCard><CompactStatCard title="Kuis Mendatang" value={2} icon={Award} gradient="accent" delay={160} /></EqualCard>
                        <EqualCard><CompactStatCard title="Rata-rata Nilai" value="85.4" change="+2.1 dari semester lalu" changeType="up" icon={TrendingUp} gradient="success" delay={240} /></EqualCard>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <RecentActivity
                            intlLocale={intlLocale}
                            activities={
                                user.role === 'super_admin'
                                    ? superAdmin?.recent_activities ?? []
                                    : user.role === 'admin'
                                      ? adminAcademic?.recent_activities ?? []
                                      : user.role === 'finance'
                                        ? financeData?.recent_activities ?? []
                                        : []
                            }
                        />

                        {user.role === 'super_admin' && superAdminChartData.length > 0 && (
                            <ModernTrendChart title="Pertumbuhan Akun 6 Bulan" data={superAdminChartData} tone="primary" />
                        )}
                        {user.role === 'finance' && financeChartData.length > 0 && (
                            <ModernTrendChart
                                title="Cashflow 6 Bulan"
                                data={financeChartData}
                                tone="success"
                                valueFormatter={(value) => new Intl.NumberFormat(intlLocale).format(value)}
                            />
                        )}

                        {(user.role === 'admin' || user.role === 'dosen' || user.role === 'mahasiswa') && (
                            <div className={cn(UI.panelClass, 'animate-fade-in')}>
                                <div className="flex items-center justify-between">
                                    <SectionTitle icon={ClipboardCheck}>Quick Action</SectionTitle>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button type="button" className="text-left rounded-xl border border-border p-3 hover:bg-secondary transition-colors">
                                        <p className="font-medium text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Buka Forum Diskusi</p>
                                        <p className="text-xs text-muted-foreground mt-1">Lanjutkan diskusi kelas terakhir</p>
                                    </button>
                                    <button type="button" className="text-left rounded-xl border border-border p-3 hover:bg-secondary transition-colors">
                                        <p className="font-medium text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" />Lihat Tugas Prioritas</p>
                                        <p className="text-xs text-muted-foreground mt-1">Akses item yang mendekati deadline</p>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        {(user.role === 'mahasiswa' || user.role === 'dosen') && <CourseProgress />}
                        <UpcomingSchedule />
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
