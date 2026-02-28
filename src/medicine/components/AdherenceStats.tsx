import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { format, subDays, isSameDay } from 'date-fns'
import type { AdherenceDay } from '../store/medicineStore'

interface AdherenceStatsProps {
    history: AdherenceDay[]
    streak: number
}

export const AdherenceStats: React.FC<AdherenceStatsProps> = ({ history, streak }) => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayData = history.find(h => h.date === dateStr)
        return {
            date: dateStr,
            label: format(date, 'EEE'),
            percentage: dayData ? (dayData.totalDoses > 0 ? (dayData.takenDoses / dayData.totalDoses) * 100 : 0) : 0,
            full: dayData && dayData.totalDoses > 0 && dayData.takenDoses === dayData.totalDoses
        }
    })

    const averageAdherence = Math.round(
        last7Days.reduce((acc, day) => acc + day.percentage, 0) / 7
    )

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-950/5 border-indigo-100/50 dark:border-indigo-900/20 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Adherence</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{averageAdherence}%</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">Past 7 Days</div>
                </div>

                <div className="glass p-5 rounded-[2rem] bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-100/50 dark:border-emerald-900/20 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Streak</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{streak} Days</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">Consistency</div>
                </div>
            </div>

            <div className="glass p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    Weekly Progress
                </h3>

                <div className="flex justify-between items-end h-32 px-2">
                    {last7Days.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full px-2">
                                <div className="relative w-full h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex flex-col justify-end overflow-hidden p-0.5">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${day.percentage}%` }}
                                        className={cn(
                                            "w-full rounded-full transition-colors",
                                            day.full ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-indigo-300 dark:bg-indigo-700"
                                        )}
                                    />
                                    {day.percentage > 0 && (
                                        <div className="absolute top-0 inset-x-0 flex justify-center py-2">
                                            <span className="text-[8px] font-black text-slate-400">{Math.round(day.percentage)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-tighter",
                                isSameDay(new Date(day.date), new Date()) ? "text-indigo-500" : "text-slate-400"
                            )}>
                                {day.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass p-5 rounded-[2rem] bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-300">You're on track this week!</div>
                        </div>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2 h-2 bg-emerald-500 rounded-full"
                    />
                </div>
            </div>
        </div>
    )
}
