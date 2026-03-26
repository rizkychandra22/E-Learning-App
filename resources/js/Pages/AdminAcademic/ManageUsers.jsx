import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Pencil, Trash2, Plus, Mail, MoreVertical, UserCheck, UserX } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { StatCard } from '@/components/StatCard';
import { CreateFormModal } from '@/components/CreateFormModal';

const emptyForm = {
    name: '',
    email: '',
    username: '',
    role: 'student',
    code: '',
    password: '',
};

const roleLabels = {
    admin: 'Admin Universitas',
    finance: 'Admin Finance',
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

export default function ManageUsers({ users, filters, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? 'all');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const form = useForm(emptyForm);

    const isEditing = editingId !== null;
    const selectedUser = useMemo(() => users.find((item) => item.id === editingId) ?? null, [users, editingId]);

    const stats = useMemo(() => {
        const total = users.length;
        const students = users.filter((item) => item.role === 'student').length;
        const teachers = users.filter((item) => item.role === 'teacher').length;
        const active = users.filter((item) => !!item.email_verified_at).length;
        return { total, students, teachers, active };
    }, [users]);

    const roleTabs = [
        { value: 'all', label: `Semua (${users.length})` },
        { value: 'student', label: `Mahasiswa (${users.filter((item) => item.role === 'student').length})` },
        { value: 'teacher', label: `Dosen (${users.filter((item) => item.role === 'teacher').length})` },
        { value: 'finance', label: `Finance (${users.filter((item) => item.role === 'finance').length})` },
    ];

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/manage-users', { search, role: roleFilter }, { preserveScroll: true, preserveState: true, replace: true });
    };

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
            role: user.role ?? 'student',
            code: user.code ?? '',
            password: '',
        });
        form.clearErrors();
    };

    const closeForm = () => {
        setEditingId(null);
        setShowForm(false);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeForm();
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
                <PageHeroBanner title="Kelola User" description="Manajemen semua pengguna platform universitas" />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Plus className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total User" value={stats.total} icon={UserCheck} gradient="primary" />
                    <StatCard title="Mahasiswa" value={stats.students} icon={UserCheck} gradient="success" />
                    <StatCard title="Dosen" value={stats.teachers} icon={UserCheck} gradient="warm" />
                    <StatCard title="Aktif" value={stats.active} icon={UserCheck} gradient="accent" />
                </div>

                <section className="panel-card p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-2xl">Daftar Pengguna</h3>
                        <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1 overflow-x-auto">
                                {roleTabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => {
                                            setRoleFilter(tab.value);
                                            router.get('/manage-users', { search, role: tab.value }, { preserveScroll: true, preserveState: true, replace: true });
                                        }}
                                        className={`px-2.5 py-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors ${roleFilter === tab.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={submitFilter} className="relative w-full md:w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari user..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </form>

                            <button
                                type="button"
                                onClick={beginCreate}
                                disabled={mocked}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah
                            </button>
                        </div>
                    </div>

                    <CreateFormModal
                        open={showForm}
                        title={isEditing ? 'Edit User' : 'Tambah User'}
                        onClose={closeForm}
                        onSubmit={submitForm}
                        submitLabel="Simpan"
                        processing={form.processing}
                        disableSubmit={mocked}
                    >
                        {isEditing && selectedUser && (
                            <p className="text-sm text-muted-foreground mb-4">
                                Mengubah data untuk <span className="font-medium text-foreground">{selectedUser.name}</span>
                            </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Nama Lengkap" value={form.data.name} error={form.errors.name} onChange={(value) => form.setData('name', value)} />
                            <Field label="Email" value={form.data.email} error={form.errors.email} onChange={(value) => form.setData('email', value)} />
                            <Field label="Username" value={form.data.username} error={form.errors.username} onChange={(value) => form.setData('username', value)} />
                            <SelectField label="Role" value={form.data.role} error={form.errors.role} onChange={(value) => form.setData('role', value)}>
                                <option value="admin">Admin Universitas</option>
                                <option value="finance">Admin Finance</option>
                                <option value="teacher">Dosen</option>
                                <option value="student">Mahasiswa</option>
                            </SelectField>
                            <Field label="Kode" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                            <div className="md:col-span-2">
                                <Field
                                    label={isEditing ? 'Password Baru (Opsional)' : 'Password Sementara'}
                                    type="password"
                                    value={form.data.password}
                                    error={form.errors.password}
                                    onChange={(value) => form.setData('password', value)}
                                    placeholder="Min. 8 karakter"
                                />
                            </div>
                        </div>
                    </CreateFormModal>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b border-border">
                                    <th className="py-3 px-2 font-medium">Pengguna</th>
                                    <th className="py-3 px-2 font-medium">Role</th>
                                    <th className="py-3 px-2 font-medium">Status</th>
                                    <th className="py-3 px-2 font-medium">Bergabung</th>
                                    <th className="py-3 px-2 font-medium">Login Terakhir</th>
                                    <th className="py-3 px-2 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const active = !!user.email_verified_at;
                                    return (
                                        <tr key={user.id} className="border-b border-border/70 hover:bg-secondary/35 transition-colors">
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold grid place-items-center">
                                                        {initials(user.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeClass[user.role] ?? 'bg-secondary text-secondary-foreground'}`}>
                                                    {roleLabels[user.role] ?? user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${active ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                                                    {active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                                    {active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-muted-foreground">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                                            <td className="py-3 px-2 text-muted-foreground">{relativeTime(user.created_at)}</td>
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => destroyUser(user)}
                                                        disabled={mocked || user.is_mock}
                                                        className="inline-flex items-center gap-1 p-1.5 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-60"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => beginEdit(user)}
                                                        disabled={mocked || user.is_mock}
                                                        className="inline-flex items-center gap-1 p-1.5 rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-60"
                                                        title="Aksi"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-muted-foreground">Tidak ada data pengguna.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
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
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}
