import { Outlet, useLocation, Navigate } from "react-router-dom"
import { BottomNav } from "./BottomNav"
import { useAppStore } from "../store/useAppStore"
import NotificationManager from "./NotificationManager"
import { cn } from "../lib/utils"
import { Toaster } from 'sonner'

export default function Layout() {
    const location = useLocation();
    const user = useAppStore((state) => state.user);
    const isDesktopView = useAppStore((state) => state.isDesktopView);

    // Auth Check
    if (!user.isAuthenticated && location.pathname !== "/auth") {
        return <Navigate to="/auth" replace />;
    }

    const isSplash = location.pathname === '/splash';
    const isAuth = location.pathname === '/auth';

    return (
        <div className={cn(
            !isDesktopView && "mobile-container",
            "h-screen"
        )}>
            <div className="flex flex-col h-full overflow-hidden relative">
                <NotificationManager />
                <main className="flex-1 w-full overflow-y-auto pb-[calc(100px+env(safe-area-inset-bottom,0px))]">
                    <Outlet />
                </main>

                {!isSplash && !isAuth && <BottomNav />}
            </div>
            <Toaster
                position="top-center"
                richColors
                toastOptions={{
                    classNames: {
                        toast: 'rounded-2xl border-none shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md font-medium text-slate-900 dark:text-slate-100',
                        title: 'text-base',
                        description: 'text-slate-500 dark:text-slate-400',
                        actionButton: 'bg-blue-500',
                        cancelButton: 'bg-slate-200 dark:bg-slate-800',
                    },
                    style: {
                        borderRadius: '16px',
                        padding: '16px',
                    }
                }}
            />
        </div>
    )
}
