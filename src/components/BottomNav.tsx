import { Home, PlusCircle, BarChart2, User, CalendarDays, Pill } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../lib/utils"

export function BottomNav() {
    const location = useLocation()

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: PlusCircle, label: "Log", path: "/log" },
        { icon: BarChart2, label: "Stats", path: "/stats" },
        { icon: CalendarDays, label: "Planner", path: "/planner" },
        { icon: Pill, label: "Medicine", path: "/medicine" },
        { icon: User, label: "Profile", path: "/profile" },
    ]

    return (
        <nav className={cn(
            "absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 pb-safe pt-2 px-2 flex justify-around items-center z-50 h-[calc(80px+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 w-full"
        )}>
            {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex flex-1 flex-col items-center gap-0.5 transition-all duration-300 relative p-1 rounded-xl",
                            isActive ? "text-primary -translate-y-1" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <item.icon
                            className={cn("w-6 h-6 transition-all", isActive && "fill-orange-100")}
                            strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className={cn("text-[10px] font-bold tracking-tight", isActive ? "opacity-100" : "opacity-80")}>
                            {item.label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
