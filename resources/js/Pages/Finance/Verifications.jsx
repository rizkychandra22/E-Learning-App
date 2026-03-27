import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, Clock3, Eye, Search, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const cardTone = {
    pending: 'gradient-warm',
    verified: 'gradient-success',
    rejected: 'bg-gradient-to-r from-pink-600 to-rose-500',
};

export default function Verifications({ migrationRequired, mocked, filters, summary, verifications = [] }) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-verifications', { search }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const verifyPayment = (paymentId) => {
        router.put(`/finance-payments/${paymentId}/verify`, {}, { preserveScroll: true });
    };

    const rejectPayment = (paymentId) => {
        router.put(`/finance-payments/${paymentId}/reject`, {}, { preserveScroll: true });
    };

    const openProof = (item) => {
        const invoiceNo = item?.invoice?.invoice_no ?? '-';
        window.alert(`Bukti pembayaran untuk ${invoiceNo} akan ditampilkan di modal/detail transaksi.`);
    };

    return (
        <ProtectedLayout>
            <Head title="Verifikasi Pembayaran" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Verifikasi Pembayaran"
                    description="Tinjau dan verifikasi bukti pembayaran manual dari mahasiswa"
                    icon={ShieldCheck}
                />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan dan alur verifikasi.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel finance belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard title="Menunggu Verifikasi" value={summary?.pending ?? 0} icon={Clock3} tone={cardTone.pending} />
                    <SummaryCard title="Diverifikasi" value={summary?.verified ?? 0} icon={CheckCircle2} tone={cardTone.verified} />
                    <SummaryCard title="Ditolak" value={summary?.rejected ?? 0} icon={XCircle} tone={cardTone.rejected} />
                </div>

                <section className="panel-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h2 className="font-semibold text-xl flex items-center gap-2">
                            <Clock3 className="w-5 h-5 text-warning" />
                            Menunggu Verifikasi
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground">
                                {verifications.length}
                            </span>
                        </h2>

                        <form onSubmit={submitFilter} className="relative w-full sm:w-[280px]">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari verifikasi..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                            />
                        </form>
                    </div>

                    <div className="space-y-3">
                        {verifications.map((item) => {
                            const initials = String(item?.student?.name ?? 'U')
                                .split(' ')
                                .map((word) => word[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase();
                            return (
                                <div key={item.id} className="rounded-xl border border-border p-3 sm:p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center text-white text-sm font-bold">
                                                {initials}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold truncate">{item?.student?.name ?? '-'}</p>
                                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">{item?.payment_no ?? '-'}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    NIM: {item?.student?.code ?? '-'} • {item?.invoice?.title ?? '-'}
                                                </p>
                                                <p className="text-lg font-bold text-success mt-0.5">
                                                    Rp {new Intl.NumberFormat('id-ID').format(Number(item?.amount ?? 0))}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatMethod(item?.method)} • {formatDateTime(item?.paid_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => openProof(item)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-medium"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Bukti
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => verifyPayment(item.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold hover:opacity-90"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Terima
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => rejectPayment(item.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold hover:opacity-90"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Tolak
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {verifications.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
                                Tidak ada pembayaran yang menunggu verifikasi.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}

function SummaryCard({ title, value, icon: Icon, tone }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card ${tone}`}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute left-4 top-4 w-10 h-10 rounded-xl bg-white/15 grid place-items-center">
                <Icon className="w-5 h-5 text-white/90" />
            </div>
            <p className="text-sm text-white/85 pl-12">{title}</p>
            <p className="text-4xl leading-none font-bold mt-1 pl-12">{value}</p>
        </div>
    );
}

function formatMethod(method) {
    const map = {
        bank_transfer: 'Transfer Bank',
        virtual_account: 'Virtual Account',
        cash: 'Tunai',
        ewallet: 'E-Wallet',
    };

    return map[method] ?? method ?? '-';
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
