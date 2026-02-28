import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Edit2, AlertCircle, Plus, Trash2, Loader2, ChevronDown, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ScannedMedicine, MedicineOverview } from '../medicine'
import { fetchMedicineOverview } from '../medicine'

interface ScanReviewTabProps {
    results: ScannedMedicine[]
    onConfirm: (med: ScannedMedicine) => void
    onDiscard: (index: number) => void
}

// Per-card detail state
interface CardDetail {
    loading: boolean
    data: MedicineOverview | null
    error: string | null
    confirmed: boolean
}

// Manual form state
const emptyForm = () => ({
    name: '',
    notes: '',
    time: '09:00',
    totalPills: '',
    // dosage is stored in notes field
})

export const ScanReviewTab = ({ results, onConfirm, onDiscard }: ScanReviewTabProps) => {
    // Fix 1: local copy of results so mutations trigger re-renders
    const [localResults, setLocalResults] = useState<ScannedMedicine[]>(results)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editName, setEditName] = useState('')

    // Fix 4: per-card detail state
    const [cardDetails, setCardDetails] = useState<Record<number, CardDetail>>({})

    // Fix 3: manual entry
    const [showManualForm, setShowManualForm] = useState(false)
    const [manualForm, setManualForm] = useState(emptyForm())
    const [manualSubmitting, setManualSubmitting] = useState(false)

    // Keep local results in sync when parent results change (e.g. after scan)
    useEffect(() => {
        setLocalResults(results)
        setCardDetails({})
    }, [results])

    // Fix 1: update local results without mutating props
    const updateLocalName = (idx: number, name: string) => {
        setLocalResults(prev => prev.map((m, i) => i === idx ? { ...m, name } : m))
    }

    const selectAlternative = (idx: number, alt: string) => {
        setLocalResults(prev => prev.map((m, i) => i === idx ? { ...m, name: alt } : m))
    }

    // Fix 4: fetch AI medicine detail
    const handlePreviewMedicine = async (idx: number, name: string) => {
        setCardDetails(prev => ({ ...prev, [idx]: { loading: true, data: null, error: null, confirmed: false } }))
        try {
            const overview = await fetchMedicineOverview(name)
            setCardDetails(prev => ({ ...prev, [idx]: { loading: false, data: overview, error: null, confirmed: false } }))
        } catch {
            setCardDetails(prev => ({ ...prev, [idx]: { loading: false, data: null, error: 'AI overview unavailable.', confirmed: false } }))
        }
    }

    const handleConfirmCard = (idx: number) => {
        const med = localResults[idx]
        // Mark as confirmed, then fire onConfirm
        setCardDetails(prev => ({ ...prev, [idx]: { ...prev[idx], confirmed: true } }))
        onConfirm(med)
    }

    // Fix 3: manual form submit
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualForm.name.trim()) return
        setManualSubmitting(true)
        const med: ScannedMedicine = {
            name: manualForm.name.trim(),
            notes: manualForm.notes.trim() || undefined,
            time: manualForm.time || '09:00',
            confidence: 'high',
            alternatives: [],
            quantity: manualForm.totalPills ? parseInt(manualForm.totalPills, 10) : undefined,
        }
        onConfirm(med)
        setManualForm(emptyForm())
        setShowManualForm(false)
        setManualSubmitting(false)
    }

    return (
        <div className="space-y-4">
            {/* Fix 3: Persistent manual entry button & inline form at the top */}
            <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Review Pending</h2>
                <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-[1rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all"
                >
                    <Plus size={14} /> Add Manually
                </button>
            </div>

            <AnimatePresence>
                {showManualForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleManualSubmit}
                        className="glass p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4 overflow-hidden mb-6"
                    >
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Add Medicine Manually</h3>

                        <div className="grid gap-3">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Medicine Name *</label>
                                <input
                                    required
                                    value={manualForm.name}
                                    onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Amoxicillin 500mg"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule Time</label>
                                    <input
                                        type="time"
                                        value={manualForm.time}
                                        onChange={e => setManualForm(p => ({ ...p, time: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pills</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={manualForm.totalPills}
                                        onChange={e => setManualForm(p => ({ ...p, totalPills: e.target.value }))}
                                        placeholder="e.g. 30"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dosage / Notes</label>
                                <input
                                    value={manualForm.notes}
                                    onChange={e => setManualForm(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="e.g. 1 tab after food"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => { setShowManualForm(false); setManualForm(emptyForm()) }}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={manualSubmitting}
                                className="flex-1 py-3 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {manualSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Add to Schedule
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Empty state when no scans return */}
            {localResults.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                        <Check size={32} />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No pending scans to review</p>
                </div>
            )}


            <AnimatePresence>
                {localResults.map((med, idx) => {
                    const detail = cardDetails[idx]
                    const hasDetail = detail?.data != null
                    const isLoading = detail?.loading === true
                    const hasError = !!detail?.error

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={cn(
                                "glass p-5 rounded-[2rem] border-l-4 transition-all duration-300",
                                med.confidence === 'high'
                                    ? "border-l-indigo-500 bg-indigo-50/10 dark:bg-indigo-500/10"
                                    : "border-l-amber-500 bg-amber-50/10 dark:bg-amber-500/10"
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
                                        {/* Fix 1: edit reads/writes to localResults via state */}
                                        {editingIndex === idx ? (
                                            <input
                                                autoFocus
                                                className="bg-transparent border-b border-indigo-500 font-black text-slate-800 dark:text-white focus:outline-none"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onBlur={() => {
                                                    if (editName.trim()) updateLocalName(idx, editName.trim())
                                                    setEditingIndex(null)
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (editName.trim()) updateLocalName(idx, editName.trim())
                                                        setEditingIndex(null)
                                                    }
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

                            {/* Fix 5: show quantity info if available */}
                            {med.quantity != null && (
                                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-3 px-1">
                                    📦 {med.quantity} pills prescribed
                                    {med.frequencyPerDay ? ` · ${med.frequencyPerDay}×/day` : ''}
                                </p>
                            )}

                            {/* Fix 1: clicking alternative updates local state immediately */}
                            {med.confidence === 'low' && med.alternatives.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Suggested Alternatives</label>
                                    <div className="flex flex-wrap gap-2">
                                        {med.alternatives.map((alt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectAlternative(idx, alt)}
                                                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                                            >
                                                {alt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fix 4: AI detail preview section */}
                            <AnimatePresence>
                                {hasDetail && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3 overflow-hidden"
                                    >
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">AI Medicine Overview</p>
                                        {[
                                            { label: '🧬 Ingredients', value: detail.data!.ingredients },
                                            { label: '🎯 Purpose', value: detail.data!.purpose },
                                            { label: '⚠️ Precautions', value: detail.data!.precautions },
                                            { label: '💊 Side Effects', value: detail.data!.sideEffects },
                                        ].map(row => (
                                            <div key={row.label}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{row.label}</p>
                                                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{row.value}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Fix 4: error fallback */}
                            {hasError && !hasDetail && (
                                <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">AI overview unavailable. You can still add this medicine.</p>
                                </div>
                            )}

                            {/* Fix 4: two-step confirm flow */}
                            {hasDetail || hasError ? (
                                <button
                                    onClick={() => handleConfirmCard(idx)}
                                    className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <Check size={14} /> Confirm & Add
                                </button>
                            ) : (
                                <button
                                    onClick={() => handlePreviewMedicine(idx, med.name)}
                                    disabled={isLoading}
                                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                                >
                                    {isLoading
                                        ? <><Loader2 size={14} className="animate-spin" /> Fetching Info…</>
                                        : <><ChevronDown size={14} /> Preview & Add</>
                                    }
                                </button>
                            )}
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
