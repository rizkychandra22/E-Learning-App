import { Head, useForm, usePage } from '@inertiajs/react';
import { Camera, CheckCircle2, Loader2, Lock, Save, Shield, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { cn } from '@/lib/cn';

const roleLabels = {
    root: 'Super Admin',
    admin: 'Admin Universitas',
    finance: 'Admin Finance',
    teacher: 'Dosen',
    student: 'Mahasiswa',
};

const roleColors = {
    root: 'bg-violet-100 text-violet-700',
    admin: 'bg-emerald-100 text-emerald-700',
    finance: 'bg-orange-100 text-orange-700',
    teacher: 'bg-sky-100 text-sky-700',
    student: 'bg-rose-100 text-rose-700',
};

export default function EditProfile({ profile }) {
    const { props } = usePage();
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(profile?.profile_photo_url ?? null);

    const form = useForm({
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        username: profile?.username ?? '',
        password: '',
        password_confirmation: '',
        profile_photo: null,
        remove_profile_photo: false,
    });

    useEffect(() => {
        if (form.data.profile_photo instanceof File) {
            const objectUrl = URL.createObjectURL(form.data.profile_photo);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }

        setPreviewUrl(form.data.remove_profile_photo ? null : (profile?.profile_photo_url ?? null));
    }, [form.data.profile_photo, form.data.remove_profile_photo, profile?.profile_photo_url]);

    const initials = String(profile?.name ?? profile?.email ?? '?')
        .split(' ')
        .map((part) => part?.[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const saveInfo = () => {
        form.put('/profile', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset('password', 'password_confirmation', 'profile_photo');
                form.setData('remove_profile_photo', false);
            },
        });
    };

    const savePassword = () => {
        if (!form.data.password) return;
        form.put('/profile', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset('password', 'password_confirmation', 'profile_photo');
                form.setData('remove_profile_photo', false);
            },
        });
    };

    return (
        <ProtectedLayout>
            <Head title="Profil Saya" />

            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Profil Saya"
                    description="Kelola identitas akun, foto profil, dan keamanan akses Anda."
                />

                {props?.flash?.success && (
                    <div className="rounded-xl border border-success/30 bg-success/10 text-success px-4 py-3 text-sm">
                        {props.flash.success}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 space-y-4">
                        <div className="panel-card p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden gradient-primary flex items-center justify-center shadow-card-lg">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Foto profil" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-2xl font-bold">{initials}</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={form.processing}
                                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
                                    >
                                        {form.processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0] ?? null;
                                            form.setData('profile_photo', file);
                                            if (file) {
                                                form.setData('remove_profile_photo', false);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-xl font-bold">{form.data.name || 'Pengguna'}</h2>
                                    <p className="text-sm text-muted-foreground">{form.data.email}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                                        <span
                                            className={cn(
                                                'text-xs font-medium px-3 py-1 rounded-full',
                                                roleColors[profile?.role] ?? 'bg-muted text-muted-foreground'
                                            )}
                                        >
                                            {roleLabels[profile?.role] ?? profile?.role}
                                        </span>
                                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                                            Aktif
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span>Kode: <span className="font-medium text-foreground">{profile?.code ?? '-'}</span></span>
                                        <span>Username: <span className="font-medium text-foreground">{form.data.username || '-'}</span></span>
                                    </div>
                                </div>
                            </div>
                            {profile?.profile_photo_url && (
                                <label className="mt-4 inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.data.remove_profile_photo}
                                        onChange={(event) => {
                                            form.setData('remove_profile_photo', event.target.checked);
                                            if (event.target.checked) {
                                                form.setData('profile_photo', null);
                                            }
                                        }}
                                        className="rounded border-border"
                                    />
                                    Hapus foto profil saat disimpan
                                </label>
                            )}
                            {form.errors.profile_photo && (
                                <span className="text-xs text-destructive mt-1 block">{form.errors.profile_photo}</span>
                            )}
                        </div>

                        <div className="panel-card p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold">Informasi Pribadi</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field
                                    label="Nama Lengkap"
                                    value={form.data.name}
                                    error={form.errors.name}
                                    onChange={(value) => form.setData('name', value)}
                                    placeholder="Nama lengkap"
                                />
                                <Field
                                    label="Email"
                                    type="email"
                                    value={form.data.email}
                                    error={form.errors.email}
                                    onChange={(value) => form.setData('email', value)}
                                    placeholder="nama@email.com"
                                />
                                <Field
                                    label="Username"
                                    value={form.data.username}
                                    error={form.errors.username}
                                    onChange={(value) => form.setData('username', value)}
                                    placeholder="username"
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={saveInfo}
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                                >
                                    {form.processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : form.recentlySuccessful ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {form.recentlySuccessful ? 'Tersimpan!' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>

                        <div className="panel-card p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Lock className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold">Ubah Kata Sandi</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field
                                    label="Kata Sandi Baru"
                                    type="password"
                                    value={form.data.password}
                                    error={form.errors.password}
                                    onChange={(value) => form.setData('password', value)}
                                    placeholder="Min. 6 karakter"
                                />
                                <Field
                                    label="Konfirmasi Kata Sandi"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    error={form.errors.password_confirmation}
                                    onChange={(value) => form.setData('password_confirmation', value)}
                                    placeholder="Ulangi kata sandi"
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={savePassword}
                                    disabled={form.processing || !form.data.password}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors disabled:opacity-60"
                                >
                                    {form.processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    Simpan Password
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="panel-card p-4 sm:p-5 h-fit">
                        <h3 className="font-semibold">Ringkasan Akun</h3>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="panel-subcard p-3">
                                <p className="text-xs text-muted-foreground">Role Aktif</p>
                                <p className="font-semibold mt-1">{roleLabels[profile?.role] ?? profile?.role}</p>
                            </div>
                            <div className="panel-subcard p-3">
                                <p className="text-xs text-muted-foreground">Kode User</p>
                                <p className="font-semibold mt-1">{profile?.code ?? '-'}</p>
                            </div>
                            <div className="panel-subcard p-3">
                                <p className="text-xs text-muted-foreground">Status Akun</p>
                                <p className="font-semibold mt-1 text-success">Aktif</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text', placeholder = '' }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}
