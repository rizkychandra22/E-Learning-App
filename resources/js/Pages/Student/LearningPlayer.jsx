import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

export default function LearningPlayer({ course, activeLesson }) {
    const form = useForm({ progress_percent: activeLesson?.progress_percent ?? 0 });

    if (!course) {
        return null;
    }

    const submitProgress = (value) => {
        if (!activeLesson) return;
        form.transform(() => ({ progress_percent: value })).post(`/learning/lessons/${activeLesson.id}/progress`, { preserveScroll: true });
    };

    const openLesson = (lessonId) => {
        router.get(`/learning/${course.id}`, { lesson: lessonId }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <ProtectedLayout>
            <Head title={`Belajar ${course.title}`} />
            <div className="space-y-6">
                <PageHeroBanner title={course.title} description={course.description || 'Lanjutkan pembelajaran dari progress terakhir Anda.'} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 panel-card p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Lesson aktif</p>
                                <h2 className="text-xl font-semibold mt-1">{activeLesson?.title ?? 'Belum ada lesson'}</h2>
                            </div>
                            <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">{course.progress_percent}% selesai</div>
                        </div>

                        {activeLesson?.content_type === 'video' && activeLesson?.video_embed_url && (
                            <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-black">
                                <iframe className="w-full h-full" src={activeLesson.video_embed_url} title={activeLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            </div>
                        )}

                        <div className="panel-subcard p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium"><PlayCircle className="w-4 h-4 text-primary" /> {activeLesson?.title ?? 'Pilih lesson'}</div>
                            <p className="text-sm text-muted-foreground">{activeLesson?.summary || 'Belum ada ringkasan untuk lesson ini.'}</p>
                            {activeLesson?.content && <div className="text-sm leading-6 whitespace-pre-wrap">{activeLesson.content}</div>}
                            {!activeLesson?.video_embed_url && activeLesson?.content_type === 'video' && (
                                <div className="text-xs text-warning">URL video belum valid untuk ditampilkan di player.</div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => submitProgress(50)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">Tandai Sedang Dipelajari</button>
                            <button type="button" onClick={() => submitProgress(100)} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium">Tandai Selesai</button>
                            <Link href="/my-courses" className="px-4 py-2 rounded-xl border border-border text-sm font-medium">Kembali ke Kursus</Link>
                        </div>
                    </div>

                    <div className="panel-card p-5 space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Progress overview</p>
                            <h3 className="text-lg font-semibold mt-1">{course.completed_lessons} / {course.total_lessons} lesson selesai</h3>
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress_percent}%` }} />
                        </div>

                        <div className="space-y-3">
                            {course.modules.map((module) => (
                                <div key={module.id} className="panel-subcard p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold">{module.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{module.description || 'Tanpa deskripsi modul.'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        {module.lessons.map((lesson) => {
                                            const isActive = lesson.id === activeLesson?.id;

                                            return (
                                                <button key={lesson.id} type="button" onClick={() => openLesson(lesson.id)} className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'}`}>
                                                    <div className="flex items-start justify-between gap-3 text-sm">
                                                        <div>
                                                            <p className="font-medium">{lesson.title}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                <Clock3 className="w-3.5 h-3.5" /> {lesson.duration_minutes} menit
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${lesson.is_completed ? 'bg-success/15 text-success' : 'bg-secondary text-secondary-foreground'}`}>
                                                            {lesson.is_completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                                                            {lesson.progress_percent}%
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}


