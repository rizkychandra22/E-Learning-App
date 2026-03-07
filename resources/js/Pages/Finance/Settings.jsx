import { Head, useForm } from '@inertiajs/react';
import { Save, TriangleAlert } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

export default function Settings({ settings, migrationRequired }) {
    const form = useForm({
        default_due_days: settings.default_due_days ?? 14,
        auto_verify_payment: !!settings.auto_verify_payment,
        overdue_reminder_days: settings.overdue_reminder_days ?? 3,
    });

    const submit = (event) => {
        event.preventDefault();
        form.put('/settings/finance', { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Pengaturan Finance" />
            <div className="space-y-6 max-w-4xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pengaturan Finance</h1>
                    <p className="text-muted-foreground mt-1">Konfigurasi operasional finance dashboard</p>
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

                <form onSubmit={submit} className="bg-card border border-border rounded-xl shadow-card p-5 space-y-4">
                    <Field label="Default Due Days" type="number" value={form.data.default_due_days} onChange={(value) => form.setData('default_due_days', value)} error={form.errors.default_due_days} />
                    <Field label="Overdue Reminder Days" type="number" value={form.data.overdue_reminder_days} onChange={(value) => form.setData('overdue_reminder_days', value)} error={form.errors.overdue_reminder_days} />
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer">
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40" checked={form.data.auto_verify_payment} onChange={(event) => form.setData('auto_verify_payment', event.target.checked)} />
                        <span className="text-sm">Aktifkan auto verify payment</span>
                    </label>

                    <button type="submit" disabled={form.processing || migrationRequired} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                        <Save className="w-4 h-4" />
                        Simpan Pengaturan
                    </button>
                </form>
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
