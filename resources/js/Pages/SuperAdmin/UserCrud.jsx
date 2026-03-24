import { Head, router, useForm } from '@inertiajs/react';
import { Search, Pencil, Trash2, Plus, X, Users, UserCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { StatCard } from '@/components/StatCard';

const emptyForm = {
    name: '',
    email: '',
    username: '',
    code: '',
    password: '',
};

const targetMeta = {
    admins: { label: 'Admin', badgeClass: 'bg-info/20 text-info' },
    lecturers: { label: 'Dosen', badgeClass: 'bg-primary/20 text-primary' },
    students: { label: 'Mahasiswa', badgeClass: 'bg-success/20 text-success' },
};

function initials(name = '') {
    const value = String(name).trim();
    if (!value) return '?';
    return value
        .split(' ')
        .map((part) => part?.[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function relativeTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

export default function UserCrud({ title, description, target, endpoint, users, filters, mocked }) {
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [showForm, setShowForm] = useState(false);

    const form = useForm(emptyForm);
    const meta = useMemo(() => targetMeta[target] ?? targetMeta.admins, [target]);
    const isEditing = editingId !== null;

    const selectedUser = useMemo(() => users.find((item) => item.id === editingId) ?? null, [editingId, users]);

    const stats = useMemo(() => {
        const total = users.length;
        const active = users.length;
        const inactive = Math.max(total - active, 0);
        const withEmail = users.filter((item) => String(item.email ?? '').trim() !== '').length;
        const withUsername = users.filter((item) => String(item.username ?? '').trim() !== '').length;

        if (target === 'admins') {
            return [
                { title: 'Total Admin', value: total, icon: ShieldCheck, gradient: 'primary', delay: 0 },
                { title: 'Aktif', value: active, icon: UserCheck, gradient: 'success', delay: 80 },
                { title: 'Tidak Aktif', value: inactive, icon: Users, gradient: 'warm', delay: 160 },
            ];
        }

        if (target === 'lecturers') {
            return [
                { title: 'Total Dosen', value: total, icon: GraduationCap, gradient: 'primary', delay: 0 },
                { title: 'Aktif', value: active, icon: UserCheck, gradient: 'success', delay: 80 },
                { title: 'Email Terdaftar', value: withEmail, icon: Users, gradient: 'warm', delay: 160 },
                { title: 'Username Aktif', value: withUsername, icon: Users, gradient: 'accent', delay: 240 },
            ];
        }

        return [
            { title: 'Total Mahasiswa', value: total, icon: Users, gradient: 'primary', delay: 0 },
            { title: 'Aktif', value: active, icon: UserCheck, gradient: 'success', delay: 80 },
            { title: 'Email Terdaftar', value: withEmail, icon: Users, gradient: 'warm', delay: 160 },
            { title: 'Username Aktif', value: withUsername, icon: Users, gradient: 'accent', delay: 240 },
        ];
    }, [users, target]);

    const beginCreate = () => {
        setEditingId(null);
        setShowForm(true);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const beginEdit = (user) => {
        setEditingId(user.id);
        setShowForm(true);
        form.setData({
            name: user.name ?? '',
            email: user.email ?? '',
            username: user.username ?? '',
            code: user.code ?? '',
            password: '',
        });
        form.clearErrors();
    };

    const hideForm = () => {
        setShowForm(false);
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();

        const submitOptions = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                hideForm();
            },
        };

        if (isEditing) {
            form.put(`${endpoint}/${editingId}`, submitOptions);
            return;
        }

        form.post(endpoint, submitOptions);
    };

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(endpoint, { search }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const destroyUser = (user) => {
        const ok = window.confirm(`Hapus ${meta.label} "${user.name}"?`);
        if (!ok) return;
        router.delete(`${endpoint}/${user.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title={title} />

            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title={title} description={description} />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Plus className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                <div className={`grid grid-cols-1 ${stats.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-4`}>
                    {stats.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                </div>

                <div className="panel-card p-4 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-lg">Daftar {meta.label}</h3>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <form onSubmit={submitSearch} className="relative flex-1 sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={`Cari ${meta.label.toLowerCase()}...`}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={beginCreate}
                                disabled={mocked}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah
                            </button>
                        </div>
                    </div>

                    {showForm && (
                        <div className="panel-subcard p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-semibold">{isEditing ? `Edit ${meta.label}` : `Tambah ${meta.label}`}</p>
                                <button type="button" onClick={hideForm} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Tutup form">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {isEditing && selectedUser && (
                                <p className="text-xs text-muted-foreground mb-3">
                                    Mengubah data untuk <span className="font-medium text-foreground">{selectedUser.name}</span>
                                </p>
                            )}
                            <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                                <Field label="Nama" value={form.data.name} error={form.errors.name} onChange={(value) => form.setData('name', value)} />
                                <Field label="Email" value={form.data.email} error={form.errors.email} onChange={(value) => form.setData('email', value)} />
                                <Field label="Username" value={form.data.username} error={form.errors.username} onChange={(value) => form.setData('username', value)} />
                                <Field label="Kode" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                                <Field
                                    label={isEditing ? 'Password Baru (Opsional)' : 'Password'}
                                    type="password"
                                    value={form.data.password}
                                    error={form.errors.password}
                                    onChange={(value) => form.setData('password', value)}
                                />
                                <div className="md:col-span-2 xl:col-span-5 flex justify-end gap-2">
                                    <button type="button" onClick={hideForm} className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary/60 transition-colors">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={form.processing || mocked} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                        {form.processing ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : `Tambah ${meta.label}`)}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[820px]">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b border-border">
                                    <th className="py-3 px-2 font-medium">Nama</th>
                                    <th className="py-3 px-2 font-medium">Kontak</th>
                                    <th className="py-3 px-2 font-medium">Username</th>
                                    <th className="py-3 px-2 font-medium">Kode</th>
                                    <th className="py-3 px-2 font-medium">Status</th>
                                    <th className="py-3 px-2 font-medium">Login Terakhir</th>
                                    <th className="py-3 px-2 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-border/70 hover:bg-secondary/35 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold grid place-items-center">
                                                    {initials(user.name)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-muted-foreground">{user.email || '-'}</td>
                                        <td className="py-3 px-2">{user.username || '-'}</td>
                                        <td className="py-3 px-2">{user.code || '-'}</td>
                                        <td className="py-3 px-2">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-success">Aktif</span>
                                        </td>
                                        <td className="py-3 px-2 text-muted-foreground">{relativeTime(user.created_at)}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => beginEdit(user)}
                                                    disabled={mocked || user.is_mock}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 disabled:opacity-60"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyUser(user)}
                                                    disabled={mocked || user.is_mock}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-60"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-muted-foreground">Tidak ada data ditemukan.</td>
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
