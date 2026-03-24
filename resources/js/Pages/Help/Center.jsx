import { Head } from '@inertiajs/react';
import { LifeBuoy, Mail, MessageSquareText, Phone } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

export default function HelpCenter() {
    return (
        <ProtectedLayout>
            <Head title="Pusat Bantuan" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Pusat Bantuan"
                    description="Hubungi tim support untuk kendala akun, kendala pembelajaran, atau pertanyaan teknis."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="panel-card p-4">
                        <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center mb-3">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold">Email Support</h3>
                        <p className="text-sm text-muted-foreground mt-1">Respon 1x24 jam hari kerja.</p>
                        <a href="mailto:support@edulearn.local" className="inline-flex mt-3 text-sm font-medium text-primary hover:opacity-80">
                            support@edulearn.local
                        </a>
                    </div>

                    <div className="panel-card p-4">
                        <div className="w-10 h-10 rounded-xl gradient-success text-primary-foreground grid place-items-center mb-3">
                            <Phone className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold">Hotline</h3>
                        <p className="text-sm text-muted-foreground mt-1">Jam operasional 08:00 - 17:00.</p>
                        <a href="tel:+620000000000" className="inline-flex mt-3 text-sm font-medium text-primary hover:opacity-80">
                            +62 000-0000-0000
                        </a>
                    </div>

                    <div className="panel-card p-4">
                        <div className="w-10 h-10 rounded-xl gradient-accent text-primary-foreground grid place-items-center mb-3">
                            <MessageSquareText className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold">Bantuan Cepat</h3>
                        <p className="text-sm text-muted-foreground mt-1">Kirim detail kendala agar tim bisa bantu lebih cepat.</p>
                        <button
                            type="button"
                            onClick={() => window.location.assign('mailto:support@edulearn.local?subject=Butuh%20Bantuan%20E-Learning')}
                            className="inline-flex mt-3 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors"
                        >
                            <LifeBuoy className="w-4 h-4 mr-2" />
                            Kirim Permintaan
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
