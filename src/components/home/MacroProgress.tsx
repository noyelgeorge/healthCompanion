import { useAppStore } from "../../store/useAppStore"
import { Card } from "../ui/Card"
import { format } from "date-fns"
import { calculateTDEE } from "../../lib/calories"

export function MacroProgress() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const log = useAppStore(state => state.logs[today])
    const user = useAppStore(state => state.user)

    // Calculate totals
    const totals = (log?.entries || []).reduce((acc, entry) => ({
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat
    }), { protein: 0, carbs: 0, fat: 0 })

    const targetCalories = calculateTDEE(user)

    // 30 / 35 / 35 Split
    const TARGETS = {
        protein: Math.round((targetCalories * 0.3) / 4),
        carbs: Math.round((targetCalories * 0.35) / 4),
        fat: Math.round((targetCalories * 0.35) / 9)
    }

    return (
        <Card>
            <div className="space-y-6">
                <MacroBar label="Protein" current={totals.protein} target={TARGETS.protein} color="bg-emerald-500" />
                <MacroBar label="Carbs" current={totals.carbs} target={TARGETS.carbs} color="bg-amber-500" />
                <MacroBar label="Fat" current={totals.fat} target={TARGETS.fat} color="bg-indigo-500" />
            </div>
        </Card>
    )
}

function MacroBar({ label, current, target, color }: { label: string, current: number, target: number, color: string }) {
    const percent = Math.min(100, Math.round((current / target) * 100))

    return (
        <div>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{percent}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-1 font-medium tracking-wide">
                {current} / {target}g
            </div>
        </div>
    )
}
