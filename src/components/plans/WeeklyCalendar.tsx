import { addDays, format } from "date-fns"
import { cn } from "../../lib/utils"

export function WeeklyCalendar({ selectedDate, onSelect }: { selectedDate: string, onSelect: (d: string) => void }) {
    const today = new Date()
    // Show today + next 6 days
    const days = Array.from({ length: 7 }).map((_, i) => addDays(today, i))

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isSelected = dateStr === selectedDate
                const isToday = dateStr === format(today, 'yyyy-MM-dd')

                return (
                    <button
                        key={dateStr}
                        onClick={() => onSelect(dateStr)}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-2xl border transition-all flex-shrink-0",
                            isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                        )}
                    >
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isSelected ? "text-blue-100" : "text-slate-400")}>
                            {isToday ? 'Today' : format(day, 'EEE')}
                        </span>
                        <span className={cn("text-xl font-bold font-sans", isSelected ? "text-white" : "text-slate-700")}>
                            {format(day, 'd')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
