import { Head, useForm } from '@inertiajs/react';
import { Save, Settings2 } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

export default function Settings({ settings }) {
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

    return (
        <ProtectedLayout>
            <Head title="Pengaturan" />
            <div className="space-y-6 max-w-5xl">
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-muted-foreground mt-1">Konfigurasi utama platform e-learning untuk role Super Admin</p>
                </div>

                <form onSubmit={submit} className="bg-card border border-border rounded-xl shadow-card p-5 space-y-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Settings2 className="w-4 h-4 text-primary" />
                        Konfigurasi Platform
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                { value: 'id', label: 'Indonesia' },
                                { value: 'en', label: 'English' },
                            ]}
                        />
                        <Field
                            label="Session Timeout (menit)"
                            type="number"
                            value={form.data.session_timeout_minutes}
                            error={form.errors.session_timeout_minutes}
                            onChange={(value) => form.setData('session_timeout_minutes', value)}
                        />
                        <Field
                            label="Maks Upload File (MB)"
                            type="number"
                            value={form.data.max_upload_mb}
                            error={form.errors.max_upload_mb}
                            onChange={(value) => form.setData('max_upload_mb', value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SwitchCard
                            title="Maintenance Mode"
                            description="Batasi akses pengguna non-admin saat maintenance aktif."
                            checked={form.data.maintenance_mode}
                            onChange={(value) => form.setData('maintenance_mode', value)}
                        />
                        <SwitchCard
                            title="Izinkan Registrasi"
                            description="Aktifkan pendaftaran akun baru langsung dari halaman login."
                            checked={form.data.allow_registration}
                            onChange={(value) => form.setData('allow_registration', value)}
                        />
                        <SwitchCard
                            title="Notifikasi User Baru"
                            description="Kirim notifikasi internal ketika user baru dibuat."
                            checked={form.data.notify_on_new_user}
                            onChange={(value) => form.setData('notify_on_new_user', value)}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                        >
                            <Save className="w-4 h-4" />
                            Simpan Pengaturan
                        </button>
                    </div>
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

function SelectField({ label, value, onChange, error, options }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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

function SwitchCard({ title, description, checked, onChange }) {
    return (
        <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background cursor-pointer">
            <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span>
                <span className="text-sm font-medium block">{title}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
            </span>
        </label>
    );
}
