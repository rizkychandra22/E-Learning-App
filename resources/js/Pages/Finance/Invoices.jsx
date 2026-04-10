import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Eye, FileText, Plus, Search, Send, Trash2, TriangleAlert } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { CreateFormModal } from '@/components/CreateFormModal';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { ActionIconButton } from '@/components/ActionIconButton';

const emptyForm = {
    student_id: '',
    fee_component_id: '',
    title: '',
    description: '',
    amount: '',
    due_date: '',
    status: 'unpaid',
};

const STATUS_OPTIONS = [
    { key: 'all', label: 'Semua' },
    { key: 'paid', label: 'Lunas' },
    { key: 'unpaid', label: 'Belum' },
    { key: 'partial', label: 'Sebagian' },
    { key: 'overdue', label: 'Terlambat' },
];

export default function Invoices({ migrationRequired, invoices = [], students = [], feeComponents = [], filters, mocked }) {
    const intlLocale = toIntlLocale(usePage().props?.system?.default_language);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [detailInvoice, setDetailInvoice] = useState(null);
    const form = useForm(emptyForm);

    const summary = useMemo(() => {
        const total = invoices.length;
        const paid = invoices.filter((item) => item.status === 'paid').length;
        const unpaid = invoices.filter((item) => item.status === 'unpaid' || item.status === 'overdue').length;
        const partial = invoices.filter((item) => item.status === 'partial').length;
        return { total, paid, unpaid, partial };
    }, [invoices]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-invoices', { search, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitForm = (event) => {
        event.preventDefault();
        if (editingId) {
            form.put(`/finance-invoices/${editingId}`, { preserveScroll: true, onSuccess: () => closeForm() });
            return;
        }
        form.post('/finance-invoices', { preserveScroll: true, onSuccess: () => closeForm() });
    };

    const openCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
        setShowForm(true);
    };

    const openEdit = (invoice) => {
        setEditingId(invoice.id);
        form.setData({
            student_id: String(invoice.student_id ?? ''),
            fee_component_id: String(invoice.fee_component_id ?? ''),
            title: invoice.title ?? '',
            description: invoice.description ?? '',
            amount: invoice.amount ?? '',
            due_date: invoice.due_date ?? '',
            status: invoice.status ?? 'unpaid',
        });
        form.clearErrors();
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        form.setData(emptyForm);
    };

    const removeInvoice = (invoice) => {
        if (!window.confirm(`Hapus tagihan ${invoice.invoice_no}?`)) return;
        router.delete(`/finance-invoices/${invoice.id}`, { preserveScroll: true });
    };

    const openDetail = (invoice) => {
        setDetailInvoice(invoice);
    };

    const closeDetail = () => {
        setDetailInvoice(null);
    };

    const sendReminder = (invoice) => {
        const to = invoice?.student?.email;
        if (!to) {
            window.alert('Email mahasiswa belum tersedia.');
            return;
        }

        const subject = encodeURIComponent(`Pengingat Tagihan ${invoice.invoice_no}`);
        const body = encodeURIComponent(
            `Halo ${invoice?.student?.name ?? 'Mahasiswa'},\n\n` +
            `Mohon melakukan pembayaran untuk tagihan berikut:\n` +
            `- Nomor: ${invoice.invoice_no}\n` +
            `- Jenis: ${invoice.title}\n` +
            `- Jumlah: Rp ${new Intl.NumberFormat(intlLocale).format(Number(invoice.amount ?? 0))}\n` +
            `- Jatuh tempo: ${formatDate(invoice.due_date)}\n\n` +
            `Terima kasih.`
        );
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    };

    return (
        <ProtectedLayout>
            <Head title="Tagihan" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Tagihan"
                    description="Kelola tagihan pembayaran mahasiswa"
                    icon={FileText}
                />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data contoh dipakai untuk preview tampilan.</p>
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
                    <StatCard title="Total Tagihan" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Lunas" value={summary.paid} tone="gradient-success" />
                    <StatCard title="Belum Bayar" value={summary.unpaid} tone="bg-gradient-to-r from-pink-600 to-rose-500" />
                    <StatCard title="Sebagian" value={summary.partial} tone="gradient-warm" />
                </div>

                <section className="panel-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="font-semibold text-xl">Daftar Tagihan</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                                {STATUS_OPTIONS.map((option) => (
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
                                    placeholder="Cari tagihan..."
                                    className="pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm w-[220px]"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold"
                            >
                                <Plus className="w-4 h-4" />
                                Buat Tagihan
                            </button>
                        </div>
                    </div>

                    <CreateFormModal
                        open={showForm}
                        title={editingId ? 'Edit Tagihan' : 'Tambah Tagihan'}
                        onClose={closeForm}
                        onSubmit={submitForm}
                        submitLabel="Simpan"
                        processing={form.processing}
                        disableSubmit={mocked || migrationRequired}
                        maxWidthClass="max-w-4xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectField label="Mahasiswa" value={form.data.student_id} onChange={(value) => form.setData('student_id', value)} error={form.errors.student_id}>
                                <option value="">Pilih mahasiswa</option>
                                {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                            </SelectField>
                            <SelectField label="Komponen" value={form.data.fee_component_id} onChange={(value) => form.setData('fee_component_id', value)} error={form.errors.fee_component_id}>
                                <option value="">Pilih komponen</option>
                                {feeComponents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </SelectField>
                            <Field label="Jenis Tagihan" value={form.data.title} onChange={(value) => form.setData('title', value)} error={form.errors.title} />
                            <Field label="Jumlah" type="number" value={form.data.amount} onChange={(value) => form.setData('amount', value)} error={form.errors.amount} />
                            <Field label="Jatuh Tempo" type="date" value={form.data.due_date} onChange={(value) => form.setData('due_date', value)} error={form.errors.due_date} />
                            <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}>
                                <option value="unpaid">Belum Bayar</option>
                                <option value="partial">Sebagian</option>
                                <option value="paid">Lunas</option>
                                <option value="overdue">Terlambat</option>
                                <option value="cancelled">Dibatalkan</option>
                            </SelectField>
                            <label className="md:col-span-2 block">
                                <span className="text-sm font-medium">Catatan</span>
                                <textarea
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                                    placeholder="Opsional"
                                />
                            </label>
                        </div>
                    </CreateFormModal>

                    <CreateFormModal
                        open={!!detailInvoice}
                        title="Detail Tagihan"
                        onClose={closeDetail}
                        hideFooter
                        maxWidthClass="max-w-2xl"
                    >
                        {detailInvoice && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <ReadOnlyField label="No. Tagihan" value={detailInvoice.invoice_no} />
                                <ReadOnlyField label="Status" value={statusText(detailInvoice.status)} />
                                <ReadOnlyField label="Mahasiswa" value={detailInvoice.student?.name ?? '-'} />
                                <ReadOnlyField label="NIM" value={detailInvoice.student?.code ?? '-'} />
                                <ReadOnlyField label="Email" value={detailInvoice.student?.email ?? '-'} />
                                <ReadOnlyField label="Komponen" value={detailInvoice.fee_component?.name ?? '-'} />
                                <ReadOnlyField label="Jenis Tagihan" value={detailInvoice.title ?? '-'} />
                                <ReadOnlyField label="Jumlah" value={`Rp ${new Intl.NumberFormat(intlLocale).format(Number(detailInvoice.amount ?? 0))}`} />
                                <ReadOnlyField label="Jatuh Tempo" value={formatDate(detailInvoice.due_date)} />
                                <div className="sm:col-span-2">
                                    <ReadOnlyField label="Catatan" value={detailInvoice.description || '-'} multiline />
                                </div>
                            </div>
                        )}
                    </CreateFormModal>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b border-border">
                                    <th className="py-2 px-2">ID Tagihan</th>
                                    <th className="py-2 px-2">Mahasiswa</th>
                                    <th className="py-2 px-2">Jenis</th>
                                    <th className="py-2 px-2">Jumlah</th>
                                    <th className="py-2 px-2">Jatuh Tempo</th>
                                    <th className="py-2 px-2">Status</th>
                                    <th className="py-2 px-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-border/70">
                                        <td className="py-2.5 px-2 text-xs text-muted-foreground font-semibold">{invoice.invoice_no}</td>
                                        <td className="py-2.5 px-2">
                                            <p className="font-medium">{invoice.student?.name ?? '-'}</p>
                                            <p className="text-xs text-muted-foreground">NIM: {invoice.student?.code ?? '-'}</p>
                                        </td>
                                        <td className="py-2.5 px-2 font-medium">{invoice.title}</td>
                                        <td className="py-2.5 px-2 text-success font-semibold">Rp {new Intl.NumberFormat(intlLocale).format(Number(invoice.amount ?? 0))}</td>
                                        <td className="py-2.5 px-2 text-muted-foreground">{formatDate(invoice.due_date)}</td>
                                        <td className="py-2.5 px-2">{statusBadge(invoice.status)}</td>
                                        <td className="py-2.5 px-2">
                                            <div className="inline-flex items-center gap-2">
                                                <ActionIconButton icon={Eye} label="Lihat" tone="neutral" onClick={() => openDetail(invoice)} />
                                                <ActionIconButton icon={Send} label="Kirim Pengingat" tone="info" onClick={() => sendReminder(invoice)} />
                                                <ActionIconButton icon={FileText} label="Edit" tone="primary" onClick={() => openEdit(invoice)} disabled={mocked || invoice.is_mock} />
                                                <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => removeInvoice(invoice)} disabled={mocked || invoice.is_mock} />
                                            </div>
                                        </td>
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

function ReadOnlyField({ label, value, multiline = false }) {
    const className = multiline
        ? 'mt-1.5 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm min-h-[84px] whitespace-pre-wrap'
        : 'mt-1.5 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm';

    return (
        <div>
            <p className="text-sm font-medium">{label}</p>
            <div className={className}>{value}</div>
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

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
    const map = {
        paid: 'bg-success/15 text-success',
        unpaid: 'bg-destructive/15 text-destructive',
        partial: 'bg-warning/20 text-warning',
        overdue: 'bg-destructive/15 text-destructive',
        cancelled: 'bg-secondary text-secondary-foreground',
    };

    const labelMap = {
        paid: 'Lunas',
        unpaid: 'Belum Bayar',
        partial: 'Sebagian',
        overdue: 'Belum Bayar',
        cancelled: 'Dibatalkan',
    };

    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? map.cancelled}`}>{labelMap[status] ?? status}</span>;
}

function statusText(status) {
    const labelMap = {
        paid: 'Lunas',
        unpaid: 'Belum Bayar',
        partial: 'Sebagian',
        overdue: 'Terlambat',
        cancelled: 'Dibatalkan',
    };

    return labelMap[status] ?? status;
}

