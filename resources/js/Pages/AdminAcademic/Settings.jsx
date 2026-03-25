import { Head, useForm } from '@inertiajs/react';
import { Building2, Bell, Save, Shield, SlidersHorizontal, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const tabs = [
    { key: 'university', label: 'Universitas', icon: Building2 },
    { key: 'academic', label: 'Akademik', icon: SlidersHorizontal },
    { key: 'users', label: 'Pengguna', icon: Users },
    { key: 'notification', label: 'Notifikasi', icon: Bell },
];

export default function Settings({ settings }) {
    const [activeTab, setActiveTab] = useState('university');

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

    const tabTitle = useMemo(() => tabs.find((item) => item.key === activeTab)?.label ?? 'Pengaturan', [activeTab]);

    return (
        <ProtectedLayout>
            <Head title="Pengaturan" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Pengaturan" description="Konfigurasi platform untuk universitas Anda" />

                <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <aside className="xl:col-span-3 panel-card p-3 h-fit">
                        <div className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const active = tab.key === activeTab;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <section className="xl:col-span-9 panel-card p-4 space-y-4">
                        <h3 className="font-semibold text-xl flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {tabTitle}
                        </h3>

                        {activeTab === 'university' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field label="Nama Universitas" value="Universitas Nusantara" onChange={() => {}} disabled />
                                <Field label="Kode Universitas" value="UNNUS" onChange={() => {}} disabled />
                                <Field label="Website" value="https://unnus.ac.id" onChange={() => {}} disabled />
                                <Field label="Nomor Telepon" value="+62 21-1234-5678" onChange={() => {}} disabled />
                                <div className="md:col-span-2">
                                    <Field label="Alamat" value="Jl. Pendidikan No. 1, Jakarta" onChange={() => {}} disabled />
                                </div>
                            </div>
                        )}

                        {activeTab === 'academic' && (
                            <div className="space-y-3">
                                <Field
                                    label="Auto Refresh Dashboard (detik)"
                                    type="number"
                                    value={form.data.dashboard_refresh_seconds}
                                    onChange={(value) => form.setData('dashboard_refresh_seconds', value)}
                                    error={form.errors.dashboard_refresh_seconds}
                                />
                                <SwitchRow
                                    title="Tampilkan akun pending di urutan teratas"
                                    checked={form.data.show_pending_first}
                                    onChange={(value) => form.setData('show_pending_first', value)}
                                />
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-3">
                                <SelectField
                                    label="Filter Role Default"
                                    value={form.data.default_user_role_filter}
                                    onChange={(value) => form.setData('default_user_role_filter', value)}
                                    error={form.errors.default_user_role_filter}
                                >
                                    <option value="all">Semua Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="finance">Finance</option>
                                    <option value="teacher">Dosen</option>
                                    <option value="student">Mahasiswa</option>
                                </SelectField>
                            </div>
                        )}

                        {activeTab === 'notification' && (
                            <div className="space-y-3">
                                <SwitchRow
                                    title="Aktifkan notifikasi email saat ada user baru"
                                    checked={form.data.enable_user_email_notification}
                                    onChange={(value) => form.setData('enable_user_email_notification', value)}
                                />
                            </div>
                        )}

                        <button type="submit" disabled={form.processing} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                            <Save className="w-4 h-4" />
                            {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </section>
                </form>
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text', disabled = false }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-70"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SwitchRow({ title, checked, onChange }) {
    return (
        <label className="panel-subcard p-3 flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm font-medium">{title}</span>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
                <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
        </label>
    );
}
