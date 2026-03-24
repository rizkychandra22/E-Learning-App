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

const UI = {
    panelClass: 'relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-card text-foreground',
    kpiGridClass: 'grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 auto-rows-fr',
    miniGridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 auto-rows-fr',
    miniGridFourClass: 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr',
    chartHeightClass: 'h-[210px]',
};

const KPI_GRADIENT_CLASS = {
    primary: 'gradient-primary',
    accent: 'gradient-success',
    warm: 'gradient-warm',
    success: 'gradient-accent',
};

const CHIP_BY_ROLE = {
    super_admin: 'bg-primary text-primary-foreground',
    admin: 'bg-success text-success-foreground',
    finance: 'bg-warning text-foreground',
    dosen: 'bg-info text-white',
    mahasiswa: 'bg-accent text-accent-foreground',
};

function SectionTitle({ icon: Icon, children }) {
    return (
        <h3 className="font-semibold flex items-center gap-2 text-foreground">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <span>{children}</span>
        </h3>
    );
}

function KpiCard({ title, value, change, icon: Icon, gradient = 'primary', delay = 0 }) {
    const hasValue = value !== null && value !== undefined && value !== '';

    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-card-lg animate-fade-in min-h-[132px]', KPI_GRADIENT_CLASS[gradient] ?? KPI_GRADIENT_CLASS.primary)} style={{ animationDelay: `${delay}ms` }}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                {Icon ? <Icon className="h-4 w-4 text-white/90" /> : null}
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/85">{title}</p>
            <p className="mt-1.5 text-[30px] leading-none font-bold tracking-tight">{hasValue ? value : '-'}</p>
            <p className="mt-1 text-xs text-white/85 min-h-[18px]">{change ?? '\u00A0'}</p>
        </div>
    );
}

function RoleMiniCard({ title, value, icon: Icon, meta, tone = 'primary' }) {
    const toneGradient = {
        primary: 'gradient-primary',
        accent: 'gradient-accent',
        success: 'gradient-success',
        warm: 'gradient-warm',
    };

    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-card-lg animate-fade-in min-h-[124px]', toneGradient[tone] ?? toneGradient.primary)}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                {Icon ? <Icon className="h-4 w-4 text-white/90" /> : null}
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/85">{title}</p>
            <p className="mt-1.5 text-[30px] leading-none font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-white/85">{meta}</p>
        </div>
    );
}

function KpiGrid({ cards }) {
    return (
        <div className={UI.kpiGridClass}>
            {cards.map((card) => (
                <KpiCard key={card.title} {...card} />
            ))}
        </div>
    );
}

function TrendEmptyState({ title }) {
    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')}>
            <div className="flex items-center justify-between gap-4">
                <SectionTitle icon={BarChart3}>{title}</SectionTitle>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
                <p className="text-sm font-medium">Belum ada data tren</p>
                <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah periode pelaporan tersedia.</p>
            </div>
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
        <section className={cn(UI.panelClass, 'animate-fade-in')}>
            <div className="absolute inset-x-0 top-0 h-1.5 gradient-primary opacity-90" />
            <div className="flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', CHIP_BY_ROLE[user.role] ?? CHIP_BY_ROLE.admin)}>
                    {String(user.role).replace('_', ' ')}
                </span>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{greeting}</h1>
                    <p className="mt-1 text-sm sm:text-base text-muted-foreground max-w-3xl">{subtitle}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs sm:text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span>{today}</span>
                </div>
            </div>
        </section>
    );
}

