import { Head, Link, usePage } from '@inertiajs/react';
import { ShieldAlert, Wrench } from 'lucide-react';

export default function MaintenanceNotice() {
    const { props } = usePage();
    const system = props.system ?? {};
    const isEnglish = system.default_language === 'en';
    const platformName = system.platform_name ?? 'Smart Learning';
    const supportEmail = system.support_email ?? 'support@univ.ac.id';

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Head title={isEnglish ? 'Maintenance Mode' : 'Mode Maintenance'} />
            <div className="w-full max-w-2xl panel-card p-6 md:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 text-warning text-xs font-semibold mb-5">
                    <Wrench className="w-3.5 h-3.5" />
                    {isEnglish ? 'System Maintenance' : 'Maintenance Sistem'}
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEnglish ? 'Service is temporarily unavailable' : 'Layanan sementara tidak tersedia'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {isEnglish
                                ? `${platformName} is currently in maintenance mode. Only Super Admin can access the system right now.`
                                : `${platformName} sedang dalam mode maintenance. Saat ini hanya Super Admin yang dapat mengakses sistem.`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-3">
                            {isEnglish ? 'Need assistance?' : 'Butuh bantuan?'}{' '}
                            <a href={`mailto:${supportEmail}`} className="text-primary font-medium hover:underline">
                                {supportEmail}
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
                        {isEnglish ? 'Sign in as Super Admin' : 'Masuk sebagai Super Admin'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

