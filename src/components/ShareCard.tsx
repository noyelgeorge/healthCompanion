import React from 'react'
import { Brain, Flame, Utensils, Award } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface ShareCardProps {
    userName: string
    avgCalories: number
    streak: number
    topMeals: string[]
    goal: string
}

export const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(({
    userName,
    avgCalories,
    streak,
    topMeals,
    goal
}, ref) => {
    const weekStart = format(startOfWeek(new Date()), 'MMM d')
    const weekEnd = format(endOfWeek(new Date()), 'MMM d')

    return (
        <div
            ref={ref}
            className="w-[1080px] h-[1080px] bg-slate-950 flex flex-col p-20 relative overflow-hidden font-sans text-white border-[24px] border-slate-900"
        >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px]"></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-24 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-2xl">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">Health Companion</h1>
                        <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.3em]">Weekly performance summary</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">{weekStart} — {weekEnd}</div>
                    <div className="text-4xl font-black text-orange-500 uppercase tracking-tight">{userName}</div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-12 mb-20 relative z-10">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[4rem] p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-orange-500/20 rounded-2xl">
                            <Flame size={48} className="text-orange-500" />
                        </div>
                        <span className="text-2xl font-black text-slate-400 uppercase tracking-widest">Avg Calories</span>
                    </div>
                    <div className="text-[120px] font-black leading-none">{Math.round(avgCalories)} <span className="text-4xl text-slate-400">kcal/day</span></div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-[4rem] p-12 flex flex-col justify-center text-center">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <Award size={48} className="text-indigo-500" />
                        </div>
                        <span className="text-2xl font-black text-slate-400 uppercase tracking-widest">Current Streak</span>
                    </div>
                    <div className="text-[120px] font-black leading-none text-indigo-400">{streak} <span className="text-4xl text-slate-400">Days</span></div>
                </div>
            </div>

            {/* Top Meals */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-[4rem] p-16 flex-1 relative z-10">
                <div className="flex items-center gap-6 mb-12">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl">
                        <Utensils size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-widest">Top Rated Meals</h3>
                </div>

                <div className="space-y-8">
                    {topMeals.length > 0 ? topMeals.map((meal, idx) => (
                        <div key={idx} className="flex items-center gap-8 py-4 border-b border-slate-800/50">
                            <span className="text-4xl font-black text-slate-600">0{idx + 1}</span>
                            <span className="text-5xl font-black tracking-tight">{meal}</span>
                        </div>
                    )) : (
                        <div className="text-4xl font-bold text-slate-500 italic">No meals logged this week yet.</div>
                    )}
                </div>
            </div>

            {/* Footer / Motivation */}
            <div className="mt-24 flex items-center justify-between border-t border-slate-800 pt-16 relative z-10">
                <div className="flex items-center gap-6">
                    <Brain className="text-orange-500" size={56} />
                    <div>
                        <div className="text-2xl font-black uppercase text-slate-400">AI Wellness Status</div>
                        <div className="text-4xl font-black text-white">Elite Optimizer</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black uppercase text-slate-600 tracking-widest">Goal Focus</div>
                    <div className="text-4xl font-black text-indigo-400 uppercase tracking-tight">{goal}</div>
                </div>
            </div>

            {/* Grain Overlay - removed external URL to avoid CORS issue with html2canvas */}
        </div>
    )
})

ShareCard.displayName = "ShareCard"
