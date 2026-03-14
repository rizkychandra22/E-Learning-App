import { useMemo } from 'react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    FileText,
    Flag,
    MessageSquare,
    Upload,
} from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'rounded-2xl border border-border bg-card p-4 shadow-card',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function SectionTitle({ icon: Icon, children }) {
    return (
        <h3 className="font-semibold flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <span>{children}</span>
        </h3>
    );
}

export default function AssignmentDetail() {
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

    const assignments = [
        {
            id: 1,
            title: 'Tugas 3: Normalisasi',
            course: 'Basis Data Lanjut',
            due: '2 hari lagi (Jumat, 23:59)',
            status: 'tinggi',
            progress: 30,
            points: 100,
            description: 'Lengkapi studi kasus normalisasi hingga 3NF dan lampirkan ERD terbaru. Gunakan dataset yang sudah dibagikan di pertemuan minggu ke-4.',
            checklist: ['Analisis kebutuhan data', 'Buat ERD dan relasi', 'Normalisasi hingga 3NF', 'Lampirkan contoh query'],
            attachments: ['Dataset_penjualan.csv', 'Template_laporan.docx'],
            rubric: [
                { label: 'Analisis kebutuhan', score: '0-25' },
                { label: 'Normalisasi', score: '0-40' },
                { label: 'Contoh query', score: '0-20' },
                { label: 'Presentasi laporan', score: '0-15' },
            ],
            submission: { status: 'Belum dikumpulkan', lastUpdate: 'Belum ada', note: 'Mulai unggah sebelum deadline agar tidak terlambat.' },
        },
        {
            id: 2,
            title: 'Analisis Kompleksitas',
            course: 'Algoritma & Struktur Data',
            due: '4 hari lagi (Minggu, 23:59)',
            status: 'sedang',
            progress: 55,
            points: 100,
            description: 'Hitung kompleksitas waktu dari 5 potongan kode yang disediakan. Sertakan penjelasan langkah demi langkah.',
            checklist: ['Baca soal dan contoh kode', 'Tuliskan kompleksitas best/worst case', 'Berikan reasoning singkat'],
            attachments: ['Soal_kompleksitas.pdf'],
            rubric: [
                { label: 'Pemahaman konsep', score: '0-40' },
                { label: 'Analisis kode', score: '0-40' },
                { label: 'Kejelasan jawaban', score: '0-20' },
            ],
            submission: { status: 'Draft tersimpan', lastUpdate: '1 jam lalu', note: 'Lanjutkan dan unggah file akhir.' },
        },
        {
            id: 3,
            title: 'Landing Page Responsif',
            course: 'Pemrograman Web',
            due: '6 hari lagi (Selasa, 23:59)',
            status: 'rendah',
            progress: 80,
            points: 100,
            description: 'Bangun landing page responsif dengan komponen hero, fitur, dan CTA. Sertakan link repo Git.',
            checklist: ['Struktur layout utama', 'Responsif mobile', 'Integrasi CTA', 'Deploy ke hosting'],
            attachments: ['Brief_landing_page.pdf'],
            rubric: [
                { label: 'Desain UI', score: '0-35' },
                { label: 'Responsivitas', score: '0-35' },
                { label: 'Kelengkapan fitur', score: '0-30' },
            ],
            submission: { status: 'Sudah diunggah', lastUpdate: 'Kemarin, 20:14', note: 'Menunggu review dosen.' },
        },
        {
            id: 4,
            title: 'Resume Video Pointer',
            course: 'Algoritma & Struktur Data',
            due: '1 minggu lagi (Senin, 23:59)',
            status: 'rendah',
            progress: 15,
            points: 50,
            description: 'Buat ringkasan video pointer dan contoh penggunaannya. Format bebas (PDF/Docs).',
            checklist: ['Tonton video', 'Ringkas poin penting', 'Buat contoh kode', 'Unggah rangkuman'],
            attachments: ['Link_video_pointer.txt'],
            rubric: [
                { label: 'Kelengkapan ringkasan', score: '0-25' },
                { label: 'Contoh kode', score: '0-15' },
                { label: 'Kerapihan dokumen', score: '0-10' },
            ],
            submission: { status: 'Belum dikumpulkan', lastUpdate: 'Belum ada', note: 'Mulai dari ringkasan singkat agar progres naik.' },
        },
    ];

    const selected = assignments.find((item) => String(item.id) === String(props?.assignmentId)) ?? assignments[0];

    const priorityTone = {
        tinggi: 'text-destructive',
        sedang: 'text-warning',
        rendah: 'text-success',
    };

    return (
        <ProtectedLayout>
            <Head title="Detail Tugas" />
            <div className="space-y-6">
                <PageHeroBanner
                    title={selected.title}
                    description={`Kursus: ${selected.course}`}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Clock className="w-3.5 h-3.5" />
                            Deadline: {selected.due}
                        </span>
                        <span className={cn(UI.chip, priorityTone[selected.status])}>
                            <Flag className="w-3.5 h-3.5" />
                            Prioritas {selected.status}
                        </span>
                        <span className={UI.chip}>
                            <ClipboardList className="w-3.5 h-3.5" />
                            {selected.points} poin
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/assignments" className="text-xs font-medium text-muted-foreground hover:text-primary">
                            Kembali ke daftar tugas
                        </Link>
                        <button type="button" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5" />
                            Upload Jawaban
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={UI.panel}>
                            <SectionTitle icon={FileText}>Deskripsi Tugas</SectionTitle>
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                {selected.description}
                            </p>
                            <div className="mt-4">
                                <p className="text-xs text-muted-foreground mb-2">Progress pengerjaan</p>
                                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${selected.progress}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{selected.progress}% selesai</p>
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={CheckCircle2}>Checklist Pengerjaan</SectionTitle>
                            <div className="mt-4 space-y-2">
                                {selected.checklist.map((item) => (
                                    <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={MessageSquare}>Catatan Dosen</SectionTitle>
                            <div className="mt-4 space-y-3">
                                <div className="rounded-xl border border-border bg-background p-3 text-sm">
                                    Pastikan lampiran ERD terbaru diunggah sebelum deadline.
                                </div>
                                <div className="rounded-xl border border-border bg-background p-3 text-sm">
                                    Contoh query minimal 3 skenario berbeda.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={UI.panel}>
                            <SectionTitle icon={AlertCircle}>Status Pengumpulan</SectionTitle>
                            <div className="mt-4 space-y-2 text-sm">
                                <p className="font-semibold">{selected.submission.status}</p>
                                <p className="text-xs text-muted-foreground">Update terakhir: {selected.submission.lastUpdate}</p>
                                <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                                    {selected.submission.note}
                                </div>
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={Download}>Lampiran</SectionTitle>
                            <div className="mt-4 space-y-2">
                                {selected.attachments.map((file) => (
                                    <div key={file} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-sm">
                                        <span className="truncate">{file}</span>
                                        <button type="button" className="text-xs font-medium text-primary hover:opacity-80">
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={ClipboardList}>Rubrik Penilaian</SectionTitle>
                            <div className="mt-4 space-y-2 text-sm">
                                {selected.rubric.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                                        <span>{item.label}</span>
                                        <span className="text-xs text-muted-foreground">{item.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
