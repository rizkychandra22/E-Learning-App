import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Pencil, Trash2, Plus, X } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardBadge, CardField, CardActions } from '@/components/DataCardList';

const emptyForm = {
    name: '',
    email: '',
    username: '',
    role: 'student',
    code: '',
    password: '',
};

const roleLabels = {
    admin: 'Admin',
    finance: 'Finance',
    teacher: 'Dosen',
    student: 'Mahasiswa',
};

export default function ManageUsers({ users, filters, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? 'all');
    const [editingId, setEditingId] = useState(null);
    const form = useForm(emptyForm);

    const isEditing = editingId !== null;
    const selectedUser = useMemo(() => users.find((item) => item.id === editingId) ?? null, [users, editingId]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/manage-users', { search, role: roleFilter }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setRoleFilter('all');
        router.get('/manage-users', {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const beginEdit = (user) => {
        setEditingId(user.id);
        form.setData({
            name: user.name ?? '',
            email: user.email ?? '',
            username: user.username ?? '',
            role: user.role ?? 'student',
            code: user.code ?? '',
            password: '',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (isEditing) {
                    form.reset('password');
                    return;
                }
                form.reset();
            },
        };

        if (isEditing) {
            form.put(`/manage-users/${editingId}`, options);
            return;
        }

        form.post('/manage-users', options);
    };

    const destroyUser = (user) => {
        if (!window.confirm(`Hapus user "${user.name}"?`)) return;
        router.delete(`/manage-users/${user.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kelola User" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kelola User" description="Kelola data admin, finance, dosen, dan mahasiswa" />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Plus className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 panel-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari user..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(event) => setRoleFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm md:w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="finance">Finance</option>
                                    <option value="teacher">Dosen</option>
                                    <option value="student">Mahasiswa</option>
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="p-4">
                            <DataCardList
                                items={users}
                                emptyText="Tidak ada data user."
                                renderCard={(user) => (
                                    <DataCard key={user.id} accentColor={`hsl(var(--primary))`}>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                                <CardField label="Nama" value={user.name} />
                                                <CardField label="Email" value={user.email} />
                                                <CardField label="Kode" value={user.code} />
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <CardBadge className="bg-primary/15 text-primary">{roleLabels[user.role] ?? user.role}</CardBadge>
                                                <CardBadge className={user.email_verified_at ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning'}>
                                                    {user.email_verified_at ? 'Aktif' : 'Menunggu'}
                                                </CardBadge>
                                            </div>
                                        </div>
                                        <CardActions>
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(user)}
                                                disabled={mocked || user.is_mock}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroyUser(user)}
                                                disabled={mocked || user.is_mock}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium disabled:opacity-60"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Hapus
                                            </button>
                                        </CardActions>
                                    </DataCard>
                                )}
                            />
                        </div>
                    </div>

                    <div className="panel-card p-4 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? 'Edit User' : 'Tambah User'}</h2>
                            {isEditing && (
                                <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditing && selectedUser && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Mengubah data untuk <span className="font-medium text-foreground">{selectedUser.name}</span>
                            </p>
                        )}

                        <form onSubmit={submitForm} className="space-y-3">
                            <Field label="Nama" value={form.data.name} error={form.errors.name} onChange={(value) => form.setData('name', value)} />
                            <Field label="Email" value={form.data.email} error={form.errors.email} onChange={(value) => form.setData('email', value)} />
                            <Field label="Username" value={form.data.username} error={form.errors.username} onChange={(value) => form.setData('username', value)} />
                            <label className="block">
                                <span className="text-sm font-medium">Role</span>
                                <select
                                    value={form.data.role}
                                    onChange={(event) => form.setData('role', event.target.value)}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="finance">Finance</option>
                                    <option value="teacher">Dosen</option>
                                    <option value="student">Mahasiswa</option>
                                </select>
                                {form.errors.role && <span className="text-xs text-destructive mt-1 block">{form.errors.role}</span>}
                            </label>
                            <Field label="Kode" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                            <Field
                                label={isEditing ? 'Password Baru (Opsional)' : 'Password'}
                                type="password"
                                value={form.data.password}
                                error={form.errors.password}
                                onChange={(value) => form.setData('password', value)}
                            />

                            <button type="submit" disabled={form.processing || mocked} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Simpan Perubahan' : 'Tambah User'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}


