import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const fakultasDefault = { name: '', code: '' };
const jurusanDefault = { fakultas_id: '', name: '', code: '' };

export default function Categories({ fakultas, mocked }) {
    const [editingFakultasId, setEditingFakultasId] = useState(null);
    const [editingJurusanId, setEditingJurusanId] = useState(null);

    const fakultasForm = useForm(fakultasDefault);
    const jurusanForm = useForm(jurusanDefault);

    const saveFakultas = (event) => {
        event.preventDefault();
        if (editingFakultasId) {
            fakultasForm.put(`/categories/fakultas/${editingFakultasId}`, { preserveScroll: true, onSuccess: resetFakultasForm });
            return;
        }
        fakultasForm.post('/categories/fakultas', { preserveScroll: true, onSuccess: resetFakultasForm });
    };

    const saveJurusan = (event) => {
        event.preventDefault();
        if (editingJurusanId) {
            jurusanForm.put(`/categories/jurusan/${editingJurusanId}`, { preserveScroll: true, onSuccess: resetJurusanForm });
            return;
        }
        jurusanForm.post('/categories/jurusan', { preserveScroll: true, onSuccess: resetJurusanForm });
    };

    const editFakultas = (item) => {
        setEditingFakultasId(item.id);
        fakultasForm.setData({ name: item.name, code: item.code });
        fakultasForm.clearErrors();
    };

    const editJurusan = (item) => {
        setEditingJurusanId(item.id);
        jurusanForm.setData({
            fakultas_id: String(item.fakultas_id),
            name: item.name,
            code: item.code,
        });
        jurusanForm.clearErrors();
    };

    const resetFakultasForm = () => {
        setEditingFakultasId(null);
        fakultasForm.reset();
    };

    const resetJurusanForm = () => {
        setEditingJurusanId(null);
        jurusanForm.reset();
    };

    const destroyFakultas = (item) => {
        if (!window.confirm(`Hapus fakultas "${item.name}"?`)) return;
        router.delete(`/categories/fakultas/${item.id}`, { preserveScroll: true });
    };

    const destroyJurusan = (item) => {
        if (!window.confirm(`Hapus jurusan "${item.name}"?`)) return;
        router.delete(`/categories/jurusan/${item.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kategori" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kategori Akademik" description="Kelola struktur Fakultas dan Jurusan untuk sistem e-learning" />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <FolderTree className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="panel-card p-4">
                        <h2 className="font-semibold mb-4">{editingFakultasId ? 'Edit Fakultas' : 'Tambah Fakultas'}</h2>
                        <form onSubmit={saveFakultas} className="space-y-3">
                            <Field label="Nama Fakultas" value={fakultasForm.data.name} error={fakultasForm.errors.name} onChange={(value) => fakultasForm.setData('name', value)} />
                            <Field label="Kode Fakultas" value={fakultasForm.data.code} error={fakultasForm.errors.code} onChange={(value) => fakultasForm.setData('code', value)} />
                            <div className="flex gap-2">
                                <button type="submit" disabled={fakultasForm.processing || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                    <Plus className="w-4 h-4" />
                                    {editingFakultasId ? 'Simpan' : 'Tambah'}
                                </button>
                                {editingFakultasId && (
                                    <button type="button" onClick={resetFakultasForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="panel-card p-4">
                        <h2 className="font-semibold mb-4">{editingJurusanId ? 'Edit Jurusan' : 'Tambah Jurusan'}</h2>
                        <form onSubmit={saveJurusan} className="space-y-3">
                            <label className="block">
                                <span className="text-sm font-medium">Fakultas</span>
                                <select
                                    value={jurusanForm.data.fakultas_id}
                                    onChange={(event) => jurusanForm.setData('fakultas_id', event.target.value)}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Pilih Fakultas</option>
                                    {fakultas.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {jurusanForm.errors.fakultas_id && <span className="text-xs text-destructive mt-1 block">{jurusanForm.errors.fakultas_id}</span>}
                            </label>
                            <Field label="Nama Jurusan" value={jurusanForm.data.name} error={jurusanForm.errors.name} onChange={(value) => jurusanForm.setData('name', value)} />
                            <Field label="Kode Jurusan" value={jurusanForm.data.code} error={jurusanForm.errors.code} onChange={(value) => jurusanForm.setData('code', value)} />
                            <div className="flex gap-2">
                                <button type="submit" disabled={jurusanForm.processing || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                    <Plus className="w-4 h-4" />
                                    {editingJurusanId ? 'Simpan' : 'Tambah'}
                                </button>
                                {editingJurusanId && (
                                    <button type="button" onClick={resetJurusanForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold">Struktur Fakultas & Jurusan</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        {fakultas.map((item) => (
                            <div key={item.id} className="border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">Kode: {item.code}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => editFakultas(item)}
                                            disabled={mocked || item.is_mock}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => destroyFakultas(item)}
                                            disabled={mocked || item.is_mock}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium disabled:opacity-60"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Hapus
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {item.jurusans?.map((major) => (
                                        <div key={major.id} className="flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2">
                                            <div>
                                                <p className="text-sm">{major.name}</p>
                                                <p className="text-xs text-muted-foreground">Kode: {major.code}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => editJurusan(major)}
                                                    disabled={mocked || major.is_mock}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs disabled:opacity-60"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyJurusan(major)}
                                                    disabled={mocked || major.is_mock}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs disabled:opacity-60"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!item.jurusans || item.jurusans.length === 0) && <p className="text-xs text-muted-foreground">Belum ada jurusan.</p>}
                                </div>
                            </div>
                        ))}
                        {fakultas.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data fakultas.</p>}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}



