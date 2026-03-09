import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getExerciseSuggestions, type ExerciseSuggestion } from '../lib/ai'
import {
    Dumbbell, Footprints, Bike, Activity, RefreshCw,
    Loader2, Clock, Flame, Zap, Moon, Sun
} from 'lucide-react'
import { cn } from '../lib/utils'
import { toast } from 'sonner'

const TYPE_ICONS: Record<string, React.ReactNode> = {
    walk: <Footprints size={22} />,
    run: <Activity size={22} />,
    bike: <Bike size={22} />,
    strength: <Dumbbell size={22} />,
    yoga: <Activity size={22} className="rotate-45" />,
    other: <Activity size={22} />,
}

const TYPE_COLORS: Record<string, string> = {
    walk: 'bg-emerald-500',
    run: 'bg-orange-500',
    bike: 'bg-cyan-500',
    strength: 'bg-indigo-500',
    yoga: 'bg-purple-500',
    other: 'bg-slate-500',
}

const INTENSITY_BADGE: Record<string, string> = {
    low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    moderate: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
}

export default function Workout() {
    const user = useAppStore(state => state.user)
    const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [lastFetched, setLastFetched] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)

    const fetchSuggestions = async (force = false) => {
        // Cache for 4 hours — suggestions don't need to refresh constantly
        const FOUR_HOURS = 4 * 60 * 60 * 1000
        if (!force && suggestions.length > 0 &&
            Date.now() - lastFetched < FOUR_HOURS) return

        setIsLoading(true)
        setError(null)
        try {
            const results = await getExerciseSuggestions(user)
            setSuggestions(results)
            setLastFetched(Date.now())
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load suggestions'
            setError(msg)
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSuggestions()
    }, [])

    const activityLabel: Record<string, string> = {
        sedentary: 'Sedentary',
        light: 'Lightly Active',
        moderate: 'Moderately Active',
        active: 'Very Active',
        athlete: 'Athlete',
    }

    const goalLabel: Record<string, string> = {
        lose: 'Weight Loss',
        gain: 'Muscle Gain',
        maintain: 'Maintenance',
    }

    return (
        <div className="space-y-8 pb-24">
            {/* Background blobs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 
                            bg-emerald-500/10 rounded-full blur-3xl 
                            -z-10 animate-blob" />
            <div className="absolute top-1/2 -left-20 w-80 h-80 
                            bg-indigo-500/5 rounded-full blur-3xl 
                            -z-10 animate-blob animation-delay-4000" />

            {/* Header */}
            <header className="flex justify-between items-start px-1 pt-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 
                                   dark:text-white uppercase tracking-tight">
                        Exercise Guide
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 
                                  uppercase tracking-widest">
                        AI suggestions for your profile
                    </p>
                </div>
                <button
                    onClick={() => fetchSuggestions(true)}
                    disabled={isLoading}
                    className="h-10 px-4 glass rounded-2xl flex items-center 
                               gap-2 text-[10px] font-black uppercase 
                               tracking-widest text-slate-500 
                               dark:text-slate-400 hover:text-orange-500 
                               transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14}
                        className={cn(isLoading && 'animate-spin')} />
                    Refresh
                </button>
            </header>

            {/* Profile context pill */}
            <div className="flex items-center gap-2 flex-wrap px-1">
                <div className="px-3 py-1.5 glass rounded-xl flex 
                                items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-[10px] font-black uppercase 
                                     tracking-widest text-slate-600 
                                     dark:text-slate-400">
                        {goalLabel[user.goal] || 'General Fitness'}
                    </span>
                </div>
                <div className="px-3 py-1.5 glass rounded-xl flex 
                                items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase 
                                     tracking-widest text-slate-600 
                                     dark:text-slate-400">
                        {activityLabel[user.activityLevel] || 'Moderate'}
                    </span>
                </div>
                <div className="px-3 py-1.5 glass rounded-xl flex 
                                items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase 
                                     tracking-widest text-slate-600 
                                     dark:text-slate-400">
                        {user.weight}kg
                    </span>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center 
                                py-24 gap-4">
                    <Loader2 size={36}
                        className="animate-spin text-orange-500" />
                    <p className="text-[10px] font-black uppercase 
                                  tracking-widest text-slate-400 
                                  animate-pulse">
                        Building your plan...
                    </p>
                </div>
            ) : error ? (
                <div className="glass p-8 rounded-[2.5rem] text-center 
                                space-y-4">
                    <p className="text-sm font-bold text-slate-400">{error}</p>
                    <p className="text-[10px] text-slate-500 font-bold 
                                  uppercase tracking-widest">
                        Add your Gemini API key in Profile → AI Settings
                    </p>
                    <button
                        onClick={() => fetchSuggestions(true)}
                        className="px-6 py-3 bg-orange-500 text-white 
                                   rounded-2xl text-[10px] font-black 
                                   uppercase tracking-widest"
                    >
                        Try Again
                    </button>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="glass p-12 rounded-[2.5rem] text-center 
                                space-y-3 border-dashed border-2 
                                border-slate-100 dark:border-slate-800">
                    <Dumbbell size={36}
                        className="mx-auto text-slate-300 
                                         dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-400">
                        No suggestions yet
                    </p>
                    <p className="text-[10px] font-black uppercase 
                                  tracking-widest text-slate-500">
                        Complete your profile to get started
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="glass rounded-[2rem] p-5 
                                       hover:scale-[1.01] 
                                       active:scale-[0.99] 
                                       transition-all duration-200 
                                       space-y-4"
                        >
                            {/* Top row */}
                            <div className="flex items-start 
                                            justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        'w-12 h-12 rounded-2xl flex items-center',
                                        'justify-center text-white shadow-lg',
                                        TYPE_COLORS[s.type] || 'bg-slate-500'
                                    )}>
                                        {TYPE_ICONS[s.type]}
                                    </div>
                                    <div>
                                        <h3 className="font-black 
                                                        text-slate-800 
                                                        dark:text-white 
                                                        text-base 
                                                        leading-tight">
                                            {s.name}
                                        </h3>
                                        <div className={cn(
                                            'mt-1 px-2 py-0.5 rounded-full',
                                            'text-[9px] font-black uppercase',
                                            'tracking-widest border inline-flex',
                                            INTENSITY_BADGE[s.intensity]
                                        )}>
                                            {s.intensity} intensity
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-xl font-black 
                                                    text-slate-800 
                                                    dark:text-white">
                                        ~{s.caloriesBurned}
                                    </div>
                                    <div className="text-[9px] font-black 
                                                    text-slate-400 uppercase 
                                                    tracking-widest">
                                        kcal
                                    </div>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 
                                                px-3 py-1.5 
                                                bg-slate-50 
                                                dark:bg-slate-800/50 
                                                rounded-xl">
                                    <Clock size={12}
                                        className="text-slate-400" />
                                    <span className="text-[10px] font-black 
                                                     text-slate-600 
                                                     dark:text-slate-400">
                                        {s.duration} min
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 
                                                px-3 py-1.5 
                                                bg-slate-50 
                                                dark:bg-slate-800/50 
                                                rounded-xl">
                                    {s.bestTime.toLowerCase()
                                        .includes('morning')
                                        ? <Sun size={12}
                                            className="text-amber-500" />
                                        : <Moon size={12}
                                            className="text-indigo-400" />
                                    }
                                    <span className="text-[10px] font-black 
                                                     text-slate-600 
                                                     dark:text-slate-400">
                                        {s.bestTime}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 
                                                px-3 py-1.5 
                                                bg-slate-50 
                                                dark:bg-slate-800/50 
                                                rounded-xl">
                                    <Flame size={12}
                                        className="text-orange-500" />
                                    <span className="text-[10px] font-black 
                                                     text-slate-600 
                                                     dark:text-slate-400 
                                                     capitalize">
                                        {s.type}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-[11px] text-slate-500 
                                          dark:text-slate-400 font-medium 
                                          leading-relaxed px-1 italic">
                                {s.description}
                            </p>
                        </div>
                    ))}

                    {/* Footer note */}
                    <div className="flex items-center gap-2 px-2 pt-2">
                        <Zap size={12} className="text-orange-500 shrink-0" />
                        <p className="text-[10px] text-slate-400 font-bold 
                                      uppercase tracking-widest">
                            Suggestions refresh when your profile changes
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
