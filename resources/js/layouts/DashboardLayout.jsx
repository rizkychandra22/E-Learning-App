import { AppSidebar } from '@/components/AppSidebar';
import { TopNavbar } from '@/components/TopNavbar';
import { useEffect, useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    });
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const closeOnDesktop = () => {
            if (window.innerWidth >= 1024) {
                setMobileSidebarOpen(false);
            }
        };

        closeOnDesktop();
        window.addEventListener('resize', closeOnDesktop);
        return () => window.removeEventListener('resize', closeOnDesktop);
    }, []);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setMobileSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    }, [collapsed]);

    return (
        <div className="flex min-h-screen w-full bg-background">
            <AppSidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((prev) => !prev)}
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
