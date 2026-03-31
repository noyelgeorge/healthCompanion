import React from 'react'
import { motion } from 'framer-motion'

interface ProgressCardProps {
    streak: number
    total: number
    taken: number
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ streak, total, taken }) => {
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0

    return (
        <div className="glass p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-100/50 dark:border-indigo-900/20 shadow-xl space-y-4">
            <div className="flex justify-between items-end px-1">
                <span className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-tight">Today's doses</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{taken} of {total}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                />
            </div>
            <div className="text-xs text-slate-500 font-medium px-1">
                {streak > 0
                    ? `🔥 ${streak}-day streak · keep it up!`
                    : "Take your first dose to start your streak"}
            </div>
        </div>
    )
}
