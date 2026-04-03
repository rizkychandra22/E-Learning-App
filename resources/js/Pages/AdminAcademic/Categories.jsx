import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Laptop, Palette, Briefcase, FlaskConical, Sigma, Languages, BookOpen, X } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { StatCard } from '@/components/StatCard';
import { CreateFormModal } from '@/components/CreateFormModal';

const fakultasDefault = { name: '', code: '' };
const jurusanDefault = { fakultas_id: '', name: '', code: '' };
const modalModeDefault = 'create';

const iconPalette = [Laptop, Palette, Briefcase, FlaskConical, Sigma, Languages];

export default function Categories({ fakultas, mocked }) {
    const [editingFakultasId, setEditingFakultasId] = useState(null);
    const [editingJurusanId, setEditingJurusanId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modalMode, setModalMode] = useState(modalModeDefault);

    const fakultasForm = useForm(fakultasDefault);
    const jurusanForm = useForm(jurusanDefault);

    const totalJurusan = useMemo(() => fakultas.reduce((sum, item) => sum + (item.jurusans?.length ?? 0), 0), [fakultas]);
    const averagePerFakultas = fakultas.length ? Math.round(totalJurusan / fakultas.length) : 0;

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

    const openCreateForm = () => {
        setModalMode(modalModeDefault);
        resetFakultasForm();
        resetJurusanForm();
        setShowForm(true);
    };

    const editFakultas = (item) => {
        setModalMode('edit-fakultas');
        resetJurusanForm();
        setEditingFakultasId(item.id);
        fakultasForm.setData({ name: item.name, code: item.code });
        fakultasForm.clearErrors();
        setShowForm(true);
    };

    const editJurusan = (item) => {
        setModalMode('edit-jurusan');
        resetFakultasForm();
        setEditingJurusanId(item.id);
        jurusanForm.setData({ fakultas_id: String(item.fakultas_id), name: item.name, code: item.code });
        jurusanForm.clearErrors();
        setShowForm(true);
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

    const closeForm = () => {
        setShowForm(false);
        setModalMode(modalModeDefault);
        resetFakultasForm();
        resetJurusanForm();
    };

    return (
        <ProtectedLayout>
            <Head title="Kategori" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kategori Kursus" description="Kelola kategori dan pengelompokan kursus" />

                <div className="flex justify-end -mt-2">
                    <button type="button" onClick={() => (showForm ? closeForm() : openCreateForm())} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold">
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'Tutup Form' : 'Tambah Kategori'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Kategori" value={fakultas.length} icon={FolderTree} gradient="primary" />
                    <StatCard title="Total Jurusan" value={totalJurusan} icon={BookOpen} gradient="success" />
                    <StatCard title="Rata-rata Kursus" value={averagePerFakultas} icon={BookOpen} gradient="warm" />
                    <StatCard title="Kategori Aktif" value={fakultas.length} icon={FolderTree} gradient="accent" />
                </div>

                <CreateFormModal
                    open={showForm}
                    title={modalMode === 'edit-fakultas' ? 'Edit Kategori' : modalMode === 'edit-jurusan' ? 'Edit Subkategori' : 'Tambah Kategori'}
                    onClose={closeForm}
                    hideFooter
                    maxWidthClass="max-w-4xl"
                >
                    <div className={`grid grid-cols-1 ${modalMode === 'create' ? 'xl:grid-cols-2' : ''} gap-4`}>
                        {(modalMode === 'create' || modalMode === 'edit-fakultas') && (
                        <div className="panel-subcard p-4">
                            <h3 className="font-semibold mb-3">{editingFakultasId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                            <form onSubmit={saveFakultas} className="space-y-3">
                                <Field label="Nama Kategori" value={fakultasForm.data.name} error={fakultasForm.errors.name} onChange={(value) => fakultasForm.setData('name', value)} />
                                <Field label="Kode" value={fakultasForm.data.code} error={fakultasForm.errors.code} onChange={(value) => fakultasForm.setData('code', value)} />
                                <div className="flex gap-2">
                                    <button type="submit" disabled={fakultasForm.processing || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                        <Plus className="w-4 h-4" />
                                        {editingFakultasId ? 'Simpan' : 'Tambah'}
                                    </button>
                                    {editingFakultasId && <button type="button" onClick={resetFakultasForm} className="px-4 py-2 rounded-xl border border-border bg-background text-sm">Batal</button>}
                                </div>
                            </form>
                        </div>
                        )}

                        {(modalMode === 'create' || modalMode === 'edit-jurusan') && (
                        <div className="panel-subcard p-4">
                            <h3 className="font-semibold mb-3">{editingJurusanId ? 'Edit Subkategori' : 'Tambah Subkategori'}</h3>
                            <form onSubmit={saveJurusan} className="space-y-3">
                                <SelectField label="Kategori" value={jurusanForm.data.fakultas_id} error={jurusanForm.errors.fakultas_id} onChange={(value) => jurusanForm.setData('fakultas_id', value)}>
                                    <option value="">Pilih Kategori</option>
                                    {fakultas.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </SelectField>
                                <Field label="Nama Subkategori" value={jurusanForm.data.name} error={jurusanForm.errors.name} onChange={(value) => jurusanForm.setData('name', value)} />
                                <Field label="Kode" value={jurusanForm.data.code} error={jurusanForm.errors.code} onChange={(value) => jurusanForm.setData('code', value)} />
                                <div className="flex gap-2">
                                    <button type="submit" disabled={jurusanForm.processing || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                        <Plus className="w-4 h-4" />
                                        {editingJurusanId ? 'Simpan' : 'Tambah'}
                                    </button>
                                    {editingJurusanId && <button type="button" onClick={resetJurusanForm} className="px-4 py-2 rounded-xl border border-border bg-background text-sm">Batal</button>}
                                </div>
                            </form>
                        </div>
                        )}
                    </div>
                </CreateFormModal>

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {fakultas.map((item, index) => {
                        const Icon = iconPalette[index % iconPalette.length];
                        return (
                            <article key={item.id} className="panel-card p-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button type="button" onClick={() => editFakultas(item)} disabled={mocked || item.is_mock} className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-60"><Pencil className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => destroyFakultas(item)} disabled={mocked || item.is_mock} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-60"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <h3 className="mt-4 text-2xl font-semibold">{item.name}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{item.jurusans?.map((major) => major.name).join(', ') || 'Belum ada subkategori'}</p>
                                <p className="mt-2 text-sm font-medium inline-flex items-center gap-1"><BookOpen className="w-4 h-4 text-primary" /> {(item.jurusans?.length ?? 0)} subkategori tersedia</p>

                                {!!item.jurusans?.length && (
                                    <div className="mt-3 space-y-1.5">
                                        {item.jurusans.slice(0, 3).map((major) => (
                                            <div key={major.id} className="flex items-center justify-between rounded-lg bg-secondary/55 px-2.5 py-1.5">
                                                <span className="text-sm">{major.name}</span>
                                                <div className="flex gap-1.5">
                                                    <button type="button" onClick={() => editJurusan(major)} disabled={mocked || major.is_mock} className="p-1 rounded-md hover:bg-background disabled:opacity-60"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={() => destroyJurusan(major)} disabled={mocked || major.is_mock} className="p-1 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-60"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        );
                    })}

                    {fakultas.length === 0 && <p className="text-sm text-muted-foreground xl:col-span-3 text-center py-8">Belum ada data kategori.</p>}
                </section>
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}
