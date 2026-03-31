import { useState } from 'react'
import { CalendarDays, Dumbbell } from 'lucide-react'
import { cn } from '../lib/utils'

// Import the full content of both pages as sub-components
import PlansContent from './Plans'
import ExerciseContent from './Workout'

type PlannerTab = 'meals' | 'exercise'

export default function Planner() {
    const [activeTab, setActiveTab] = useState<PlannerTab>('meals')

    return (
        <div className="page-container">
            {/* Internal Tab Switcher */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl gap-1 mx-4 mt-4 mb-0">
                <button
                    onClick={() => setActiveTab('meals')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all",
                        activeTab === 'meals'
                            ? "bg-white dark:bg-slate-800 text-orange-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                >
                    <CalendarDays size={14} /> Meal Plan
                </button>
                <button
                    onClick={() => setActiveTab('exercise')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all",
                        activeTab === 'exercise'
                            ? "bg-white dark:bg-slate-800 text-emerald-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                >
                    <Dumbbell size={14} /> Exercise
                </button>
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'meals' ? 'block' : 'hidden'}>
                <PlansContent />
            </div>
            <div className={activeTab === 'exercise' ? 'block' : 'hidden'}>
                <ExerciseContent />
            </div>
        </div>
    )
}
