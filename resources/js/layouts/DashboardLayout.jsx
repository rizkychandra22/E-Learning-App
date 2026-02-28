import { AppSidebar } from '@/components/AppSidebar';
import { TopNavbar } from '@/components/TopNavbar';

export function DashboardLayout({ children }) {
    return (
        <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar />
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
