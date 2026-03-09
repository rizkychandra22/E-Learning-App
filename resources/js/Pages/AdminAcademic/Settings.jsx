import { Head, useForm } from '@inertiajs/react';
import { Save, SlidersHorizontal } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

export default function Settings({ settings }) {
    const form = useForm({
        dashboard_refresh_seconds: settings.dashboard_refresh_seconds ?? 60,
        show_pending_first: !!settings.show_pending_first,
        enable_user_email_notification: !!settings.enable_user_email_notification,
        default_user_role_filter: settings.default_user_role_filter ?? 'all',
    });

    const submit = (event) => {
        event.preventDefault();
        form.put('/settings/admin-academic', { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Pengaturan Admin Akademik" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Pengaturan Admin Akademik" description="Atur preferensi kerja untuk dashboard dan manajemen data akademik" />

                <form onSubmit={submit} className="bg-card border border-border rounded-xl shadow-card p-4 space-y-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        Preferensi Dashboard
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium">Auto Refresh Dashboard (detik)</span>
                        <input
                            type="number"
                            value={form.data.dashboard_refresh_seconds}
                            onChange={(event) => form.setData('dashboard_refresh_seconds', event.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {form.errors.dashboard_refresh_seconds && <span className="text-xs text-destructive mt-1 block">{form.errors.dashboard_refresh_seconds}</span>}
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium">Filter Role Default (Kelola User)</span>
                        <select
                            value={form.data.default_user_role_filter}
                            onChange={(event) => form.setData('default_user_role_filter', event.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="all">Semua Role</option>
                            <option value="admin">Admin</option>
                            <option value="finance">Finance</option>
                            <option value="teacher">Dosen</option>
                            <option value="student">Mahasiswa</option>
                        </select>
                        {form.errors.default_user_role_filter && <span className="text-xs text-destructive mt-1 block">{form.errors.default_user_role_filter}</span>}
                    </label>

                    <SwitchField
                        title="Tampilkan akun pending di urutan teratas"
                        checked={form.data.show_pending_first}
                        onChange={(value) => form.setData('show_pending_first', value)}
                    />
                    <SwitchField
                        title="Aktifkan notifikasi email saat ada user baru"
                        checked={form.data.enable_user_email_notification}
                        onChange={(value) => form.setData('enable_user_email_notification', value)}
                    />

                    <button type="submit" disabled={form.processing} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                        <Save className="w-4 h-4" />
                        Simpan Pengaturan
                    </button>
                </form>
            </div>
        </ProtectedLayout>
    );
}

function SwitchField({ title, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span className="text-sm">{title}</span>
        </label>
    );
}


