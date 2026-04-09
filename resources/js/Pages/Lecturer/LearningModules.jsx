import { Head, router, useForm } from '@inertiajs/react';
import { BookOpen, Layers3, PlayCircle, Plus, TriangleAlert, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { ActionIconButton } from '@/components/ActionIconButton';

const emptyModuleForm = { course_id: '', title: '', description: '', sort_order: 1 };
const emptyLessonForm = { course_module_id: '', title: '', summary: '', content_type: 'video', video_url: '', content: '', duration_minutes: 10, sort_order: 1 };

export default function LearningModules({ courses = [], selectedCourseId = null, selectedCourse = null, modules = [], migrationRequired = false }) {
    const [courseId, setCourseId] = useState(selectedCourseId ? String(selectedCourseId) : '');
    const moduleForm = useForm({ ...emptyModuleForm, course_id: selectedCourseId ? String(selectedCourseId) : '' });
    const lessonForm = useForm(emptyLessonForm);

    const selectedCourseLabel = useMemo(() => courses.find((item) => String(item.id) === String(courseId))?.title ?? 'Pilih course', [courses, courseId]);

    const openCourse = () => {
        router.get('/learning-modules', courseId ? { course: courseId } : {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitModule = (event) => {
        event.preventDefault();
        moduleForm.post('/learning-modules/modules', { preserveScroll: true, onSuccess: () => moduleForm.reset('title', 'description', 'sort_order') });
    };

    const submitLesson = (event) => {
        event.preventDefault();
        lessonForm.post('/learning-modules/lessons', { preserveScroll: true, onSuccess: () => lessonForm.reset() });
    };

    const destroyModule = (id) => {
        if (!window.confirm('Hapus modul ini?')) return;
        router.delete(`/learning-modules/modules/${id}`, { preserveScroll: true });
    };

    const destroyLesson = (id) => {
        if (!window.confirm('Hapus lesson ini?')) return;
        router.delete(`/learning-modules/lessons/${id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kelola Modul" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Kelola Modul"
                    description="Susun modul dan lesson pembelajaran untuk setiap course yang Anda ampu."
                    icon={Layers3}
                />

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel learning modules belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <section className="xl:col-span-2 panel-card p-4 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Course aktif</p>
                                <h2 className="text-xl font-semibold mt-1">{selectedCourse?.title ?? selectedCourseLabel}</h2>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={courseId}
                                    onChange={(event) => {
                                        setCourseId(event.target.value);
                                        moduleForm.setData('course_id', event.target.value);
                                    }}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm min-w-56"
                                >
                                    <option value="">Pilih course</option>
                                    {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                                </select>
                                <button type="button" onClick={openCourse} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
                                    <BookOpen className="w-4 h-4" />
                                    Buka
                                </button>
                            </div>
                        </div>

                        {modules.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground text-center">
                                Belum ada modul untuk course ini.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {modules.map((module) => (
                                    <div key={module.id} className="panel-subcard p-4 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                                                    <Layers3 className="w-3.5 h-3.5" /> Modul {module.sort_order}
                                                </div>
                                                <h3 className="text-lg font-semibold mt-3">{module.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{module.description || 'Tanpa deskripsi modul.'}</p>
                                            </div>
                                            <ActionIconButton icon={Trash2} label="Hapus Modul" tone="danger" onClick={() => destroyModule(module.id)} className="h-9 w-9" />
                                        </div>

                                        <div className="space-y-3">
                                            {module.lessons.length > 0 ? module.lessons.map((lesson) => (
                                                <div key={lesson.id} className="rounded-xl border border-border bg-background p-4 flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <PlayCircle className="w-4 h-4 text-primary" /> {lesson.title}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">{lesson.summary || 'Tanpa ringkasan lesson.'}</p>
                                                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                                            <span className="rounded-full bg-secondary px-2.5 py-1">{lesson.content_type}</span>
                                                            <span className="rounded-full bg-secondary px-2.5 py-1">{lesson.duration_minutes} menit</span>
                                                        </div>
                                                    </div>
                                                    <ActionIconButton icon={Trash2} label="Hapus Lesson" tone="danger" onClick={() => destroyLesson(lesson.id)} className="h-9 w-9" />
                                                </div>
                                            )) : <div className="text-sm text-muted-foreground">Belum ada lesson pada modul ini.</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="space-y-4">
                        <form onSubmit={submitModule} className="panel-card p-4 space-y-3">
                            <h3 className="font-semibold text-base flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Tambah Modul</h3>
                            <select value={moduleForm.data.course_id} onChange={(event) => moduleForm.setData('course_id', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                <option value="">Pilih course</option>
                                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                            </select>
                            <input value={moduleForm.data.title} onChange={(event) => moduleForm.setData('title', event.target.value)} placeholder="Judul modul" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <textarea value={moduleForm.data.description} onChange={(event) => moduleForm.setData('description', event.target.value)} rows={3} placeholder="Deskripsi modul" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <input type="number" min="1" value={moduleForm.data.sort_order} onChange={(event) => moduleForm.setData('sort_order', event.target.value)} placeholder="Urutan" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <button type="submit" disabled={moduleForm.processing} className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                                <Plus className="w-4 h-4" />
                                Simpan Modul
                            </button>
                        </form>

                        <form onSubmit={submitLesson} className="panel-card p-4 space-y-3">
                            <h3 className="font-semibold text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Tambah Lesson</h3>
                            <select value={lessonForm.data.course_module_id} onChange={(event) => lessonForm.setData('course_module_id', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                <option value="">Pilih modul</option>
                                {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                            </select>
                            <input value={lessonForm.data.title} onChange={(event) => lessonForm.setData('title', event.target.value)} placeholder="Judul lesson" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <textarea value={lessonForm.data.summary} onChange={(event) => lessonForm.setData('summary', event.target.value)} rows={2} placeholder="Ringkasan lesson" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <select value={lessonForm.data.content_type} onChange={(event) => lessonForm.setData('content_type', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                <option value="video">Video</option>
                                <option value="document">Dokumen</option>
                                <option value="text">Teks</option>
                            </select>
                            <input value={lessonForm.data.video_url} onChange={(event) => lessonForm.setData('video_url', event.target.value)} placeholder="URL video (YouTube/Vimeo/embed)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <textarea value={lessonForm.data.content} onChange={(event) => lessonForm.setData('content', event.target.value)} rows={4} placeholder="Catatan / isi lesson" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" min="0" value={lessonForm.data.duration_minutes} onChange={(event) => lessonForm.setData('duration_minutes', event.target.value)} placeholder="Durasi" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                <input type="number" min="1" value={lessonForm.data.sort_order} onChange={(event) => lessonForm.setData('sort_order', event.target.value)} placeholder="Urutan" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            </div>
                            <button type="submit" disabled={lessonForm.processing} className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                                <Plus className="w-4 h-4" />
                                Tambah Lesson
                            </button>
                        </form>
                    </aside>
                </div>
            </div>
        </ProtectedLayout>
    );
}