function RecentActivity({ title = 'Aktivitas Terbaru', activities = [], intlLocale = 'id-ID' }) {
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
                <SectionTitle icon={ListChecks}>{title}</SectionTitle>
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
                    <div key={index} className="flex items-start gap-3 rounded-xl border border-transparent p-2.5 hover:bg-secondary/60 hover:border-border transition-colors">
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
            <div className="mt-4 panel-subcard p-3">
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

function BarColumnChart({ title, data = [], valueFormatter = (value) => String(value) }) {
    if (!data.length) return null;
    const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '360ms' }}>
            <SectionTitle icon={BarChart3}>{title}</SectionTitle>
            <div className="mt-4 panel-subcard p-4">
                <div className="grid grid-cols-6 gap-2 h-44 items-end">
                    {data.map((item) => {
                        const value = Number(item.value) || 0;
                        const height = Math.max((value / maxValue) * 100, 8);
                        return (
                            <div key={item.label} className="flex flex-col items-center gap-2">
                                <div className="w-full rounded-t-md gradient-primary transition-all duration-500" style={{ height: `${height}%` }} />
                                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                    Tertinggi: <span className="font-semibold text-foreground">{valueFormatter(maxValue)}</span>
                </div>
            </div>
        </div>
    );
}

function DonutCategoryChart({ title, data = [] }) {
    if (!data.length) return null;

    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1;
    const size = 140;
    const radius = 56;
    const cx = size / 2;
    const cy = size / 2;
    const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];
    const [activeIndex, setActiveIndex] = useState(0);

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
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '360ms' }}>
            <SectionTitle icon={BookOpen}>{title}</SectionTitle>
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
                                />
                            );
                        })}
                    </svg>
                    <div className="w-full space-y-2">
                        {data.map((item, index) => (
                            <button
                                key={item.label}
                                type="button"
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => setActiveIndex(index)}
                                className={cn(
                                    'w-full flex items-center justify-between text-sm rounded-lg px-2 py-1.5 transition-colors',
                                    index === activeIndex ? 'bg-primary/10' : 'hover:bg-secondary/60'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                    <span>{item.label}</span>
                                </div>
                                <span className="font-semibold">{item.value}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HorizontalMetricChart({ title, data = [] }) {
    if (!data.length) return null;
    const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '360ms' }}>
            <SectionTitle icon={Users}>{title}</SectionTitle>
            <div className="mt-4 space-y-3">
                {data.map((item) => {
                    const value = Number(item.value) || 0;
                    const width = Math.max((value / maxValue) * 100, 1);
                    return (
                        <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-semibold">{item.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${width}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FinanceCompareChart({ title, data = [], valueFormatter = (value) => String(value) }) {
    if (!data.length) return null;

    const gradientId = useId();
    const chartWidth = 760;
    const chartHeight = 220;
    const paddingX = 24;
    const paddingY = 18;
    const incomes = data.map((item) => Number(item.income) || 0);
    const expenses = data.map((item) => Number(item.expense) || 0);
    const allValues = [...incomes, ...expenses];
    const maxValue = Math.max(...allValues, 1);
    const minValue = Math.min(...allValues, 0);
    const range = Math.max(maxValue - minValue, 1);

    const buildPoints = (values) =>
        values.map((value, index) => {
            const x = paddingX + (index * (chartWidth - paddingX * 2)) / Math.max(values.length - 1, 1);
            const ratio = (value - minValue) / range;
            const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
            return { x, y };
        });

    const incomePoints = buildPoints(incomes);
    const expensePoints = buildPoints(expenses);

    const incomeLine = incomePoints.map((point) => `${point.x},${point.y}`).join(' ');
    const expenseLine = expensePoints.map((point) => `${point.x},${point.y}`).join(' ');
    const incomeArea = incomePoints.length
        ? `M ${incomePoints[0].x} ${chartHeight - paddingY} L ${incomePoints.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${incomePoints[incomePoints.length - 1].x} ${chartHeight - paddingY} Z`
        : '';

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '360ms' }}>
            <div className="flex items-center justify-between gap-4">
                <SectionTitle icon={BarChart3}>{title}</SectionTitle>
                <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Pemasukan</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Pengeluaran</span>
                </div>
            </div>
            <div className="mt-4 panel-subcard p-3">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={cn('w-full', UI.chartHeightClass)}>
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.04" />
                        </linearGradient>
                    </defs>
                    {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                        const y = paddingY + (chartHeight - paddingY * 2) * ratio;
                        return <line key={ratio} x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
                    })}
                    {incomeArea && <path d={incomeArea} fill={`url(#${gradientId})`} />}
                    <polyline fill="none" stroke="hsl(var(--success))" strokeWidth="3" strokeLinecap="round" points={incomeLine} />
                    <polyline fill="none" stroke="hsl(var(--warning))" strokeWidth="2.5" strokeLinecap="round" points={expenseLine} />
                </svg>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Pemasukan Tertinggi</p>
                        <p className="font-semibold mt-1">{valueFormatter(Math.max(...incomes, 0))}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Pengeluaran Tertinggi</p>
                        <p className="font-semibold mt-1">{valueFormatter(Math.max(...expenses, 0))}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RadarPerformanceChart({ title, data = [] }) {
    if (!data.length) return null;

    const size = 240;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 80;
    const rings = 4;

    const pointFor = (index, value = 100) => {
        const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
        const r = (value / 100) * radius;
        return {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
        };
    };

    const polygonPoints = data
        .map((item, index) => {
            const point = pointFor(index, Number(item.value) || 0);
            return `${point.x},${point.y}`;
        })
        .join(' ');

    return (
        <div className={cn(UI.panelClass, 'animate-fade-in')} style={{ animationDelay: '360ms' }}>
            <SectionTitle icon={Award}>{title}</SectionTitle>
            <div className="mt-4 panel-subcard p-4 flex items-center justify-center">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px]">
                    {Array.from({ length: rings }).map((_, ringIndex) => {
                        const ringRadius = (radius / rings) * (ringIndex + 1);
                        const ringPoints = data
                            .map((__, index) => {
                                const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
                                const x = cx + Math.cos(angle) * ringRadius;
                                const y = cy + Math.sin(angle) * ringRadius;
                                return `${x},${y}`;
                            })
                            .join(' ');
                        return <polygon key={ringIndex} points={ringPoints} fill="none" stroke="hsl(var(--border))" />;
                    })}

                    {data.map((item, index) => {
                        const outer = pointFor(index, 100);
                        return <line key={item.label} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="hsl(var(--border))" />;
                    })}

                    <polygon points={polygonPoints} fill="hsl(var(--primary) / 0.24)" stroke="hsl(var(--primary))" strokeWidth="2.5" />
                    {data.map((item, index) => {
                        const point = pointFor(index, Number(item.value) || 0);
                        const label = pointFor(index, 118);
                        return (
                            <g key={item.label}>
                                <circle cx={point.x} cy={point.y} r="3.5" fill="hsl(var(--primary))" />
                                <text x={label.x} y={label.y} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                                    {item.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
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

    const fallbackMonthlyData = [
        { label: 'Okt', value: 320 },
        { label: 'Nov', value: 410 },
        { label: 'Des', value: 380 },
        { label: 'Jan', value: 520 },
        { label: 'Feb', value: 610 },
        { label: 'Mar', value: 730 },
    ];

    const adminEnrollmentData = (adminAcademic?.summary?.total_users ?? 0) > 0 ? fallbackMonthlyData : fallbackMonthlyData;
    const superWeeklyActivityData = [
        { label: 'Sen', value: 45 },
        { label: 'Sel', value: 62 },
        { label: 'Rab', value: 58 },
        { label: 'Kam', value: 72 },
        { label: 'Jum', value: 54 },
        { label: 'Sab', value: 30 },
        { label: 'Min', value: 22 },
    ];

    const computedRoleDistribution = [
        { label: 'Mahasiswa', value: roleStats.student ?? 0 },
        { label: 'Dosen', value: roleStats.teacher ?? 0 },
        { label: 'Admin', value: roleStats.admin ?? 0 },
        { label: 'Finance', value: roleStats.finance ?? 0 },
        { label: 'Super Admin', value: roleStats.root ?? 0 },
    ];
    const roleDistributionData = computedRoleDistribution.some((item) => Number(item.value) > 0)
        ? computedRoleDistribution
        : [
            { label: 'Mahasiswa', value: 2310 },
            { label: 'Dosen', value: 148 },
            { label: 'Admin', value: 12 },
            { label: 'Finance', value: 8 },
            { label: 'Super Admin', value: 3 },
        ];

    const adminCategoryData = [
        { label: 'Programming', value: 45 },
        { label: 'Design', value: 28 },
        { label: 'Business', value: 32 },
        { label: 'Language', value: 20 },
        { label: 'Science', value: 23 },
    ];

    const financeSeriesData = (financeChartData.length ? financeChartData : fallbackMonthlyData).map((item) => {
        const income = Number(item.value) || 0;
        return {
            label: item.label,
            income,
            expense: Math.max(Math.round(income * 0.26), 1),
        };
    });

    const financeMethodData = [
        { label: 'Transfer Bank', value: 58 },
        { label: 'Virtual Account', value: 27 },
        { label: 'E-Wallet', value: 12 },
        { label: 'Kartu Kredit', value: 4 },
    ];

    const dosenRadarData = [
        { label: 'Kehadiran', value: 82 },
        { label: 'Tugas', value: 74 },
        { label: 'UTS', value: 69 },
        { label: 'UAS', value: 77 },
        { label: 'Proyek', value: 71 },
        { label: 'Partisipasi', value: 80 },
    ];

    const dosenKpis = [
        { title: 'Kursus Saya', value: 6, icon: BookOpen, gradient: 'primary', delay: 0 },
        { title: 'Total Mahasiswa', value: 182, change: '+12 minggu ini', changeType: 'up', icon: Users, gradient: 'accent', delay: 80 },
        { title: 'Tugas Belum Dinilai', value: 23, icon: ClipboardList, gradient: 'warm', delay: 160 },
        { title: 'Kuis Aktif', value: 4, icon: Award, gradient: 'success', delay: 240 },
    ];

    const mahasiswaKpis = [
        { title: 'Kursus Diikuti', value: 5, icon: BookOpen, gradient: 'primary', delay: 0 },
        { title: 'Tugas Pending', value: 3, icon: ClipboardList, gradient: 'warm', delay: 80 },
        { title: 'Kuis Mendatang', value: 2, icon: Award, gradient: 'accent', delay: 160 },
        { title: 'Rata-rata Nilai', value: '85.4', change: '+2.1 dari semester lalu', changeType: 'up', icon: TrendingUp, gradient: 'success', delay: 240 },
    ];

    return (
        <ProtectedLayout>
            <Head title="Dashboard" />
            <div className="space-y-5 sm:space-y-6 w-full max-w-none">
                <HeroSection user={user} greeting={roleGreeting[user.role]} subtitle={roleSubtitle[user.role]} intlLocale={intlLocale} />

                {user.role === 'super_admin' && (
                    <>
                        <KpiGrid
                            cards={[
                                { title: 'Total Pengguna', value: superAdmin?.summary?.total_users ?? 0, change: `+${superAdmin?.summary?.new_this_month ?? 0} bulan ini`, changeType: 'up', icon: Users, gradient: 'primary', delay: 0 },
                                { title: 'Admin Akademik', value: roleStats.admin ?? 0, icon: Shield, gradient: 'accent', delay: 80 },
                                { title: 'Dosen', value: roleStats.teacher ?? 0, icon: UserCheck, gradient: 'warm', delay: 160 },
                                { title: 'Mahasiswa', value: roleStats.student ?? 0, icon: BookOpen, gradient: 'success', delay: 240 },
                            ]}
                        />
                        <div className={UI.miniGridClass}>
                            <div className="lg:col-span-4"><RoleMiniCard title="Finance" value={roleStats.finance ?? 0} icon={Wallet} tone="primary" meta="Transaksi tervalidasi" /></div>
                            <div className="lg:col-span-4"><RoleMiniCard title="Super Admin" value={roleStats.root ?? 0} icon={Crown} tone="accent" meta="Akses tertinggi" /></div>
                            <div className="lg:col-span-4"><RoleMiniCard title="Sesi Aktif (15m)" value={superAdmin?.summary?.active_sessions ?? 0} icon={Activity} tone="success" meta="15 menit terakhir" /></div>
                        </div>
                    </>
                )}

                {user.role === 'admin' && (
                    <>
                        <KpiGrid
                            cards={[
                                { title: 'Total User Akademik', value: adminAcademic?.summary?.total_users ?? 0, change: `+${adminAcademic?.summary?.new_users_month ?? 0} bulan ini`, changeType: 'up', icon: Users, gradient: 'primary', delay: 0 },
                                { title: 'Menunggu Persetujuan', value: adminAcademic?.summary?.pending_approvals ?? 0, icon: Clock, gradient: 'warm', delay: 80 },
                                { title: 'Total Kursus', value: adminAcademic?.summary?.courses_count ?? 0, icon: BookOpen, gradient: 'accent', delay: 160 },
                                { title: 'Kursus Aktif', value: adminAcademic?.summary?.active_courses_count ?? 0, icon: FileText, gradient: 'success', delay: 240 },
                            ]}
                        />
                        <div className={UI.miniGridFourClass}>
                            <RoleMiniCard title="Admin" value={adminRoleStats.admin ?? 0} icon={Shield} tone="accent" meta="Operator aktif" />
                            <RoleMiniCard title="Finance" value={adminRoleStats.finance ?? 0} icon={Wallet} tone="primary" meta="Tim keuangan" />
                            <RoleMiniCard title="Dosen" value={adminRoleStats.teacher ?? 0} icon={UserCheck} tone="primary" meta="Pengajar aktif" />
                            <RoleMiniCard title="Mahasiswa" value={adminRoleStats.student ?? 0} icon={BookOpen} tone="success" meta="Peserta belajar" />
                        </div>
                    </>
                )}

                {user.role === 'finance' && (
                    <KpiGrid
                        cards={[
                            { title: 'Total Tagihan', value: financeData?.summary?.total_invoices ?? 0, icon: FileText, gradient: 'primary', delay: 0 },
                            { title: 'Pembayaran Pending', value: financeData?.summary?.pending_payments ?? 0, icon: Clock, gradient: 'warm', delay: 80 },
                            { title: 'Pembayaran Terverifikasi', value: financeData?.summary?.verified_payments ?? 0, icon: Shield, gradient: 'accent', delay: 160 },
                            { title: 'Pendapatan Bulan Ini', value: new Intl.NumberFormat(intlLocale).format(financeData?.summary?.income_month ?? 0), icon: TrendingUp, gradient: 'success', delay: 240 },
                        ]}
                    />
                )}

                {user.role === 'dosen' && (
                    <KpiGrid cards={dosenKpis} />
                )}

                {user.role === 'mahasiswa' && (
                    <KpiGrid cards={mahasiswaKpis} />
                )}

                {user.role === 'super_admin' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
                        <div className="xl:col-span-8 space-y-4 sm:space-y-6">
                            {superAdminChartData.length > 0
                                ? <ModernTrendChart title="Pertumbuhan Pengguna" data={superAdminChartData} tone="primary" />
                                : <TrendEmptyState title="Pertumbuhan Pengguna" />}
                            <BarColumnChart title="Aktivitas Kursus Mingguan" data={superWeeklyActivityData} />
                        </div>
                        <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                            <HorizontalMetricChart title="Distribusi Role" data={roleDistributionData} />
                            <RecentActivity title="Notifikasi Sistem" intlLocale={intlLocale} activities={superAdmin?.recent_activities ?? []} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                        {user.role === 'admin' && (
                            <>
                                <BarColumnChart title="Tren Enrollment" data={adminEnrollmentData} />
                                <RecentActivity title="Aktivitas Akademik" intlLocale={intlLocale} activities={adminAcademic?.recent_activities ?? []} />
                            </>
                        )}

                        {user.role === 'finance' && (
                            <>
                                {financeSeriesData.length > 0
                                    ? (
                                        <FinanceCompareChart
                                            title="Pemasukan vs Pengeluaran"
                                            data={financeSeriesData}
                                            valueFormatter={(value) => new Intl.NumberFormat(intlLocale).format(value)}
                                        />
                                    ) : <TrendEmptyState title="Pemasukan vs Pengeluaran" />}
                                <RecentActivity title="Transaksi Terbaru" intlLocale={intlLocale} activities={financeData?.recent_activities ?? []} />
                            </>
                        )}

                        {user.role === 'dosen' && (
                            <>
                                <BarColumnChart title="Aktivitas Kelas Mingguan" data={superWeeklyActivityData} />
                                <RecentActivity title="Tugas Masuk" intlLocale={intlLocale} activities={[]} />
                            </>
                        )}

                        {(user.role === 'admin' || user.role === 'dosen') && (
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
                        <div className="space-y-4 sm:space-y-6">
                        {user.role === 'admin' && <DonutCategoryChart title="Kategori Kursus" data={adminCategoryData} />}
                        {user.role === 'finance' && <HorizontalMetricChart title="Metode Pembayaran" data={financeMethodData} />}
                        {user.role === 'dosen' && <RadarPerformanceChart title="Rata-rata Nilai Kelas" data={dosenRadarData} />}
                        {(user.role === 'mahasiswa' || user.role === 'dosen') && <CourseProgress />}
                        <UpcomingSchedule />
                        </div>
                    </div>
                )}
            </div>
        </ProtectedLayout>
    );
}

