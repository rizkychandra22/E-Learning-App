import { Head } from '@inertiajs/react';
import { Users, UserCheck, Shield, GraduationCap, Building2, Network, Activity, TrendingUp } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { StatCard } from '@/components/StatCard';

export default function Statistics({ summary, monthly_users, role_distribution, fakultas_stats }) {
    const maxMonthly = Math.max(...monthly_users.map((item) => item.total), 1);
    const maxRole = Math.max(...role_distribution.map((item) => item.value), 1);

    return (
        <ProtectedLayout>
            <Head title="Statistik Global" />
            <div className="space-y-6 max-w-7xl">
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-bold tracking-tight">Statistik Global</h1>
                    <p className="text-muted-foreground mt-1">Ringkasan performa platform e-learning secara menyeluruh</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Pengguna" value={summary.total_users} change={`+${summary.new_users_this_month} bulan ini`} changeType="up" icon={Users} gradient="primary" delay={0} />
                    <StatCard title="Total Admin" value={summary.total_admins} icon={Shield} gradient="accent" delay={80} />
                    <StatCard title="Total Dosen" value={summary.total_lecturers} icon={UserCheck} gradient="warm" delay={160} />
                    <StatCard title="Total Mahasiswa" value={summary.total_students} change={`Bulan lalu: ${summary.new_users_last_month}`} icon={GraduationCap} gradient="success" delay={240} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoCard title="Total Fakultas" value={summary.total_fakultas} icon={Building2} />
                    <InfoCard title="Total Jurusan" value={summary.total_jurusan} icon={Network} />
                    <InfoCard title="Sesi Aktif (15m)" value={summary.active_sessions} icon={Activity} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="bg-card border border-border rounded-xl shadow-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h2 className="font-semibold">Pertumbuhan User 6 Bulan</h2>
                        </div>
                        <div className="space-y-3">
                            {monthly_users.map((item) => (
                                <div key={item.month}>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>{item.month}</span>
                                        <span className="font-medium text-foreground">{item.total}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full rounded-full gradient-primary"
                                            style={{ width: `${Math.max((item.total / maxMonthly) * 100, item.total > 0 ? 8 : 0)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-card p-5">
                        <h2 className="font-semibold mb-4">Distribusi Role</h2>
                        <div className="space-y-3">
                            {role_distribution.map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{item.label}</span>
                                        <span className="font-medium">{item.value}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full rounded-full gradient-accent"
                                            style={{ width: `${Math.max((item.value / maxRole) * 100, item.value > 0 ? 8 : 0)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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

function InfoCard({ title, value, icon: Icon }) {
    return (
        <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{title}</p>
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
    );
}
