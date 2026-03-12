import { Head, router, useForm } from '@inertiajs/react';
import { Search, Pencil, Trash2, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardBadge, CardField, CardActions } from '@/components/DataCardList';

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

export default function UserCrud({ title, description, target, endpoint, users, filters }) {
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? '');

    const form = useForm(emptyForm);
    const meta = useMemo(() => targetMeta[target] ?? targetMeta.admins, [target]);
    const isEditing = editingId !== null;

    const selectedUser = useMemo(() => users.find((item) => item.id === editingId) ?? null, [editingId, users]);

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
            code: user.code ?? '',
            password: '',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();

        const submitOptions = {
            preserveScroll: true,
            onSuccess: () => {
                if (!isEditing) {
                    form.reset();
                } else {
                    form.reset('password');
                }
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

    const resetSearch = () => {
        setSearch('');
        router.get(endpoint, {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const destroyUser = (user) => {
        const ok = window.confirm(`Hapus ${meta.label} "${user.name}"?`);
        if (!ok) {
            return;
        }

        router.delete(`${endpoint}/${user.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title={title} />

            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title={title} description={description} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Total data: <span className="font-semibold text-foreground">{users.length}</span>
                            </p>
                            <form onSubmit={submitSearch} className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder={`Cari ${meta.label.toLowerCase()}...`}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <button type="submit" className="px-3 py-2 text-sm rounded-lg gradient-primary text-primary-foreground">Cari</button>
                                <button type="button" onClick={resetSearch} className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="p-4">
                            <DataCardList
                                items={users}
                                emptyText="Tidak ada data ditemukan."
                                renderCard={(user) => (
                                    <DataCard key={user.id} accentColor={`hsl(var(--primary))`}>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                                <CardField label="Nama" value={user.name} />
                                                <CardField label="Email" value={user.email} />
                                                <CardField label="Username" value={user.username} />
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <CardField label="Kode" value={user.code} />
                                                <CardBadge className={meta.badgeClass}>{meta.label}</CardBadge>
                                            </div>
                                        </div>
                                        <CardActions>
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(user)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroyUser(user)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium hover:bg-destructive/20"
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

                    <div className="bg-card border border-border rounded-xl shadow-card p-5 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? `Edit ${meta.label}` : `Tambah ${meta.label}`}</h2>
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
                            <Field label="Kode" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                            <Field
                                label={isEditing ? 'Password Baru (Opsional)' : 'Password'}
                                type="password"
                                value={form.data.password}
                                error={form.errors.password}
                                onChange={(value) => form.setData('password', value)}
                            />

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Simpan Perubahan' : `Tambah ${meta.label}`}
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
