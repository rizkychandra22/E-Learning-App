import { Head, useForm } from '@inertiajs/react';
import { Globe, Bell, Shield, Mail, Database, Save, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const settingTabs = [
    { key: 'general', label: 'Umum', icon: Globe },
    { key: 'security', label: 'Keamanan', icon: Shield },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'database', label: 'Database', icon: Database },
];

export default function Settings({ settings }) {
    const [activeTab, setActiveTab] = useState('general');

    const form = useForm({
        platform_name: settings.platform_name ?? '',
        support_email: settings.support_email ?? '',
        default_language: settings.default_language ?? 'id',
        maintenance_mode: !!settings.maintenance_mode,
        allow_registration: !!settings.allow_registration,
        notify_on_new_user: !!settings.notify_on_new_user,
        session_timeout_minutes: settings.session_timeout_minutes ?? 60,
        max_upload_mb: settings.max_upload_mb ?? 20,
    });

    const submit = (event) => {
        event.preventDefault();
        form.put('/settings', { preserveScroll: true });
    };

    const activeTabLabel = useMemo(() => settingTabs.find((item) => item.key === activeTab)?.label ?? 'Pengaturan', [activeTab]);

    return (
        <ProtectedLayout>
            <Head title="Pengaturan" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Pengaturan" description="Konfigurasi sistem dan platform secara menyeluruh" />

                <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <aside className="xl:col-span-3 panel-card p-4 h-fit">
                        <div className="space-y-1">
                            {settingTabs.map((tab) => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                            active
                                                ? 'gradient-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <section className="xl:col-span-9 panel-card p-4 space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <SlidersHorizontal className="w-5 h-5 text-primary" />
                            {activeTabLabel}
                        </div>

                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <Field
                                    label="Nama Platform"
                                    value={form.data.platform_name}
                                    error={form.errors.platform_name}
                                    onChange={(value) => form.setData('platform_name', value)}
                                />
                                <Field
                                    label="Email Support"
                                    type="email"
                                    value={form.data.support_email}
                                    error={form.errors.support_email}
                                    onChange={(value) => form.setData('support_email', value)}
                                />
                                <SelectField
                                    label="Bahasa Default"
                                    value={form.data.default_language}
                                    error={form.errors.default_language}
                                    onChange={(value) => form.setData('default_language', value)}
                                    options={[
                                        { value: 'id', label: 'Bahasa Indonesia' },
                                        { value: 'en', label: 'English' },
                                    ]}
                                />
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-4">
                                <Field
                                    label="Session Timeout (menit)"
                                    type="number"
                                    value={form.data.session_timeout_minutes}
                                    error={form.errors.session_timeout_minutes}
                                    onChange={(value) => form.setData('session_timeout_minutes', value)}
                                />
                                <SwitchRow
                                    title="Maintenance Mode"
                                    description="Platform tidak bisa diakses pengguna saat mode maintenance aktif"
                                    checked={form.data.maintenance_mode}
                                    onChange={(value) => form.setData('maintenance_mode', value)}
                                />
                                <SwitchRow
                                    title="Izinkan Registrasi"
                                    description="Aktifkan pendaftaran akun baru dari halaman login"
                                    checked={form.data.allow_registration}
                                    onChange={(value) => form.setData('allow_registration', value)}
                                />
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-4">
                                <SwitchRow
                                    title="Notifikasi User Baru"
                                    description="Kirim notifikasi internal ketika user baru dibuat"
                                    checked={form.data.notify_on_new_user}
                                    onChange={(value) => form.setData('notify_on_new_user', value)}
                                />
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="space-y-4">
                                <Field
                                    label="Email Support"
                                    type="email"
                                    value={form.data.support_email}
                                    error={form.errors.support_email}
                                    onChange={(value) => form.setData('support_email', value)}
                                />
                            </div>
                        )}

                        {activeTab === 'database' && (
                            <div className="space-y-4">
                                <Field
                                    label="Maks Upload File (MB)"
                                    type="number"
                                    value={form.data.max_upload_mb}
                                    error={form.errors.max_upload_mb}
                                    onChange={(value) => form.setData('max_upload_mb', value)}
                                />
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </section>
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
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, options }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                {options.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SwitchRow({ title, description, checked, onChange }) {
    return (
        <label className="panel-subcard p-3 flex items-center justify-between gap-3 cursor-pointer">
            <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
            </span>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="sr-only"
                />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
        </label>
    );
}

