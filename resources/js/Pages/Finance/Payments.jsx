import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Plus, CheckCircle2, XCircle, TriangleAlert } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardBadge, CardField, CardActions } from '@/components/DataCardList';

const emptyForm = {
    invoice_id: '',
    student_id: '',
    amount: '',
    method: 'bank_transfer',
    paid_at: '',
    status: 'pending',
    notes: '',
};

const statusBadge = {
    pending: 'bg-warning/20 text-warning',
    verified: 'bg-success/15 text-success',
    rejected: 'bg-destructive/15 text-destructive',
};

export default function Payments({ migrationRequired, payments, invoices, students, filters }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const form = useForm(emptyForm);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-payments', { search, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        router.get('/finance-payments', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitForm = (event) => {
        event.preventDefault();
        form.post('/finance-payments', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const verifyPayment = (payment) => {
        router.put(`/finance-payments/${payment.id}/verify`, {}, { preserveScroll: true });
    };

    const rejectPayment = (payment) => {
        router.put(`/finance-payments/${payment.id}/reject`, {}, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Pembayaran" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Pembayaran" description="Catat dan verifikasi pembayaran mahasiswa" />

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel finance belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari pembayaran..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="p-4">
                            <DataCardList
                                items={payments}
                                emptyText="Belum ada data pembayaran."
                                renderCard={(payment) => {
                                    const accentColors = { pending: 'hsl(var(--warning))', verified: 'hsl(var(--success))', rejected: 'hsl(var(--destructive))' };
                                    return (
                                        <DataCard key={payment.id} accentColor={accentColors[payment.status] ?? 'hsl(var(--primary))'}>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold">{payment.payment_no}</p>
                                                        <p className="text-xs text-muted-foreground">{payment.paid_at ? new Date(payment.paid_at).toLocaleString(intlLocale) : '-'}</p>
                                                    </div>
                                                    <CardBadge className={statusBadge[payment.status] ?? 'bg-secondary text-secondary-foreground'}>{payment.status}</CardBadge>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    <CardField label="Invoice" value={payment.invoice?.invoice_no ?? '-'} />
                                                    <CardField label="Mahasiswa" value={payment.student?.name ?? '-'} />
                                                    <CardField label="Amount" value={new Intl.NumberFormat(intlLocale).format(payment.amount ?? 0)} />
                                                    <CardField label="Metode" value={payment.method} />
                                                </div>
                                            </div>
                                            <CardActions>
                                                {payment.status !== 'verified' && (
                                                    <button type="button" onClick={() => verifyPayment(payment)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Verify
                                                    </button>
                                                )}
                                                {payment.status !== 'rejected' && (
                                                    <button type="button" onClick={() => rejectPayment(payment)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                )}
                                            </CardActions>
                                        </DataCard>
                                    );
                                }}
                            />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-card p-4 h-fit">
                        <h2 className="font-semibold mb-4">Input Pembayaran</h2>
                        <form onSubmit={submitForm} className="space-y-3">
                            <SelectField label="Invoice" value={form.data.invoice_id} error={form.errors.invoice_id} onChange={(value) => form.setData('invoice_id', value)}>
                                <option value="">Pilih Invoice</option>
                                {invoices.map((invoice) => (
                                    <option key={invoice.id} value={invoice.id}>
                                        {invoice.invoice_no} - {invoice.title}
                                    </option>
                                ))}
                            </SelectField>
                            <SelectField label="Mahasiswa" value={form.data.student_id} error={form.errors.student_id} onChange={(value) => form.setData('student_id', value)}>
                                <option value="">Pilih Mahasiswa</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} ({student.code})
                                    </option>
                                ))}
                            </SelectField>
                            <Field label="Amount" type="number" value={form.data.amount} error={form.errors.amount} onChange={(value) => form.setData('amount', value)} />
                            <SelectField label="Metode" value={form.data.method} error={form.errors.method} onChange={(value) => form.setData('method', value)}>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="virtual_account">Virtual Account</option>
                                <option value="cash">Cash</option>
                                <option value="ewallet">E-Wallet</option>
                            </SelectField>
                            <Field label="Tanggal Bayar" type="datetime-local" value={form.data.paid_at} error={form.errors.paid_at} onChange={(value) => form.setData('paid_at', value)} />
                            <SelectField label="Status" value={form.data.status} error={form.errors.status} onChange={(value) => form.setData('status', value)}>
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                            </SelectField>
                            <label className="block">
                                <span className="text-sm font-medium">Catatan</span>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(event) => form.setData('notes', event.target.value)}
                                    rows={3}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                {form.errors.notes && <span className="text-xs text-destructive mt-1 block">{form.errors.notes}</span>}
                            </label>

                            <button type="submit" disabled={form.processing || migrationRequired} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                <Plus className="w-4 h-4" />
                                Simpan Pembayaran
                            </button>
                        </form>
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


