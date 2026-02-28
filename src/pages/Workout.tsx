import { useState } from "react"
import { useAppStore } from "../store/useAppStore"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { Plus, Trash2, Trophy, Flame, Timer, BarChart as BarChartIcon, ChevronRight, Dumbbell, Bike, Footprints, Activity } from "lucide-react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { cn } from "../lib/utils"
import { ExerciseModal } from "../components/workout/ExerciseModal"
import { calculateExerciseCalories } from "../lib/calories"
import { toast } from "sonner"

export default function Workout() {
    const [showModal, setShowModal] = useState(false)
    const today = new Date()
    const dateStr = format(today, 'yyyy-MM-dd')

    const exerciseLogs = useAppStore(state => state.exerciseLogs || {})
    const user = useAppStore(state => state.user)
    const addExerciseEntry = useAppStore(state => state.addExerciseEntry)
    const removeExerciseEntry = useAppStore(state => state.removeExerciseEntry)

    const todayLog = exerciseLogs[dateStr]
    const todayEntries = todayLog?.entries || []

    const totalMinutesToday = todayEntries.reduce((acc, e) => acc + e.durationMinutes, 0)
    const totalBurnedToday = todayLog?.entries.reduce((acc, e) => acc + (e.calories || 0), 0) || 0

    // Weekly Chart Data
    const start = startOfWeek(today, { weekStartsOn: 1 })
    const end = endOfWeek(today, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })

    const chartData = days.map(day => {
        const dStr = format(day, 'yyyy-MM-dd')
        const log = exerciseLogs[dStr]
        const mins = (log?.entries || []).reduce((acc, e) => acc + e.durationMinutes, 0)
        return {
            name: format(day, 'EEE'),
            minutes: mins,
            isToday: isSameDay(day, today)
        }
    })

    const getIcon = (type: string) => {
        switch (type) {
            case 'walk': return <Footprints size={18} />
            case 'run': return <Activity size={18} />
            case 'bike': return <Bike size={18} />
            case 'strength': return <Dumbbell size={18} />
            case 'yoga': return <Activity size={18} className="rotate-45" />
            default: return <Activity size={18} />
        }
    }

    return (
        <div className="page-container space-y-8">
            {/* Background Blobs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-blob"></div>
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-blob animation-delay-4000"></div>

            <header className="flex justify-between items-center relative z-10 px-1">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Workout Hub</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance & Recovery</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="h-12 px-6 bg-black dark:bg-black text-white rounded-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20 border-white/20"
                >
                    <Plus size={20} />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Add Activity</span>
                </button>
            </header>

            {/* Daily Summary */}
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="glass-dark p-6 rounded-[2.5rem] relative overflow-hidden border-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Flame size={48} className="text-orange-500" />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calories Burned</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{totalBurnedToday}</span>
                        <span className="text-xs font-bold text-slate-500">kcal</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                        <Trophy size={10} />
                        <span>Daily Target Active</span>
                    </div>
                </div>

                <div className="glass p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Active</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-800 dark:text-white">{totalMinutesToday}</span>
                        <span className="text-xs font-bold text-slate-400">min</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-indigo-500">
                        <Timer size={10} />
                        <span>Heart Rate Zone 2-3</span>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="glass dark:glass-dark rounded-[2.5rem] p-6 border-white/20 dark:border-slate-800/50 shadow-xl relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-500">
                            <BarChartIcon size={14} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Weekly Activity</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Minutes / Day</span>
                </div>

                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="glass-dark px-3 py-2 rounded-xl border-white/10 shadow-2xl">
                                                <p className="text-[10px] font-black text-white">{payload[0].value} MIN</p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="minutes" radius={[6, 6, 6, 6]} barSize={20}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isToday ? '#10b981' : '#6366f1'}
                                        fillOpacity={entry.isToday ? 1 : 0.3}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activities List */}
            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between px-1">
                    <div className="bg-black text-white px-4 py-1.5 rounded-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Activity</h3>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                </div>

                <div className="space-y-3">
                    {todayEntries.length === 0 ? (
                        <div className="glass dark:glass-dark p-8 rounded-[2.5rem] text-center border-dashed border-slate-200 dark:border-slate-800">
                            <Dumbbell className="mx-auto text-slate-200 dark:text-slate-800 mb-3" size={32} />
                            <p className="text-sm font-bold text-slate-400 italic">No activity logged today yet.</p>
                        </div>
                    ) : (
                        todayEntries.map(entry => (
                            <div key={entry.id} className="group glass dark:glass-dark p-4 rounded-3xl border-white/20 dark:border-slate-800/50 flex items-center justify-between hover:scale-[1.02] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500">
                                        {getIcon(entry.type)}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 dark:text-white tracking-tight">{entry.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.durationMinutes} min</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                entry.intensity === 'high' ? "bg-rose-500/10 text-rose-500" :
                                                    entry.intensity === 'moderate' ? "bg-amber-500/10 text-amber-500" :
                                                        "bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {entry.intensity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-black text-slate-800 dark:text-white">{entry.calories || 0}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kcal</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            removeExerciseEntry(dateStr, entry.id)
                                            toast.success("Activity cleared")
                                        }}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <ExerciseModal
                    onClose={() => setShowModal(false)}
                    onSubmit={async (name, type, minutes, intensity) => {
                        const calories = calculateExerciseCalories(type, minutes, user.weight)
                        await addExerciseEntry(dateStr, {
                            name,
                            type,
                            durationMinutes: minutes,
                            intensity,
                            calories
                        })
                        setShowModal(false)
                        toast.success("Great job! Session recorded ⚡")
                    }}
                />
            )}
        </div>
    )
}
