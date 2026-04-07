import { Head, router, usePage } from '@inertiajs/react';
import { Download, Search, TriangleAlert, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'verified', label: 'Berhasil' },
    { key: 'pending', label: 'Menunggu' },
    { key: 'rejected', label: 'Gagal' },
];

export default function Payments({ migrationRequired, payments = [], filters, mocked, paymentInfo = {} }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');

    const summary = useMemo(() => {
        const total = payments.length;
        const verified = payments.filter((item) => item.status === 'verified').length;
        const pending = payments.filter((item) => item.status === 'pending').length;
        const rejected = payments.filter((item) => item.status === 'rejected').length;
        return { total, verified, pending, rejected };
    }, [payments]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-payments', { search, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const exportCsv = () => {
        const rows = [
            ['Payment No', 'Student', 'Student Code', 'Invoice', 'Amount', 'Method', 'Paid At', 'Status'],
            ...payments.map((payment) => [
                payment.payment_no ?? '-',
                payment.student?.name ?? '-',
                payment.student?.code ?? '-',
                payment.invoice?.title ?? '-',
                Number(payment.amount ?? 0),
                payment.method ?? '-',
                payment.paid_at ?? '-',
                payment.status ?? '-',
            ]),
        ];

        const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'transaksi-pembayaran.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <ProtectedLayout>
            <Head title="Pembayaran" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Pembayaran"
                    description="Riwayat dan verifikasi semua transaksi pembayaran"
                    icon={Wallet}
                    action={(
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    )}
                />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data contoh ditampilkan untuk meninjau template terbaru.</p>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Transaksi" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Berhasil" value={summary.verified} tone="gradient-success" />
                    <StatCard title="Menunggu" value={summary.pending} tone="gradient-warm" />
                    <StatCard title="Gagal" value={summary.rejected} tone="bg-gradient-to-r from-pink-600 to-rose-500" />
                </div>

                <section className="panel-card p-4">
                    <h2 className="font-semibold text-lg">Informasi Pembayaran Aktif</h2>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-sm">
                        <InfoItem label="Bank" value={paymentInfo.bank_name} />
                        <InfoItem label="Nama Rekening" value={paymentInfo.bank_account_name} />
                        <InfoItem label="Nomor Rekening" value={paymentInfo.bank_account_number} />
                        <InfoItem label="Email Finance" value={paymentInfo.finance_contact_email} />
                        <InfoItem label="Kontak Finance" value={paymentInfo.finance_contact_phone} />
                    </div>
                </section>

                <section className="panel-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="font-semibold text-xl">Riwayat Transaksi</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                                {FILTERS.map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setStatusFilter(option.key)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${statusFilter === option.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={submitFilter} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari transaksi..."
                                    className="pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm w-[220px]"
                                />
                            </form>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b border-border">
                                    <th className="py-2 px-2">ID Transaksi</th>
                                    <th className="py-2 px-2">Mahasiswa</th>
                                    <th className="py-2 px-2">Jenis</th>
                                    <th className="py-2 px-2">Jumlah</th>
                                    <th className="py-2 px-2">Metode</th>
                                    <th className="py-2 px-2">Tanggal</th>
                                    <th className="py-2 px-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-border/70">
                                        <td className="py-2.5 px-2 text-xs text-muted-foreground font-semibold">{payment.payment_no}</td>
                                        <td className="py-2.5 px-2">
                                            <p className="font-medium">{payment.student?.name ?? '-'}</p>
                                            <p className="text-xs text-muted-foreground">{payment.student?.code ?? '-'}</p>
                                        </td>
                                        <td className="py-2.5 px-2">{payment.invoice?.title ?? '-'}</td>
                                        <td className="py-2.5 px-2 text-success font-semibold">Rp {new Intl.NumberFormat(intlLocale).format(Number(payment.amount ?? 0))}</td>
                                        <td className="py-2.5 px-2">{methodBadge(payment.method)}</td>
                                        <td className="py-2.5 px-2 text-muted-foreground">{formatDateTime(payment.paid_at)}</td>
                                        <td className="py-2.5 px-2">{statusBadge(payment.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}

function InfoItem({ label, value }) {
    return (
        <div className="rounded-xl border border-border bg-background px-3 py-2.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium break-all">{value ? String(value) : '-'}</p>
        </div>
    );
}

function StatCard({ title, value, tone }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card ${tone}`}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <p className="text-sm text-white/85">{title}</p>
            <p className="mt-1 text-4xl leading-none font-bold">{value}</p>
        </div>
    );
}

function methodBadge(value) {
    const map = {
        bank_transfer: 'bg-info/15 text-info',
        virtual_account: 'bg-primary/15 text-primary',
        ewallet: 'bg-success/15 text-success',
        cash: 'bg-warning/20 text-warning',
        card: 'bg-warning/20 text-warning',
    };
    const labelMap = {
        bank_transfer: 'Transfer Bank',
        virtual_account: 'Virtual Account',
        ewallet: 'E-Wallet',
        cash: 'Tunai',
        card: 'Kartu Kredit',
    };
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${map[value] ?? 'bg-secondary text-secondary-foreground'}`}>{labelMap[value] ?? value ?? '-'}</span>;
}

function statusBadge(status) {
    const classes = {
        verified: 'bg-success/15 text-success',
        pending: 'bg-warning/20 text-warning',
        rejected: 'bg-destructive/15 text-destructive',
    };
    const label = {
        verified: 'Berhasil',
        pending: 'Menunggu',
        rejected: 'Gagal',
    };
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${classes[status] ?? 'bg-secondary text-secondary-foreground'}`}>{label[status] ?? status}</span>;
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
