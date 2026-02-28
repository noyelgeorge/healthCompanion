import { useState } from "react"
import { Home, PlusCircle, BarChart2, User, LayoutGrid, Calendar, Dumbbell, Pill, Users, X } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "../lib/utils"

export function BottomNav() {
    const location = useLocation()
    const navigate = useNavigate()
    const [showMore, setShowMore] = useState(false)

    const primaryItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: PlusCircle, label: "Log", path: "/log" },
        { icon: BarChart2, label: "Stats", path: "/stats" },
        { icon: User, label: "Profile", path: "/profile" },
    ]

    const secondaryItems = [
        { icon: Calendar, label: "Plans", path: "/plans" },
        { icon: Dumbbell, label: "Workout", path: "/workout" },
        { icon: Pill, label: "Medicine", path: "/medicine" },
        { icon: Users, label: "Community", path: "/social" },
    ]

    const isSecondaryActive = secondaryItems.some(item => location.pathname === item.path)

    return (
        <>
            <nav className={cn(
                "absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 pb-safe pt-2 px-4 flex justify-around items-center z-50 h-[calc(80px+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 w-full"
            )}>
                {primaryItems.map((item) => {
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

                <button
                    onClick={() => setShowMore(true)}
                    className={cn(
                        "flex flex-1 flex-col items-center gap-0.5 transition-all duration-300 relative p-1 rounded-xl",
                        isSecondaryActive ? "text-primary -translate-y-1" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <LayoutGrid
                        className={cn("w-6 h-6 transition-all", isSecondaryActive && "fill-orange-100")}
                        strokeWidth={isSecondaryActive ? 2.5 : 2}
                    />
                    <span className={cn("text-[10px] font-bold tracking-tight", isSecondaryActive ? "opacity-100" : "opacity-80")}>
                        More
                    </span>
                </button>
            </nav>

            {/* More Drawer */}
            {showMore && (
                <>
                    <div
                        className={cn(
                            "absolute inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300 w-full"
                        )}
                        onClick={() => setShowMore(false)}
                    />
                    <div className={cn(
                        "absolute bottom-[calc(96px+env(safe-area-inset-bottom,0px))] z-50 glass-dark rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border border-white/10 transition-all",
                        "left-4 right-4 w-auto mx-auto max-w-[400px]"
                    )}>
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs">More Services</h3>
                            <button
                                onClick={() => setShowMore(false)}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {secondaryItems.map((item) => {
                                const isActive = location.pathname === item.path
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path)
                                            setShowMore(false)
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 border",
                                            isActive
                                                ? "bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-lg shadow-orange-500/10"
                                                : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-xl",
                                            isActive ? "bg-orange-500 text-white" : "bg-white/10 text-slate-400"
                                        )}>
                                            <item.icon size={20} />
                                        </div>
                                        <span className="font-bold text-sm">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
