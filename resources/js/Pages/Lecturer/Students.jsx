import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X, Search, Users } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardField, CardActions, CardBadge } from '@/components/DataCardList';

const emptyNoteForm = {
    student_id: '',
    title: '',
    note: '',
    status: 'active',
};

const emptyEnrollForm = {
    course_id: '',
    student_id: '',
};

const statusBadge = {
    active: 'bg-success/15 text-success',
    resolved: 'bg-secondary text-secondary-foreground',
};

export default function Students({ notes, students, courses, roster, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);

    const noteForm = useForm(emptyNoteForm);
    const enrollForm = useForm(emptyEnrollForm);
    const isEditing = editingId !== null;
    const selectedNote = useMemo(() => notes.find((item) => item.id === editingId) ?? null, [notes, editingId]);
    const selectedCourse = useMemo(() => courses.find((item) => String(item.id) === courseFilter) ?? null, [courses, courseFilter]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/students', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCourseFilter('');
        router.get('/students', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        noteForm.setData(emptyNoteForm);
        noteForm.clearErrors();
    };

    const beginEdit = (note) => {
        setEditingId(note.id);
        noteForm.setData({
            student_id: note.student_id ? String(note.student_id) : '',
            title: note.title ?? '',
            note: note.note ?? '',
            status: note.status ?? 'active',
        });
        noteForm.clearErrors();
    };

    const submitNoteForm = (event) => {
        event.preventDefault();

        if (isEditing) {
            noteForm.put(`/students/${editingId}`, { preserveScroll: true });
            return;
        }

        noteForm.post('/students', { preserveScroll: true });
    };

    const destroyNote = (note) => {
        if (!window.confirm(`Hapus catatan "${note.title}"?`)) return;
        router.delete(`/students/${note.id}`, { preserveScroll: true });
    };

    const submitEnrollForm = (event) => {
        event.preventDefault();
        enrollForm.post('/students/enrollments', {
            preserveScroll: true,
            onSuccess: () => enrollForm.reset(),
        });
    };

    const removeEnrollment = (student) => {
        const courseId = courseFilter || student.course?.id;
        if (!courseId) return;
        if (!window.confirm(`Keluarkan ${student.name} dari kursus?`)) return;
        router.delete(`/students/enrollments/${courseId}/${student.id}`, { preserveScroll: true });
    };

    const notesDisabled = mocked || migrationRequired?.notes;
    const enrollDisabled = mocked || migrationRequired?.enrollments;

    return (
        <ProtectedLayout>
            <Head title="Mahasiswa" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Mahasiswa" description="Kelola roster mahasiswa per kursus dan simpan catatan tindak lanjut." />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Users className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                {(migrationRequired?.notes || migrationRequired?.enrollments) && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <Users className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel mahasiswa belum tersedia.</p>
                            <p>Jalankan migrasi dulu: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari mahasiswa atau catatan..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <select
                                value={courseFilter}
                                onChange={(event) => setCourseFilter(event.target.value)}
                                className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-56 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">Semua Kursus</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Active</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                            <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 space-y-5">
                        <div className="panel-card overflow-hidden">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">Roster Mahasiswa</h2>
                                    <p className="text-xs text-muted-foreground">Pilih kursus untuk melihat daftar mahasiswa.</p>
                                </div>
                                {courseFilter ? (
                                    <CardBadge className="bg-primary/15 text-primary">Kursus dipilih</CardBadge>
                                ) : (
                                    <CardBadge className="bg-secondary text-secondary-foreground">Semua kursus</CardBadge>
                                )}
                            </div>
                            <div className="p-4">
                                <DataCardList
                                    items={roster}
                                    emptyText={courseFilter ? 'Belum ada mahasiswa pada kursus ini.' : 'Pilih kursus untuk melihat roster.'}
                                    renderCard={(student) => (
                                        <DataCard key={student.id} accentColor="hsl(var(--primary))">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate">{student.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                                    </div>
                                                    <CardBadge className="bg-accent text-accent-foreground">{student.code ?? '-'}</CardBadge>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <CardField label="Enroll" value={formatDate(student.pivot?.enrolled_at)} />
                                                    <CardField label="Kursus" value={student.course?.title ?? selectedCourse?.title ?? '-'} />
                                                </div>
                                            </div>
                                            <CardActions>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEnrollment(student)}
                                                    disabled={enrollDisabled || student.is_mock}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium disabled:opacity-60"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Keluarkan
                                                </button>
                                            </CardActions>
                                        </DataCard>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="panel-card overflow-hidden">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">Catatan Mahasiswa</h2>
                                    <p className="text-xs text-muted-foreground">Simpan catatan atau tindak lanjut untuk mahasiswa.</p>
                                </div>
                                <CardBadge className="bg-secondary text-secondary-foreground">{notes.length} Catatan</CardBadge>
                            </div>
                            <div className="p-4">
                                <DataCardList
                                    items={notes}
                                    emptyText="Belum ada catatan mahasiswa."
                                    renderCard={(note) => (
                                        <DataCard key={note.id} accentColor="hsl(var(--primary))">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate">{note.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{note.student?.name ?? 'Mahasiswa'}</p>
                                                    </div>
                                                    <CardBadge className={statusBadge[note.status] ?? 'bg-secondary text-secondary-foreground'}>
                                                        {note.status}
                                                    </CardBadge>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <CardField label="Email" value={note.student?.email ?? '-'} />
                                                    <CardField label="Kode" value={note.student?.code ?? '-'} />
                                                </div>
                                                <p className="text-sm text-muted-foreground break-words">{note.note}</p>
                                            </div>
                                            <CardActions>
                                                <button
                                                    type="button"
                                                    onClick={() => beginEdit(note)}
                                                    disabled={notesDisabled || note.is_mock}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyNote(note)}
                                                    disabled={notesDisabled || note.is_mock}
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
                    </div>

                    <div className="space-y-4">
                        <div className="panel-card p-4 h-fit">
                            <h2 className="font-semibold mb-4">Tambah Mahasiswa ke Kursus</h2>
                            <form onSubmit={submitEnrollForm} className="space-y-3">
                                <SelectField
                                    label="Pilih Kursus"
                                    value={enrollForm.data.course_id}
                                    onChange={(value) => enrollForm.setData('course_id', value)}
                                    error={enrollForm.errors.course_id}
                                >
                                    <option value="">Pilih Kursus</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </SelectField>
                                <SelectField
                                    label="Mahasiswa"
                                    value={enrollForm.data.student_id}
                                    onChange={(value) => enrollForm.setData('student_id', value)}
                                    error={enrollForm.errors.student_id}
                                >
                                    <option value="">Pilih Mahasiswa</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>{student.name} ({student.code})</option>
                                    ))}
                                </SelectField>
                                <button
                                    type="submit"
                                    disabled={enrollForm.processing || enrollDisabled}
                                    className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Mahasiswa
                                </button>
                            </form>
                        </div>

                        <div className="panel-card p-4 h-fit">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold">{isEditing ? 'Edit Catatan' : 'Tambah Catatan'}</h2>
                                {isEditing && (
                                    <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {isEditing && selectedNote && (
                                <p className="text-xs text-muted-foreground mb-4">
                                    Mengubah catatan <span className="font-medium text-foreground">{selectedNote.title}</span>
                                </p>
                            )}

                            <form onSubmit={submitNoteForm} className="space-y-3">
                                <SelectField label="Mahasiswa" value={noteForm.data.student_id} onChange={(value) => noteForm.setData('student_id', value)} error={noteForm.errors.student_id}>
                                    <option value="">Pilih Mahasiswa</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>{student.name} ({student.code})</option>
                                    ))}
                                </SelectField>
                                <Field label="Judul Catatan" value={noteForm.data.title} error={noteForm.errors.title} onChange={(value) => noteForm.setData('title', value)} />
                                <label className="block">
                                    <span className="text-sm font-medium">Catatan</span>
                                    <textarea
                                        value={noteForm.data.note}
                                        onChange={(event) => noteForm.setData('note', event.target.value)}
                                        rows={4}
                                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    {noteForm.errors.note && <span className="text-xs text-destructive mt-1 block">{noteForm.errors.note}</span>}
                                </label>
                                <SelectField label="Status" value={noteForm.data.status} onChange={(value) => noteForm.setData('status', value)} error={noteForm.errors.status}>
                                    <option value="active">Active</option>
                                    <option value="resolved">Resolved</option>
                                </SelectField>

                                <button
                                    type="submit"
                                    disabled={noteForm.processing || notesDisabled}
                                    className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                                >
                                    <Plus className="w-4 h-4" />
                                    {isEditing ? 'Simpan Perubahan' : 'Tambah Catatan'}
                                </button>
                            </form>
                        </div>
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

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID');
}


