import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';

const roleLabels = {
    admin: 'Admin',
    finance: 'Finance',
    teacher: 'Dosen',
    student: 'Mahasiswa',
};

export default function Approvals({ pendingUsers, filters }) {
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Persetujuan Akun</h1>
                    <p className="text-muted-foreground mt-1">Verifikasi akun yang menunggu persetujuan admin akademik</p>
                </div>

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

                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead className="bg-secondary/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Nama</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Email</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Role</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Daftar</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-border">
                                        <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3 text-sm">{roleLabels[user.role] ?? user.role}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{user.code}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString(intlLocale)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => approve(user)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Setujui
                                                </button>
                                                <button type="button" onClick={() => reject(user)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Tolak
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pendingUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                            Tidak ada akun yang menunggu persetujuan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}


