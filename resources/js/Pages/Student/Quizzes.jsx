import { useMemo, useState } from 'react';
import { AlertCircle, Award, CalendarDays, CheckCircle2, Clock, PlayCircle, Save, Send, Timer, Trophy } from 'lucide-react';
import { Head, router, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function normalizeAnswersForQuiz(quiz) {
    const fromAttempt = quiz?.attempt?.answers;
    if (fromAttempt && typeof fromAttempt === 'object' && !Array.isArray(fromAttempt)) {
        return fromAttempt;
    }
    return {};
}

function QuizCard({ quiz, draft, expanded, onStart, onClose, onChangeAnswer, onSubmit, onSave, isSubmitting }) {
    const statusTone = {
        active: 'bg-primary/10 text-primary',
        closed: 'bg-secondary text-secondary-foreground',
        graded: 'bg-success/10 text-success',
        reset: 'bg-warning/10 text-warning',
    };

    const attemptStatus = quiz?.attempt?.status ?? 'belum';
    const isExpired = quiz?.due_at ? new Date() > new Date(quiz.due_at) : false;
    const isStarted = quiz?.scheduled_at ? new Date() >= new Date(quiz.scheduled_at) : true;
    
    const canWork = quiz?.status === 'active' && 
                    !['submitted', 'graded'].includes(attemptStatus) && 
                    !isExpired && 
                    isStarted;
    const isSubmitted = ['submitted', 'graded'].includes(attemptStatus);

    const isReadOnly = !canWork || !expanded;

    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted-foreground">{quiz?.course?.title ?? 'Tanpa mata kuliah'}</p>
                    <h3 className="font-semibold">{quiz?.title}</h3>
                </div>
                <span className={cn(UI.chip, statusTone[quiz?.status] ?? 'bg-secondary text-secondary-foreground')}>
                    {quiz?.status?.toUpperCase()}
                </span>
            </div>

            {/* Alert jika kuis di-reset */}
            {attemptStatus === 'reset' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-warning border border-warning/20 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>Pengerjaan kuis ini telah dihapus oleh dosen. Silakan kerjakan ulang.</p>
                </div>
            )}

            {/* Info Badge */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className={UI.chip}>
                    <CalendarDays className="w-3.5 h-3.5" />
                    Dibuat: {quiz?.created_at ? new Date(quiz.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </span>
                <span className={UI.chip}>
                    <Timer className="w-3.5 h-3.5" />
                    Mulai: {quiz?.scheduled_at ? new Date(quiz.scheduled_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanpa jadwal'}
                </span>
                <span className={UI.chip}>
                    <Clock className="w-3.5 h-3.5" />
                    Berakhir: {quiz?.due_at ? new Date(quiz.due_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanpa batas'}
                </span>
                <span className={cn(UI.chip, attemptStatus === 'graded' ? 'text-success' : attemptStatus === 'submitted' ? 'text-primary' : 'text-muted-foreground')}>
                    {attemptStatus}
                </span>
                {quiz?.attempt?.score !== null && quiz?.attempt?.score !== undefined && (
                    <span className={UI.chip}>
                        <Trophy className="w-3.5 h-3.5" />
                        Skor {quiz.attempt.score}
                    </span>
                )}
            </div>

            {!expanded ? (
                <button
                    type="button"
                    onClick={onStart}
                    disabled={(!canWork && !isSubmitted) || isSubmitting}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                        (canWork || isSubmitted)
                            ? "gradient-primary text-primary-foreground shadow-md active:scale-95" 
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    )}
                >
                    <PlayCircle className="w-4 h-4" />
                    {isSubmitted ? 'Lihat Jawaban Anda' :
                     isExpired ? 'Waktu Habis' : !isStarted ? 'Belum Dibuka' : 
                     attemptStatus === 'in_progress' ? 'Lanjutkan' : 
                     attemptStatus === 'reset' ? 'Kerjakan Ulang' : 'Kerjakan Sekarang'}
                </button>
            ) : (
                <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                    {(quiz?.questions ?? []).map((question, index) => {
                        const key = String(question.id ?? index + 1);
                        // Fallback: Jika ID tidak ketemu (karena dosen edit kuis), coba cari berdasarkan urutan di objek jawaban
                        const value = draft?.[key] ?? (
                            isSubmitted ? Object.values(draft)[index] : ''
                        ) ?? '';
                        
                        const correctAnswer = question.correct_answer ?? null;
                        const hasCorrectAnswer = isSubmitted && correctAnswer !== null;
                        const isCorrect = hasCorrectAnswer && value === correctAnswer;

                        return (
                            <div key={key} className="rounded-xl border border-border p-4 space-y-3 bg-secondary/20">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pertanyaan {index + 1}</span>
                                    <div className="flex items-center gap-2">
                                        {hasCorrectAnswer && (
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {isCorrect ? '✓ Benar' : '✗ Salah'}
                                            </span>
                                        )}
                                        {isSubmitted && !hasCorrectAnswer && question.question_type === 'essay' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                                Sudah Dijawab
                                            </span>
                                        )}
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-border text-foreground uppercase">{question.question_type}</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>

                                {question.question_type === 'objective' ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {(question.options ?? []).map((option, optIdx) => {
                                            const isSelected = value === option;
                                            const isCorrectOption = hasCorrectAnswer && correctAnswer === option;
                                            let optionStyle = "hover:bg-background";
                                            if (isSubmitted && hasCorrectAnswer) {
                                                if (isCorrectOption) optionStyle = "bg-green-50 border-green-300 text-green-800";
                                                else if (isSelected && !isCorrect) optionStyle = "bg-red-50 border-red-300 text-red-700";
                                            } else if (isSelected) {
                                                optionStyle = "bg-blue-50 border-blue-200 text-blue-700";
                                            }
                                            return (
                                                <label key={optIdx} className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer transition-colors text-sm",
                                                    optionStyle
                                                )}>
                                                    <input
                                                        type="radio"
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                        name={`q-${quiz.id}-${key}`}
                                                        value={option}
                                                        checked={isSelected}
                                                        onChange={(e) => onChangeAnswer(key, e.target.value)}
                                                        disabled={isReadOnly}
                                                    />
                                                    {option}
                                                    {isSubmitted && hasCorrectAnswer && isCorrectOption && (
                                                        <span className="ml-auto text-green-600 text-xs font-bold">✓ Jawaban Benar</span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <textarea
                                        rows={4}
                                        value={value}
                                        onChange={(e) => onChangeAnswer(key, e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Ketik jawaban kamu di sini..."
                                        disabled={isReadOnly}
                                    />
                                )}
                            </div>
                        );
                    })}

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        {!isSubmitted && (
                            <>
                                <button
                                    onClick={onSubmit}
                                    disabled={isSubmitting}
                                    className="gradient-primary text-primary-foreground shadow-md active:scale-95 hover:bg-primary/10 hover:text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" /> Kirim Jawaban
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={isSubmitting}
                                    className="bg-white border border-border hover:bg-gray-50 text-foreground px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" /> Simpan Draft
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground px-4 py-2 text-xs font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StudentQuizzes() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const intlLocale = toIntlLocale(props?.system?.default_language);
    const today = useMemo(
        () =>
            new Intl.DateTimeFormat(intlLocale, {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(new Date()),
        [intlLocale]
    );

    const quizzes = props?.quizzes ?? [];
    const summary = props?.summary ?? { active_count: 0, submitted_count: 0, graded_count: 0 };
    const migrationRequired = props?.migrationRequired ?? { quizzes: false, attempts: false };
    const [draftAnswers, setDraftAnswers] = useState(() => Object.fromEntries(quizzes.map((quiz) => [quiz.id, normalizeAnswersForQuiz(quiz)])));
    const [expandedQuizId, setExpandedQuizId] = useState(null);
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

    const setAnswer = (quizId, questionKey, value) => {
        setDraftAnswers((prev) => ({
            ...prev,
            [quizId]: {
                ...(prev?.[quizId] ?? {}),
                [questionKey]: value,
            },
        }));
    };

    const startQuiz = (quiz) => {
        // Langsung tampilkan soal di bawah (instan)
        setExpandedQuizId(quiz.id);

        // Jika sudah pernah dimulai atau selesai, tidak perlu kirim request start lagi
        if (['in_progress', 'submitted', 'graded'].includes(quiz.attempt?.status)) {
            return;
        }

        setIsSubmittingQuiz(true);
        router.post(`/quizzes/${quiz.id}/start`, {}, {
            preserveScroll: true,
            onFinish: () => setIsSubmittingQuiz(false),
            onError: (errors) => console.error("Gagal mencatat waktu mulai kuis:", errors)
        });
    };

    const saveProgress = (quiz) => {
        const answers = draftAnswers[quiz.id] ?? {};
        setIsSubmittingQuiz(true);
        router.post(`/quizzes/${quiz.id}/save-progress`, { answers }, { 
            preserveScroll: true,
            onFinish: () => setIsSubmittingQuiz(false),
        });
    };

    const submitQuiz = (quiz) => {
        const answers = { ...(draftAnswers?.[quiz.id] ?? {}) };
        const cleaned = Object.fromEntries(
            Object.entries(answers)
                .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : String(value ?? '').trim()])
                .filter(([, value]) => value !== '')
        );

        const totalQuestions = (quiz?.questions ?? []).length;
        if (Object.keys(cleaned).length < totalQuestions) {
            window.alert('Semua soal harus dijawab sebelum dikirim.');
            return;
        }

        setIsSubmittingQuiz(true);
        router.post(`/quizzes/${quiz.id}/submit`, { answers: cleaned }, {
            preserveScroll: true,
            onSuccess: () => {
                setExpandedQuizId(null);
                setIsSubmittingQuiz(false);
            },
            onError: () => setIsSubmittingQuiz(false),
        });
    };

    return (
        <ProtectedLayout>
            <Head title="Kuis" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Kuis"
                    description="Klik Kerjakan untuk mulai mengisi soal, lalu kirim jawaban setelah semua soal selesai."
                />

                {(migrationRequired.quizzes || migrationRequired.attempts) && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Fitur kuis/attempt belum siap. Jalankan migrasi: <code className="font-mono">php artisan migrate</code>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Award className="w-3.5 h-3.5" />
                            {summary.active_count} kuis tersedia
                        </span>
                        <span className={UI.chip}>
                            <Timer className="w-3.5 h-3.5" />
                            {summary.submitted_count} sudah dikumpulkan
                        </span>
                    </div>
                    <span className={UI.chip}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {summary.graded_count} sudah dinilai
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-1 gap-4">
                    {quizzes.map((quiz) => (
                        <QuizCard
                            key={`${quiz.id}-${quiz.title}`}
                            quiz={quiz}
                            draft={draftAnswers[quiz.id] ?? {}}
                            expanded={expandedQuizId === quiz.id}
                            onStart={() => startQuiz(quiz)}
                            onClose={() => setExpandedQuizId(null)}
                            onChangeAnswer={(questionKey, value) => setAnswer(quiz.id, questionKey, value)}
                            onSubmit={() => submitQuiz(quiz)}
                            onSave={() => saveProgress(quiz)}
                            isSubmitting={isSubmittingQuiz}
                        />
                    ))}
                    {quizzes.length === 0 && (
                        <div className="panel-card p-4 text-sm text-muted-foreground">Belum ada kuis tersedia.</div>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}
