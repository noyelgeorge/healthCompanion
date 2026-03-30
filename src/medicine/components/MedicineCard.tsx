import React from 'react'
import { motion } from 'framer-motion'
import { Pill, Clock, Check, Trash2, Pencil } from 'lucide-react'
import { cn } from '../../lib/utils'

// Reminder offset options (Fix 6)
const OFFSET_OPTIONS = [
    { label: 'On time', value: 0 },
    { label: '5 min before', value: 5 },
    { label: '10 min before', value: 10 },
    { label: '15 min before', value: 15 },
]

interface MedicineCardProps {
    name: string
    schedule: string
    remainingPills: number
    totalPills: number
    notes?: string
    isTaken: boolean
    onTake: () => void
    // Fix 6: optional reminder offset
    reminderOffsetMinutes?: number
    onOffsetChange?: (offset: number) => void
    // Fix 1: optional remove from basket
    onRemove?: () => void
    onUpdateStock?: (newTotal: number, newRemaining: number) => void
    onUpdateSchedule?: (newTime: string) => void
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
    name,
    schedule,
    remainingPills,
    totalPills,
    notes,
    isTaken,
    onTake,
    reminderOffsetMinutes = 0,
    onOffsetChange,
    onRemove,
    onUpdateStock,
    onUpdateSchedule
}) => {
    // Local editable state
    const [editingStock, setEditingStock] = React.useState(false)
    const [editingTime, setEditingTime] = React.useState(false)
    const [stockInput, setStockInput] = React.useState(String(remainingPills))
    const [timeInput, setTimeInput] = React.useState(schedule)

    // Fix 5: handle zero-stock state gracefully
    const hasStock = totalPills > 0

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
                        <h3 className={cn("font-black text-slate-800 dark:text-white text-lg leading-tight truncate max-w-[160px]", isTaken && "line-through")} title={name}>{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-slate-400" />
                            {editingTime ? (
                                <input
                                    type="time"
                                    value={timeInput}
                                    autoFocus
                                    onChange={e => setTimeInput(e.target.value)}
                                    onBlur={() => {
                                        onUpdateSchedule?.(timeInput)
                                        setEditingTime(false)
                                    }}
                                    className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 border border-indigo-400 rounded px-1 text-indigo-500 focus:outline-none"
                                />
                            ) : (
                                <button onClick={() => setEditingTime(true)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline underline-offset-2">
                                    {schedule}
                                </button>
                            )}
                            {notes && <span className="text-[10px] text-slate-400 italic">• {notes}</span>}
                        </div>
                    </div>
                </div>
                {onRemove && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Fix 5: stock display — prompt to set if 0 */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {hasStock ? (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <span className="flex items-center gap-2">
                                    {editingStock ? (
                                        <input
                                            type="number"
                                            min={0}
                                            placeholder="Refill stock"
                                            value={stockInput}
                                            autoFocus
                                            onChange={e => setStockInput(e.target.value)}
                                            onBlur={() => {
                                                const newCount = Math.max(0, parseInt(stockInput) || 0)
                                                onUpdateStock?.(newCount, newCount)
                                                setEditingStock(false)
                                            }}
                                            className="w-20 bg-slate-100 dark:bg-slate-800 border border-indigo-400 rounded px-1 text-indigo-500 focus:outline-none"
                                        />
                                    ) : (
                                        <>
                                            Current stock: {remainingPills} pills
                                            <button onClick={() => setEditingStock(true)} className="text-indigo-400 hover:text-indigo-500 transition-colors">
                                                <Pencil size={12} />
                                            </button>
                                        </>
                                    )}
                                </span>
                                <span>{totalPills > 0 ? Math.round((remainingPills / totalPills) * 100) : 0}% Left</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-rose-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.round((remainingPills / totalPills) * 100)}%` }}
                                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                />
                            </div>
                            {remainingPills / totalPills < 0.2 && totalPills > 0 && (
                                <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50">
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Refill soon</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock not set</span>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">Set Stock</span>
                        </div>
                    )}
                </div>

                {/* Fix 6: per-medicine reminder offset selector */}
                {onOffsetChange && (
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remind</span>
                        <select
                            value={reminderOffsetMinutes}
                            onChange={e => onOffsetChange(Number(e.target.value))}
                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-transparent border-none max-w-[120px] truncate focus:outline-none cursor-pointer"
                        >
                            {OFFSET_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}

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
