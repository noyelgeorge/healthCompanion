import { useState } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { type ExerciseType, type ExerciseEntry, useAppStore } from "../../store/useAppStore"

interface ExerciseModalProps {
    onClose: () => void
    onSubmit: (name: string, type: ExerciseType, minutes: number, intensity: ExerciseEntry['intensity']) => void
    initialValues?: {
        name: string
        type: ExerciseType
        minutes: number
        intensity: ExerciseEntry['intensity']
    }
}

export function ExerciseModal({ onClose, onSubmit, initialValues }: ExerciseModalProps) {
    const [exerciseName, setExerciseName] = useState(initialValues?.name || '')
    const [exerciseType, setExerciseType] = useState<ExerciseType>(initialValues?.type || 'walk')
    const [exerciseMinutes, setExerciseMinutes] = useState(initialValues?.minutes || 20)
    const [exerciseIntensity, setExerciseIntensity] = useState<ExerciseEntry['intensity']>(initialValues?.intensity || 'moderate')
    const isDesktopView = useAppStore(state => state.isDesktopView)

    return (
        <div className={cn(
            "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200 transition-all",
            !isDesktopView && "left-1/2 -translate-x-1/2 w-full max-w-[430px]"
        )}>
            <div className="w-full max-w-sm mb-20 sm:mb-0 glass-dark rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-white tracking-tight">Add Movement</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                            Activity Name
                        </label>
                        <input
                            value={exerciseName}
                            onChange={e => setExerciseName(e.target.value)}
                            placeholder="Evening Walk, HIIT, Yoga..."
                            className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                                Type
                            </label>
                            <select
                                value={exerciseType}
                                onChange={e => setExerciseType(e.target.value as ExerciseType)}
                                className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                                <option value="walk">Walk</option>
                                <option value="run">Run</option>
                                <option value="bike">Bike</option>
                                <option value="strength">Strength</option>
                                <option value="yoga">Yoga</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                                Duration (min)
                            </label>
                            <input
                                type="number"
                                min={5}
                                max={300}
                                value={exerciseMinutes}
                                onChange={e => setExerciseMinutes(parseInt(e.target.value || "0", 10))}
                                className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                            Intensity
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['low', 'moderate', 'high'] as const).map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setExerciseIntensity(level)}
                                    className={cn(
                                        "py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                        exerciseIntensity === level
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-emerald-500/40"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        className="flex-1 py-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-transform"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!exerciseName || exerciseMinutes <= 0}
                        className="flex-1 py-3 rounded-2xl bg-emerald-500 disabled:opacity-60 text-white text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-transform"
                        onClick={() => {
                            if (!exerciseName || exerciseMinutes <= 0) return
                            onSubmit(exerciseName, exerciseType, exerciseMinutes, exerciseIntensity)
                        }}
                    >
                        Save Session
                    </button>
                </div>
            </div>
        </div>
    )
}
