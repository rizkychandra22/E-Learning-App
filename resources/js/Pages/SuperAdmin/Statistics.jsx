import { Head, usePage } from '@inertiajs/react';
import { Users, UserCheck, Shield, GraduationCap, Building2, Network, Activity } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';
import { toIntlLocale } from '@/lib/locale';
import { cn } from '@/lib/cn';

const UI = {
    kpiCardHeight: 'h-[150px]',
};

export default function Statistics({ summary, monthly_users, role_distribution, fakultas_stats }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const monthlyData = monthly_users.map((item) => ({ label: item.month, value: Number(item.total) || 0 }));
    const roleData = role_distribution.map((item) => ({ label: item.label, value: Number(item.value) || 0 }));

    return (
        <ProtectedLayout>
            <Head title="Statistik Global" />
            <div className="space-y-6 w-full max-w-none">
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-bold tracking-tight">Statistik Global</h1>
                    <p className="text-muted-foreground mt-1">Ringkasan performa platform e-learning secara menyeluruh</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
                    <EqualCard><CompactStatCard title="Total Pengguna" value={summary.total_users} change={`+${summary.new_users_this_month} bulan ini`} changeType="up" icon={Users} gradient="primary" delay={0} /></EqualCard>
                    <EqualCard><CompactStatCard title="Total Admin" value={summary.total_admins} icon={Shield} gradient="accent" delay={80} /></EqualCard>
                    <EqualCard><CompactStatCard title="Total Dosen" value={summary.total_lecturers} icon={UserCheck} gradient="warm" delay={160} /></EqualCard>
                    <EqualCard><CompactStatCard title="Total Mahasiswa" value={summary.total_students} change={`Bulan lalu: ${summary.new_users_last_month}`} icon={GraduationCap} gradient="success" delay={240} /></EqualCard>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    <EqualCard><MiniRoleCard title="Total Fakultas" value={summary.total_fakultas} icon={Building2} iconVariant="primary" /></EqualCard>
                    <EqualCard><MiniRoleCard title="Total Jurusan" value={summary.total_jurusan} icon={Network} iconVariant="accent" /></EqualCard>
                    <EqualCard><MiniRoleCard title="Sesi Aktif (15m)" value={summary.active_sessions} icon={Activity} iconVariant="success" /></EqualCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <InteractiveTrendChart
                        title="Pertumbuhan User 6 Bulan"
                        data={monthlyData}
                        tone="primary"
                        valueFormatter={(value) => new Intl.NumberFormat(intlLocale).format(value)}
                    />
                    <InteractiveTrendChart
                        title="Distribusi Role"
                        data={roleData}
                        tone="accent"
                        showTrend={false}
                        valueFormatter={(value) => new Intl.NumberFormat(intlLocale).format(value)}
                    />
                </div>

                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold">Statistik Fakultas</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-secondary/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Nama Fakultas</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Jumlah Jurusan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fakultas_stats.map((item) => (
                                    <tr key={item.code} className="border-t border-border">
                                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.code}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.jurusan_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
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

function CompactStatCard({ title, value, change, changeType = 'up', icon: Icon, gradient = 'primary', delay = 0 }) {
    const changeTone = changeType === 'down' ? 'text-destructive' : 'text-success';

    return (
        <div className="h-full rounded-xl border border-border bg-card p-3.5 shadow-card hover:-translate-y-0.5 transition-transform animate-fade-in flex flex-col justify-between" style={{ animationDelay: `${delay}ms` }}>
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
        <div className="h-full bg-card border border-border rounded-xl p-3.5 shadow-card hover:-translate-y-0.5 transition-transform flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                {Icon && <DashboardIcon icon={Icon} variant={iconVariant} />}
            </div>
            <p className="text-[2rem] leading-none font-bold">{value}</p>
        </div>
    );
}

function EqualCard({ children }) {
    return <div className={cn('h-full [&>*]:h-full', UI.kpiCardHeight)}>{children}</div>;
}
