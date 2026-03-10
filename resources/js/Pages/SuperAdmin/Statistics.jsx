import { Head, usePage } from '@inertiajs/react';
import { Users, UserCheck, Shield, GraduationCap, Building2, Network, Activity } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CompactStatCard, MiniRoleCard, EqualCard } from '@/components/CompactStatCard';
import { FakultasBarChart } from '@/components/FakultasBarChart';



export default function Statistics({ summary, monthly_users, role_distribution, fakultas_stats }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const monthlyData = monthly_users.map((item) => ({ label: item.month, value: Number(item.total) || 0 }));
    const roleData = role_distribution.map((item) => ({ label: item.label, value: Number(item.value) || 0 }));

    return (
        <ProtectedLayout>
            <Head title="Statistik Global" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Statistik Global" description="Ringkasan performa platform e-learning secara menyeluruh" />

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

                <FakultasBarChart data={fakultas_stats} />
            </div>
        </ProtectedLayout>
    );
}
