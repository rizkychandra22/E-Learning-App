import { Head, useForm } from '@inertiajs/react';
import { Bell, Building2, CreditCard, Lock, Save, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const TABS = [
    { key: 'payment', label: 'Pembayaran', icon: CreditCard },
    { key: 'bank', label: 'Rekening Bank', icon: Building2 },
    { key: 'notification', label: 'Notifikasi', icon: Bell },
    { key: 'security', label: 'Keamanan', icon: Lock },
];

export default function Settings({ settings, migrationRequired }) {
    const [activeTab, setActiveTab] = useState('payment');

    const form = useForm({
        nominal_spp: settings.nominal_spp ?? 2500000,
        late_fee_per_day: settings.late_fee_per_day ?? 50000,
        grace_period_days: settings.grace_period_days ?? settings.default_due_days ?? 7,
        auto_invoice_enabled: settings.auto_invoice_enabled ?? true,
        auto_reminder_enabled: settings.auto_reminder_enabled ?? true,
        auto_verify_payment: settings.auto_verify_payment ?? false,
        default_due_days: settings.default_due_days ?? 14,
        overdue_reminder_days: settings.overdue_reminder_days ?? 3,
    });

    const submit = (event) => {
        event.preventDefault();
        const payload = {
            ...form.data,
            default_due_days: Number(form.data.grace_period_days || form.data.default_due_days || 7),
            overdue_reminder_days: Number(form.data.overdue_reminder_days || 3),
            nominal_spp: Number(form.data.nominal_spp || 0),
            late_fee_per_day: Number(form.data.late_fee_per_day || 0),
            grace_period_days: Number(form.data.grace_period_days || 0),
        };

        form.transform(() => payload).put('/settings/finance', {
            preserveScroll: true,
            onSuccess: () => form.reset('default_due_days', 'overdue_reminder_days'),
        });
    };

    return (
        <ProtectedLayout>
            <Head title="Pengaturan" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Pengaturan"
                    description="Konfigurasi sistem keuangan dan pembayaran"
                    icon={ShieldCheck}
                />

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel finance belum tersedia.</p>
                            <p>Jalankan migrasi: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <section className="panel-card p-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
                        <aside className="panel-subcard p-2 h-fit">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </aside>

                        <div className="panel-subcard p-4">
                            {activeTab === 'payment' && (
                                <form onSubmit={submit} className="space-y-4">
                                    <h2 className="font-semibold text-xl flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                        Pengaturan Pembayaran
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Field
                                            label="Nominal SPP (Rp)"
                                            type="number"
                                            value={form.data.nominal_spp}
                                            onChange={(value) => form.setData('nominal_spp', value)}
                                            error={form.errors.nominal_spp}
                                        />
                                        <Field
                                            label="Denda Keterlambatan (Rp/hari)"
                                            type="number"
                                            value={form.data.late_fee_per_day}
                                            onChange={(value) => form.setData('late_fee_per_day', value)}
                                            error={form.errors.late_fee_per_day}
                                        />
                                        <Field
                                            label="Masa Toleransi (hari)"
                                            type="number"
                                            value={form.data.grace_period_days}
                                            onChange={(value) => form.setData('grace_period_days', value)}
                                            error={form.errors.grace_period_days}
                                        />
                                    </div>

                                    <ToggleRow
                                        label="Invoice Otomatis"
                                        description="Buat tagihan otomatis setiap awal semester"
                                        checked={!!form.data.auto_invoice_enabled}
                                        onChange={(checked) => form.setData('auto_invoice_enabled', checked)}
                                    />

                                    <ToggleRow
                                        label="Pengingat Otomatis"
                                        description="Kirim pengingat tagihan 7 hari sebelum jatuh tempo"
                                        checked={!!form.data.auto_reminder_enabled}
                                        onChange={(checked) => form.setData('auto_reminder_enabled', checked)}
                                    />

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="submit"
                                            disabled={form.processing || migrationRequired}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                                        >
                                            <Save className="w-4 h-4" />
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'bank' && <PlaceholderTab title="Rekening Bank" description="Atur informasi rekening penerimaan agar pembayaran mahasiswa mudah diverifikasi." />}
                            {activeTab === 'notification' && <PlaceholderTab title="Notifikasi" description="Kelola notifikasi tagihan, verifikasi, dan pengingat untuk tim keuangan." />}
                            {activeTab === 'security' && <PlaceholderTab title="Keamanan" description="Kelola kebijakan keamanan akses modul keuangan dan aktivitas audit." />}
                        </div>
                    </div>
                </section>
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

function ToggleRow({ label, description, checked, onChange }) {
    return (
        <div className="rounded-lg border border-border bg-background px-3 py-3 flex items-center justify-between gap-3">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

function PlaceholderTab({ title, description }) {
    return (
        <div className="rounded-xl border border-dashed border-border bg-background p-5 text-sm">
            <p className="font-semibold text-lg">{title}</p>
            <p className="text-muted-foreground mt-1">{description}</p>
            <p className="text-muted-foreground mt-3">Tab ini siap untuk diaktifkan saat field backend terkait ditambahkan.</p>
        </div>
    );
}
