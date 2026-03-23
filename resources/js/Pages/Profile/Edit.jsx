import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const roleLabels = {
    root: 'Super Admin',
    admin: 'Admin',
    finance: 'Finance',
    teacher: 'Dosen',
    student: 'Mahasiswa',
};

export default function EditProfile({ profile }) {
    const { props } = usePage();
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

    const submit = (event) => {
        event.preventDefault();
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
            <Head title="Edit Profil" />

            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Edit Profil"
                    description="Perbarui informasi akun Anda, termasuk foto profil yang akan tampil di top bar."
                />

                {props?.flash?.success && (
                    <div className="rounded-xl border border-success/30 bg-success/10 text-success px-4 py-3 text-sm">
                        {props.flash.success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="panel-card p-4 lg:col-span-2">
                        <form onSubmit={submit} className="space-y-3">
                            <Field label="Nama" value={form.data.name} error={form.errors.name} onChange={(value) => form.setData('name', value)} />
                            <Field label="Email" type="email" value={form.data.email} error={form.errors.email} onChange={(value) => form.setData('email', value)} />
                            <Field
                                label="Username"
                                value={form.data.username}
                                error={form.errors.username}
                                onChange={(value) => form.setData('username', value)}
                            />

                            <label className="block">
                                <span className="text-sm font-medium">Foto Profil</span>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        form.setData('profile_photo', file);
                                        if (file) {
                                            form.setData('remove_profile_photo', false);
                                        }
                                    }}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Format: JPG/PNG/WEBP, maksimal 2MB.</p>
                                {form.errors.profile_photo && <span className="text-xs text-destructive mt-1 block">{form.errors.profile_photo}</span>}
                            </label>

                            {profile?.profile_photo_url && (
                                <label className="inline-flex items-center gap-2 text-sm">
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

                            <Field
                                label="Password Baru (opsional)"
                                type="password"
                                value={form.data.password}
                                error={form.errors.password}
                                onChange={(value) => form.setData('password', value)}
                            />
                            <Field
                                label="Konfirmasi Password Baru"
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(value) => form.setData('password_confirmation', value)}
                            />

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                Simpan Perubahan
                            </button>
                        </form>
                    </div>

                    <div className="panel-card p-4 h-fit">
                        <div className="flex items-center gap-3">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Foto profil" className="w-11 h-11 rounded-full object-cover border border-border" />
                            ) : (
                                <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                                    <UserCircle2 className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold leading-tight">{profile?.name}</p>
                                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <p>
                                <span className="text-muted-foreground">Role:</span>{' '}
                                <span className="font-medium">{roleLabels[profile?.role] ?? profile?.role}</span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">Kode:</span>{' '}
                                <span className="font-medium">{profile?.code}</span>
                            </p>
                        </div>
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

