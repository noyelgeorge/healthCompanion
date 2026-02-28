import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { MedicineBadge } from '../store/medicineStore'

interface BadgesListProps {
    badges: MedicineBadge[]
}

export const BadgesList = ({ badges }: BadgesListProps) => {
    return (
        <div className="glass p-6 rounded-[2.5rem] bg-indigo-50/10 dark:bg-indigo-950/5 border-indigo-100/50 dark:border-indigo-900/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Trophy size={20} />
                </div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Achievements</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => (
                    <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                            "p-4 rounded-3xl border text-center transition-all duration-300 relative overflow-hidden group",
                            badge.unlockedAt
                                ? "bg-white dark:bg-slate-900 border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                                : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 grayscale opacity-40"
                        )}
                    >
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <div className="font-black text-slate-800 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                            {badge.name}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold leading-tight">
                            {badge.description}
                        </div>

                        {badge.unlockedAt && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-[8px] text-white font-black rounded-full uppercase tracking-tighter shadow-sm animate-bounce">
                                New
                            </div>
                        )}

                        {!badge.unlockedAt && (
                            <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-950/60 backdrop-blur-[1px] invisible group-hover:visible flex items-center justify-center p-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Locked</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
