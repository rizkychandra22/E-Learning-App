import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, TriangleAlert } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

const emptyForm = {
    student_id: '',
    fee_component_id: '',
    title: '',
    description: '',
    amount: '',
    due_date: '',
    status: 'unpaid',
};

const statusBadge = {
    unpaid: 'bg-warning/20 text-warning',
    partial: 'bg-info/20 text-info',
    paid: 'bg-success/15 text-success',
    overdue: 'bg-destructive/15 text-destructive',
    cancelled: 'bg-secondary text-secondary-foreground',
};

export default function Invoices({ migrationRequired, invoices, students, feeComponents, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [editingId, setEditingId] = useState(null);
    const form = useForm(emptyForm);
    const isEditing = editingId !== null;

    const selectedInvoice = useMemo(() => invoices.find((item) => item.id === editingId) ?? null, [invoices, editingId]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/finance-invoices', { search, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        router.get('/finance-invoices', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const beginEdit = (invoice) => {
        setEditingId(invoice.id);
        form.setData({
            student_id: invoice.student_id ? String(invoice.student_id) : '',
            fee_component_id: invoice.fee_component_id ? String(invoice.fee_component_id) : '',
            title: invoice.title ?? '',
            description: invoice.description ?? '',
            amount: invoice.amount ?? '',
            due_date: invoice.due_date ?? '',
            status: invoice.status ?? 'unpaid',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();
        if (isEditing) {
            form.put(`/finance-invoices/${editingId}`, { preserveScroll: true });
            return;
        }
        form.post('/finance-invoices', { preserveScroll: true });
    };

    const destroyInvoice = (invoice) => {
        if (!window.confirm(`Hapus invoice ${invoice.invoice_no}?`)) return;
        router.delete(`/finance-invoices/${invoice.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Tagihan" />
            <div className="space-y-6 max-w-7xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tagihan</h1>
                    <p className="text-muted-foreground mt-1">Kelola invoice/tagihan mahasiswa</p>
                </div>

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel finance belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari invoice..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm md:w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px]">
                                <thead className="bg-secondary/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Invoice</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Mahasiswa</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Komponen</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Jatuh Tempo</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Amount</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-t border-border">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium">{invoice.title}</p>
                                                <p className="text-xs text-muted-foreground">{invoice.invoice_no}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.student?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.fee_component?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.due_date ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{new Intl.NumberFormat('id-ID').format(invoice.amount ?? 0)}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[invoice.status] ?? 'bg-secondary text-secondary-foreground'}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => beginEdit(invoice)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => destroyInvoice(invoice)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {invoices.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                Belum ada data tagihan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-card p-5 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? 'Edit Tagihan' : 'Buat Tagihan'}</h2>
                            {isEditing && (
                                <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditing && selectedInvoice && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Mengubah invoice <span className="font-medium text-foreground">{selectedInvoice.invoice_no}</span>
                            </p>
                        )}

                        <form onSubmit={submitForm} className="space-y-3">
                            <SelectField label="Mahasiswa" value={form.data.student_id} error={form.errors.student_id} onChange={(value) => form.setData('student_id', value)}>
                                <option value="">Pilih Mahasiswa</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} ({student.code})
                                    </option>
                                ))}
                            </SelectField>
                            <SelectField label="Komponen Biaya" value={form.data.fee_component_id} error={form.errors.fee_component_id} onChange={(value) => form.setData('fee_component_id', value)}>
                                <option value="">Pilih Komponen</option>
                                {feeComponents.map((component) => (
                                    <option key={component.id} value={component.id}>
                                        {component.name} ({new Intl.NumberFormat('id-ID').format(component.amount)})
                                    </option>
                                ))}
                            </SelectField>
                            <Field label="Judul Tagihan" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                            <Field label="Amount" type="number" value={form.data.amount} error={form.errors.amount} onChange={(value) => form.setData('amount', value)} />
                            <Field label="Jatuh Tempo" type="date" value={form.data.due_date} error={form.errors.due_date} onChange={(value) => form.setData('due_date', value)} />
                            <SelectField label="Status" value={form.data.status} error={form.errors.status} onChange={(value) => form.setData('status', value)}>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </SelectField>
                            <label className="block">
                                <span className="text-sm font-medium">Deskripsi</span>
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    rows={3}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                {form.errors.description && <span className="text-xs text-destructive mt-1 block">{form.errors.description}</span>}
                            </label>

                            <button type="submit" disabled={form.processing || migrationRequired} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Simpan Perubahan' : 'Buat Tagihan'}
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
