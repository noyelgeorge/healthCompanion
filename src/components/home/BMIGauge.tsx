import { useAppStore } from "../../store/useAppStore"
import { Card } from "../ui/Card"

export function BMIGauge() {
    const user = useAppStore(state => state.user)
    const bmi = user.height > 0 ? user.weight / ((user.height / 100) ** 2) : 0
    const formattedBMI = bmi > 0 ? bmi.toFixed(1) : "—"

    let status = "Normal"
    let color = "text-emerald-500"

    if (bmi < 18.5) { status = "Underweight"; color = "text-blue-500"; }
    else if (bmi >= 25 && bmi < 30) { status = "Overweight"; color = "text-amber-500"; }
    else if (bmi >= 30) { status = "Obese"; color = "text-red-500"; }

    // Simple Gauge UI (Semi-circle)
    // Mapping 15 -> 0deg, 40 -> 180deg
    const minBMI = 15
    const maxBMI = 40
    const percentage = Math.min(100, Math.max(0, ((bmi - minBMI) / (maxBMI - minBMI)) * 100))

    return (
        <Card className="overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">Current BMI</h3>
            <div className="relative flex flex-col items-center justify-center -mb-6">
                <div className="w-40 h-20 overflow-hidden relative">
                    {/* Gauge Background */}
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-100 dark:bg-slate-800 rounded-t-full"></div>

                    {/* Gauge Gradient (simplified visual) */}
                    <div className="absolute top-0 left-0 w-full h-full rounded-t-full opacity-30"
                        style={{
                            background: 'conic-gradient(from 270deg, #3b82f6 0deg 30deg, #10b981 30deg 110deg, #f59e0b 110deg 150deg, #ef4444 150deg 180deg, transparent 180deg)'
                        }}
                    ></div>

                    {/* Needle */}
                    <div
                        className="absolute bottom-0 left-1/2 w-1 h-20 bg-slate-800 dark:bg-slate-200 origin-bottom rounded-full transition-transform duration-1000 ease-out z-10"
                        style={{ transform: `translateX(-50%) rotate(${(percentage * 1.8) - 90}deg)` }}
                    ></div>

                    {/* Center Dot */}
                    <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-slate-800 dark:bg-slate-200 rounded-full transform -translate-x-1/2 translate-y-1/2 z-20"></div>
                </div>

                <div className={`text-3xl font-bold mt-2 ${color} transition-colors duration-500`}>
                    {formattedBMI}
                </div>
                <div className={`text-sm font-medium ${color} opacity-80 mb-4`}>
                    {status}
                </div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-2">
                <span>Under</span>
                <span>Normal</span>
                <span>Over</span>
            </div>
        </Card>
    )
}
