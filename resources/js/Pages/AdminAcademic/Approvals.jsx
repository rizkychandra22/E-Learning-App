import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardBadge, CardField, CardActions } from '@/components/DataCardList';

const roleLabels = {
    admin: 'Admin',
    finance: 'Finance',
    teacher: 'Dosen',
    student: 'Mahasiswa',
};

export default function Approvals({ pendingUsers, filters, mocked }) {
    const { props } = usePage();
    const intlLocale = toIntlLocale(props?.system?.default_language);
    const [search, setSearch] = useState(filters?.search ?? '');

    const submitSearch = (event) => {
        event.preventDefault();
        router.get('/approvals', { search }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetSearch = () => {
        setSearch('');
        router.get('/approvals', {}, { preserveState: true, preserveScroll: true, replace: true });
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
                <PageHeroBanner title="Persetujuan Akun" description="Verifikasi akun yang menunggu persetujuan admin akademik" />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <CheckCircle2 className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. Aksi dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                <div className="bg-card border border-border rounded-xl shadow-card p-4">
                    <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari akun pending..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Cari</button>
                        <button type="button" onClick={resetSearch} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                    </form>
                </div>

                <DataCardList
                    items={pendingUsers}
                    emptyText="Tidak ada akun yang menunggu persetujuan."
                    renderCard={(user) => (
                        <DataCard key={user.id} accentColor="hsl(var(--warning))">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                    <CardField label="Nama" value={user.name} />
                                    <CardField label="Email" value={user.email} />
                                    <CardField label="Kode" value={user.code} />
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <CardBadge className="bg-primary/15 text-primary">{roleLabels[user.role] ?? user.role}</CardBadge>
                                    <span className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString(intlLocale)}</span>
                                </div>
                            </div>
                            <CardActions>
                                <button
                                    type="button"
                                    onClick={() => approve(user)}
                                    disabled={mocked || user.is_mock}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium disabled:opacity-60"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Setujui
                                </button>
                                <button
                                    type="button"
                                    onClick={() => reject(user)}
                                    disabled={mocked || user.is_mock}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium disabled:opacity-60"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Tolak
                                </button>
                            </CardActions>
                        </DataCard>
                    )}
                />
            </div>
        </ProtectedLayout>
    );
}
