import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Edit2, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ScannedMedicine } from '../medicine'

interface ScanReviewTabProps {
    results: ScannedMedicine[]
    onConfirm: (med: ScannedMedicine) => void
    onDiscard: (index: number) => void
}

export const ScanReviewTab = ({ results, onConfirm, onDiscard }: ScanReviewTabProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editName, setEditName] = useState('')

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                    <Check size={32} />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No pending scans to review</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {results.map((med, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                            "glass p-5 rounded-[2rem] border-l-4 transition-all duration-300",
                            med.confidence === 'high'
                                ? "border-l-indigo-500 bg-indigo-50/10"
                                : "border-l-amber-500 bg-amber-50/10"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    med.confidence === 'high' ? "bg-indigo-100 text-indigo-500" : "bg-amber-100 text-amber-500"
                                )}>
                                    {med.confidence === 'high' ? <Check size={18} /> : <AlertCircle size={18} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                            {med.confidence === 'high' ? 'Confident Match' : 'Uncertain Match'}
                                        </span>
                                    </div>
                                    {editingIndex === idx ? (
                                        <input
                                            autoFocus
                                            className="bg-transparent border-b border-indigo-500 font-black text-slate-800 dark:text-white focus:outline-none"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => {
                                                results[idx].name = editName || results[idx].name
                                                setEditingIndex(null)
                                            }}
                                        />
                                    ) : (
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg">{med.name}</h3>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingIndex(idx)
                                        setEditName(med.name)
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => onDiscard(idx)}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {med.notes && (
                            <p className="text-[11px] text-slate-500 font-bold italic mb-4 px-1">{med.notes} @ {med.time}</p>
                        )}

                        {med.confidence === 'low' && med.alternatives.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Suggested Alternatives</label>
                                <div className="flex flex-wrap gap-2">
                                    {med.alternatives.map((alt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                results[idx].name = alt
                                                setEditingIndex(null)
                                            }}
                                            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                                        >
                                            {alt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => onConfirm(med)}
                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add to Schedule
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
