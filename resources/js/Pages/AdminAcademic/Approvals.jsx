import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock3, Eye } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { StatCard } from '@/components/StatCard';

const roleLabels = {
    admin: 'Admin',
    finance: 'Finance',
    teacher: 'Dosen',
    student: 'Mahasiswa',
};

const roleBadgeClass = {
    admin: 'bg-primary/15 text-primary',
    finance: 'bg-info/15 text-info',
    teacher: 'bg-success/15 text-success',
    student: 'bg-violet-100 text-violet-700',
};

function initials(name = '') {
    return String(name)
        .split(' ')
        .filter(Boolean)
        .map((item) => item[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';
}

function relativeTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

export default function Approvals({ pendingUsers, filters, mocked }) {
    const { props } = usePage();
    const intlLocale = toIntlLocale(props?.system?.default_language);
    const [search, setSearch] = useState(filters?.search ?? '');

    const submitSearch = (event) => {
        event.preventDefault();
        router.get('/approvals', { search }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const approve = (user) => {
        router.put(`/approvals/${user.id}/approve`, {}, { preserveScroll: true });
    };

    const reject = (user) => {
        if (!window.confirm(`Tolak akun ${user.name}? Data akan dihapus.`)) return;
        router.delete(`/approvals/${user.id}/reject`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Persetujuan Akun" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Persetujuan Akun" description="Tinjau dan setujui permintaan pendaftaran akun baru" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Menunggu Persetujuan" value={pendingUsers.length} icon={Clock3} gradient="warm" />
                    <StatCard title="Disetujui" value={0} icon={CheckCircle2} gradient="success" />
                    <StatCard title="Ditolak" value={0} icon={XCircle} gradient="accent" />
                </div>

                <section className="panel-card p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-2xl">Menunggu Persetujuan <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-primary/15 text-primary">{pendingUsers.length}</span></h3>
                        <form onSubmit={submitSearch} className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari akun pending..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                            />
                        </form>
                    </div>

                    <div className="space-y-2">
                        {pendingUsers.map((user) => (
                            <div key={user.id} className="panel-subcard p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold grid place-items-center flex-shrink-0">
                                        {initials(user.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold truncate">{user.name}</p>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadgeClass[user.role] ?? 'bg-secondary text-secondary-foreground'}`}>{roleLabels[user.role] ?? user.role}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">NIM/ID: {user.code || '-'} · Dikirim {relativeTime(user.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium"><Eye className="w-3.5 h-3.5" />Tinjau</button>
                                    <button type="button" onClick={() => approve(user)} disabled={mocked || user.is_mock} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold disabled:opacity-60"><CheckCircle2 className="w-3.5 h-3.5" />Setuju</button>
                                    <button type="button" onClick={() => reject(user)} disabled={mocked || user.is_mock} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold disabled:opacity-60"><XCircle className="w-3.5 h-3.5" />Tolak</button>
                                </div>
                            </div>
                        ))}

                        {pendingUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada akun yang menunggu persetujuan.</p>
                        )}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}
