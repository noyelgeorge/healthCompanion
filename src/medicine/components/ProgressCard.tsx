import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Target } from 'lucide-react'

interface ProgressCardProps {
    streak: number
    total: number
    taken: number
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ streak, total, taken }) => {
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0

    return (
        <div className="glass p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-100/50 dark:border-indigo-900/20 shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Flame size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak</div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{streak} Days</div>
                    </div>
                </div>

                <div className="flex gap-4 text-right">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Progress</div>
                        <div className="text-2xl font-black text-indigo-500 leading-none mt-1">{percentage}%</div>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Target size={24} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <span>{taken} of {total} doses taken Today</span>
                    <span>Target: 100%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                </div>
            </div>
        </div>
    )
}
