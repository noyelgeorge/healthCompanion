import { Flame } from "lucide-react"
import { useAppStore } from "../../store/useAppStore"
import { Card } from "../ui/Card"
import { subDays, format } from "date-fns"

export function StreakCard() {
    const logs = useAppStore(state => state.logs)

    const calculateStreak = () => {
        const today = new Date()
        const todayStr = format(today, 'yyyy-MM-dd')
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')

        // Check if today or yesterday has an entry
        if (!logs[todayStr]?.entries.length && !logs[yesterdayStr]?.entries.length) {
            return 0
        }

        let streak = 0
        let checkDay = logs[todayStr]?.entries.length ? today : subDays(today, 1)

        while (true) {
            const dateStr = format(checkDay, 'yyyy-MM-dd')
            if (logs[dateStr]?.entries.length > 0) {
                streak++
                checkDay = subDays(checkDay, 1)
            } else {
                break
            }
        }
        return streak
    }

    const currentStreak = calculateStreak()

    return (
        <Card className="flex items-center gap-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-full text-orange-500 border border-orange-100 dark:border-orange-900/50">
                <Flame size={32} fill="currentColor" strokeWidth={1.5} />
            </div>
            <div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white leading-none mb-1">{currentStreak}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Current Streak</div>
            </div>
            <div className="ml-auto text-right">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Highest Streak</div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{currentStreak} days</div>
            </div>
        </Card>
    )
}
