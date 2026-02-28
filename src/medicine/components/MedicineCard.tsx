import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pill, Clock, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MedicineCardProps {
    name: string
    schedule: string
    remainingPills: number
    totalPills: number
    notes?: string
    isTaken: boolean
    onTake: () => void
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
    name,
    schedule,
    remainingPills,
    totalPills,
    notes,
    isTaken,
    onTake
}) => {
    // Generate pill grid (up to 20 for display)
    const displayPills = Math.min(remainingPills, 20)
    const pillIcons = Array.from({ length: displayPills }).map((_, i) => (
        <motion.div
            key={i}
            layout
            exit={{ scale: 0, opacity: 0 }}
            className="w-2 h-4 bg-rose-400/30 dark:bg-rose-500/20 rounded-full border border-rose-400/50"
        />
    ))

    return (
        <motion.div
            layout
            className={cn(
                "glass p-5 rounded-[2rem] border-slate-100 dark:border-slate-800 transition-all duration-300",
                isTaken ? "opacity-60 bg-emerald-50/10 dark:bg-emerald-950/5" : "hover:scale-[1.02] active:scale-95"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                        isTaken ? "bg-emerald-500 text-white" : "bg-rose-100 dark:bg-rose-950/30 text-rose-500"
                    )}>
                        {isTaken ? <Check size={24} /> : <Pill size={24} />}
                    </div>
                    <div>
                        <h3 className={cn("font-black text-slate-800 dark:text-white text-lg leading-tight", isTaken && "line-through")}>{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{schedule}</span>
                            {notes && <span className="text-[10px] text-slate-400 italic">• {notes}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        <span>Stock: {remainingPills} pills</span>
                        <span>{Math.round((remainingPills / totalPills) * 100)}% Left</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        <AnimatePresence>
                            {pillIcons}
                        </AnimatePresence>
                        {remainingPills > 20 && (
                            <div className="text-[10px] font-black text-slate-300 self-end mb-0.5 ml-1">
                                +{remainingPills - 20}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={onTake}
                    disabled={isTaken}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95",
                        isTaken
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                            : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20"
                    )}
                >
                    {isTaken ? "Taken Today" : "Take Now"}
                </button>
            </div>
        </motion.div>
    )
}
