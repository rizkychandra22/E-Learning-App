import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Pencil, Trash2, Plus, X } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

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

export default function ManageUsers({ users, filters }) {
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kelola User</h1>
                    <p className="text-muted-foreground mt-1">Kelola data admin, finance, dosen, dan mahasiswa</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
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

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px]">
                                <thead className="bg-secondary/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Nama</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Email</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Role</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Kode</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t border-border">
                                            <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                                            <td className="px-4 py-3 text-sm">{roleLabels[user.role] ?? user.role}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.code}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.email_verified_at ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning'}`}>
                                                    {user.email_verified_at ? 'Aktif' : 'Menunggu Verifikasi'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => beginEdit(user)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => destroyUser(user)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                                Tidak ada data user.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-card p-4 h-fit">
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

                            <button type="submit" disabled={form.processing} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
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


