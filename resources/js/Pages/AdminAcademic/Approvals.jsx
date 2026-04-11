import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock3, Eye } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { StatCard } from '@/components/StatCard';
import { ActionIconButton } from '@/components/ActionIconButton';

const roleLabels = {
    all: 'Semua Role',
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

export default function Approvals({ pendingUsers, filters, mocked, roleSummary: roleSummaryProp }) {
    const { props } = usePage();
    const intlLocale = toIntlLocale(props?.system?.default_language);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? 'all');
    const [selectedUser, setSelectedUser] = useState(null);

    const roleSummary = useMemo(() => {
        const source = roleSummaryProp ?? {};
        return {
            all: Number(source.all ?? pendingUsers.length ?? 0),
            admin: Number(source.admin ?? 0),
            finance: Number(source.finance ?? 0),
            teacher: Number(source.teacher ?? 0),
            student: Number(source.student ?? 0),
        };
    }, [roleSummaryProp, pendingUsers.length]);

    const roleTabs = [
        { value: 'all', label: `Semua (${roleSummary.all})` },
        { value: 'admin', label: `Admin (${roleSummary.admin})` },
        { value: 'finance', label: `Finance (${roleSummary.finance})` },
        { value: 'teacher', label: `Dosen (${roleSummary.teacher})` },
        { value: 'student', label: `Mahasiswa (${roleSummary.student})` },
    ];

    const submitSearch = (event) => {
        event.preventDefault();
        router.get('/approvals', { search, role: roleFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const approve = (user) => {
        router.put(`/approvals/${user.id}/approve`, {}, { preserveScroll: true });
    };

    const reject = (user) => {
        if (!window.confirm(`Tolak akun ${user.name}? Data akan dihapus.`)) return;
        router.delete(`/approvals/${user.id}/reject`, { preserveScroll: true });
    };

    const approveAllByRole = () => {
        const label = roleLabels[roleFilter] ?? 'Semua role';
        const confirmed = window.confirm(`Setujui semua akun pending untuk ${label}?`);
        if (!confirmed) return;

        router.put(
            '/approvals/approve-all',
            { role: roleFilter },
            { preserveScroll: true }
        );
    };

    const openReview = (user) => {
        setSelectedUser(user);
    };

    const closeReview = () => {
        setSelectedUser(null);
    };

    const approveFromReview = () => {
        if (!selectedUser) return;
        approve(selectedUser);
        closeReview();
    };

    const rejectFromReview = () => {
        if (!selectedUser) return;
        reject(selectedUser);
        closeReview();
    };

    return (
        <ProtectedLayout>
            <Head title="Persetujuan Akun" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Persetujuan Akun" description="Tinjau dan setujui permintaan pendaftaran akun baru" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    <StatCard title="Pending Semua" value={roleSummary.all} icon={Clock3} gradient="warm" />
                    <StatCard title="Pending Admin" value={roleSummary.admin} icon={Clock3} gradient="primary" />
                    <StatCard title="Pending Finance" value={roleSummary.finance} icon={Clock3} gradient="accent" />
                    <StatCard title="Pending Dosen" value={roleSummary.teacher} icon={Clock3} gradient="success" />
                    <StatCard title="Pending Mahasiswa" value={roleSummary.student} icon={Clock3} gradient="warm" />
                </div>

                <section className="panel-card p-4">
                    <div className="mb-4 space-y-3">
                        <h3 className="font-semibold text-2xl">Menunggu Persetujuan <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-primary/15 text-primary">{pendingUsers.length}</span></h3>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_22rem_auto] gap-2 items-stretch">
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:col-span-2 xl:col-span-1">
                                {roleTabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => {
                                            setRoleFilter(tab.value);
                                            router.get('/approvals', { search, role: tab.value }, { preserveState: true, preserveScroll: true, replace: true });
                                        }}
                                        className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-md text-xs font-medium transition-colors ${roleFilter === tab.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={submitSearch} className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari akun pending..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={approveAllByRole}
                                disabled={mocked || pendingUsers.length === 0}
                                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-success text-white text-xs font-semibold whitespace-nowrap disabled:opacity-60"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ACC Semua Role Ini
                            </button>
                        </div>
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
                                    <ActionIconButton icon={Eye} label="Tinjau" tone="neutral" onClick={() => openReview(user)} />
                                    <ActionIconButton icon={CheckCircle2} label="Setuju" tone="success" onClick={() => approve(user)} disabled={mocked || user.is_mock} />
                                    <ActionIconButton icon={XCircle} label="Tolak" tone="danger" onClick={() => reject(user)} disabled={mocked || user.is_mock} />
                                </div>
                            </div>
                        ))}

                        {pendingUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada akun yang menunggu persetujuan.</p>
                        )}
                    </div>
                </section>

                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <button type="button" className="absolute inset-0 bg-black/40" onClick={closeReview} aria-label="Tutup tinjau akun" />
                        <div className="relative w-full max-w-xl panel-card p-5">
                            <h3 className="text-lg font-semibold">Tinjau Akun</h3>
                            <p className="text-sm text-muted-foreground mt-1">Pastikan data akun sebelum melakukan persetujuan.</p>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">Nama</p>
                                    <p className="font-medium mt-1">{selectedUser.name || '-'}</p>
                                </div>
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">Role</p>
                                    <p className="font-medium mt-1">{roleLabels[selectedUser.role] ?? selectedUser.role ?? '-'}</p>
                                </div>
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium mt-1 break-all">{selectedUser.email || '-'}</p>
                                </div>
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">Username</p>
                                    <p className="font-medium mt-1">{selectedUser.username || '-'}</p>
                                </div>
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">NIM/ID</p>
                                    <p className="font-medium mt-1">{selectedUser.code || '-'}</p>
                                </div>
                                <div className="panel-subcard p-3">
                                    <p className="text-xs text-muted-foreground">Diajukan</p>
                                    <p className="font-medium mt-1">
                                        {selectedUser.created_at
                                            ? new Date(selectedUser.created_at).toLocaleString(intlLocale)
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeReview}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium"
                                >
                                    Tutup
                                </button>
                                <ActionIconButton icon={CheckCircle2} label="Setuju" tone="success" onClick={approveFromReview} disabled={mocked || selectedUser.is_mock} className="h-9 w-9" />
                                <ActionIconButton icon={XCircle} label="Tolak" tone="danger" onClick={rejectFromReview} disabled={mocked || selectedUser.is_mock} className="h-9 w-9" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedLayout>
    );
}

