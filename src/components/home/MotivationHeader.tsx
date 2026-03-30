
import { useState } from "react"
import { User, Quote } from "lucide-react"
import { useAppStore } from "../../store/useAppStore"
import { Link } from "react-router-dom"

const QUOTES = [
    "Consistency beats motivation.",
    "Small steps every day.",
    "Progress, not perfection.",
    "Health is an investment.",
    "Do it for your future self.",
    "Eat to nourish, not just to feed.",
    "Your body is your temple."
]

export function MotivationHeader() {
    const user = useAppStore(state => state.user)

    // Get time of day for greeting
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"
    const firstName = user.name?.split(' ')[0] || "Friend"

    return (
        <div className="flex justify-between items-center mb-3 px-1">
            <div className="space-y-0.5">
                <h1 className="text-xl font-black bg-gradient-to-r from-orange-600 to-rose-600 dark:from-orange-400 dark:to-rose-400 bg-clip-text text-transparent tracking-tighter">
                    Health Companion
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                    {greeting}, {firstName}
                </p>
            </div>

            <Link
                to="/profile"
                className="relative group transition-transform duration-300 hover:scale-105"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
                <div className="relative h-9 w-9 rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
                    <User size={16} className="text-slate-600 dark:text-slate-300" />
                </div>
            </Link>
        </div>
    )
}

export function QuoteCard() {
    const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col justify-center transition-all duration-300 hover:bg-white/50 dark:hover:bg-slate-900/50 group h-full">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>

            <div className="relative z-10 space-y-3">
                <Quote size={16} className="text-orange-500/40 fill-current" />
                <h2 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed font-serif italic tracking-tight">
                    "{quote}"
                </h2>
            </div>
        </div>
    )
}

