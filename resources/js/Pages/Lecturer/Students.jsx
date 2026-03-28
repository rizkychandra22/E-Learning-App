import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Mail, Plus, Search, Trash2, Users } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CreateFormModal } from '@/components/CreateFormModal';

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

export default function Students({ notes, students, courses, roster, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);

    const noteForm = useForm(emptyNoteForm);
    const enrollForm = useForm(emptyEnrollForm);

    const summary = useMemo(() => {
        const totalStudents = roster.length;
        const attention = notes.filter((item) => item.status === 'active').length;
        const averageProgress = roster.length ? Math.round(roster.reduce((sum, item) => sum + (Number(item.progress_percent) || 64), 0) / roster.length) : 64;
        const averageScore = roster.length ? Math.round(roster.reduce((sum, item) => sum + (Number(item.avg_score) || 80), 0) / roster.length) : 80;
        return { totalStudents, attention, averageProgress, averageScore };
    }, [roster, notes]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/students', { search, course: courseFilter, status: 'all' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreateNote = () => {
        setEditingNoteId(null);
        noteForm.setData(emptyNoteForm);
        noteForm.clearErrors();
        setShowNoteModal(true);
    };

    const beginEditNote = (note) => {
        setEditingNoteId(note.id);
        noteForm.setData({
            student_id: note.student_id ? String(note.student_id) : '',
            title: note.title ?? '',
            note: note.note ?? '',
            status: note.status ?? 'active',
        });
        noteForm.clearErrors();
        setShowNoteModal(true);
    };

    const submitNoteForm = (event) => {
        event.preventDefault();
        if (editingNoteId) {
            noteForm.put(`/students/${editingNoteId}`, { preserveScroll: true, onSuccess: () => setShowNoteModal(false) });
            return;
        }
        noteForm.post('/students', { preserveScroll: true, onSuccess: () => setShowNoteModal(false) });
    };

    const submitEnrollForm = (event) => {
        event.preventDefault();
        enrollForm.post('/students/enrollments', {
            preserveScroll: true,
            onSuccess: () => {
                enrollForm.reset();
                setShowEnrollModal(false);
            },
        });
    };

    const removeEnrollment = (student) => {
        const courseId = courseFilter || student.course?.id;
        if (!courseId) return;
        if (!window.confirm(`Keluarkan ${student.name} dari kursus?`)) return;
        router.delete(`/students/enrollments/${courseId}/${student.id}`, { preserveScroll: true });
    };

    const removeNote = (note) => {
        if (!window.confirm(`Hapus catatan "${note.title}"?`)) return;
        router.delete(`/students/${note.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Mahasiswa" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Mahasiswa" description="Pantau progres dan performa mahasiswa di kelas Anda" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Mahasiswa" value={summary.totalStudents} tone="gradient-primary" />
                    <StatCard title="Rata-rata Nilai" value={summary.averageScore} tone="gradient-success" />
                    <StatCard title="Rata-rata Progress" value={`${summary.averageProgress}%`} tone="gradient-warm" />
                    <StatCard title="Perlu Perhatian" value={summary.attention} tone="bg-gradient-to-r from-pink-600 to-rose-500" />
                </div>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari mahasiswa..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                </div>
                                <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm"><option value="">Semua kursus</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
                                <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            </form>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setShowEnrollModal(true)} disabled={mocked || migrationRequired?.enrollments} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-60"><Plus className="w-4 h-4" /> Tambah Mahasiswa</button>
                                <button type="button" onClick={beginCreateNote} disabled={mocked || migrationRequired?.notes} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"><Plus className="w-4 h-4" /> Tambah Catatan</button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        {roster.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">Belum ada mahasiswa pada kursus ini.</div>}
                        {roster.map((student) => {
                            const progress = Number(student.progress_percent) || 64;
                            const score = Number(student.avg_score) || 80;
                            const attendance = Number(student.attendance_percent) || 85;
                            const alert = progress < 50;
                            return (
                                <div key={student.id} className={`panel-subcard p-3 ${alert ? 'border border-destructive/30 bg-destructive/5' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">{student.code ?? '-'} · {student.course?.title ?? '-'}</p>
                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden"><div className={`h-full rounded-full ${alert ? 'bg-warning' : 'bg-success'}`} style={{ width: `${progress}%` }} /></div>
                                                <span className="text-xs text-muted-foreground">{progress}% progress</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xl font-semibold text-success">{score}</p>
                                                <p className="text-xs text-muted-foreground">Nilai</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-semibold">{attendance}%</p>
                                                <p className="text-xs text-muted-foreground">Hadir</p>
                                            </div>
                                            <button type="button" onClick={() => removeEnrollment(student)} disabled={mocked || migrationRequired?.enrollments || student.is_mock} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                                            <button type="button" className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border"><Mail className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {notes.length > 0 && (
                    <section className="panel-card p-4">
                        <h3 className="font-semibold mb-3">Catatan Mahasiswa</h3>
                        <div className="space-y-2">
                            {notes.map((note) => (
                                <div key={note.id} className="panel-subcard p-3 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium">{note.title}</p>
                                        <p className="text-xs text-muted-foreground">{note.student?.name ?? '-'}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{note.note}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => beginEditNote(note)} className="text-xs px-2.5 py-1 rounded-lg border border-border">Edit</button>
                                        <button type="button" onClick={() => removeNote(note)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive"><Trash2 className="w-3.5 h-3.5" />Hapus</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <CreateFormModal open={showEnrollModal} title="Tambah Mahasiswa" onClose={() => setShowEnrollModal(false)} onSubmit={submitEnrollForm} submitLabel="Simpan" processing={enrollForm.processing} disableSubmit={mocked || migrationRequired?.enrollments} maxWidthClass="max-w-2xl">
                    <div className="space-y-3">
                        <SelectField label="Kursus" value={enrollForm.data.course_id} onChange={(value) => enrollForm.setData('course_id', value)} error={enrollForm.errors.course_id}><option value="">Pilih Kursus</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</SelectField>
                        <SelectField label="Mahasiswa" value={enrollForm.data.student_id} onChange={(value) => enrollForm.setData('student_id', value)} error={enrollForm.errors.student_id}><option value="">Pilih Mahasiswa</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.code})</option>)}</SelectField>
                    </div>
                </CreateFormModal>

                <CreateFormModal open={showNoteModal} title={editingNoteId ? 'Edit Catatan' : 'Tambah Catatan'} onClose={() => setShowNoteModal(false)} onSubmit={submitNoteForm} submitLabel="Simpan" processing={noteForm.processing} disableSubmit={mocked || migrationRequired?.notes} maxWidthClass="max-w-3xl">
                    <div className="space-y-3">
                        <SelectField label="Mahasiswa" value={noteForm.data.student_id} onChange={(value) => noteForm.setData('student_id', value)} error={noteForm.errors.student_id}><option value="">Pilih Mahasiswa</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.code})</option>)}</SelectField>
                        <Field label="Judul Catatan" value={noteForm.data.title} onChange={(value) => noteForm.setData('title', value)} error={noteForm.errors.title} />
                        <label className="block"><span className="text-sm font-medium">Catatan</span><textarea value={noteForm.data.note} onChange={(event) => noteForm.setData('note', event.target.value)} rows={4} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{noteForm.errors.note && <span className="text-xs text-destructive mt-1 block">{noteForm.errors.note}</span>}</label>
                        <SelectField label="Status" value={noteForm.data.status} onChange={(value) => noteForm.setData('status', value)} error={noteForm.errors.status}><option value="active">Active</option><option value="resolved">Resolved</option></SelectField>
                    </div>
                </CreateFormModal>
            </div>
        </ProtectedLayout>
    );
}

function StatCard({ title, value, tone }) {
    return <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card ${tone}`}><div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" /><p className="text-sm text-white/85">{title}</p><p className="mt-1 text-[42px] leading-none font-bold">{value}</p></div>;
}
function Field({ label, value, onChange, error, type = 'text' }) { return <label className="block"><span className="text-sm font-medium">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{error && <span className="text-xs text-destructive mt-1 block">{error}</span>}</label>; }
function SelectField({ label, value, onChange, error, children }) { return <label className="block"><span className="text-sm font-medium">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">{children}</select>{error && <span className="text-xs text-destructive mt-1 block">{error}</span>}</label>; }
