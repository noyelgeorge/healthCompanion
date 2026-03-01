import { useState, useEffect, useRef } from "react"
import { useAppStore } from "../store/useAppStore"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, LineChart, Line } from 'recharts'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, subWeeks, subDays } from "date-fns"
import { calculateTDEE, calculateMacroTargets } from "../lib/calories"
import { getAIHealthInsights } from "../lib/ai"
import { Sparkles, Brain, Loader2, Zap, Target, Flame, TrendingUp, Scale, Activity, AlertTriangle, Trophy, Share2, Droplets } from "lucide-react"
import { Button } from "../components/ui/Button"
import { toast } from 'sonner'
import { cn } from "../lib/utils"

export default function Stats() {
    const logs = useAppStore(state => state.logs)
    const exerciseLogs = useAppStore(state => state.exerciseLogs || {})
    const weightHistory = useAppStore(state => state.weightHistory || [])
    const user = useAppStore(state => state.user)
    const streaks = useAppStore(state => state.streaks)
    const [isSharing, setIsSharing] = useState(false)
    const isDesktopView = useAppStore(state => state.isDesktopView)
    const [period, setPeriod] = useState<'thisWeek' | 'lastWeek' | 'last30'>('thisWeek')

    // Weekly Data Logic
    const today = new Date()
    const start = period === 'lastWeek'
        ? startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
        : period === 'last30'
            ? subDays(today, 29)
            : startOfWeek(today, { weekStartsOn: 1 })

    const end = period === 'lastWeek'
        ? endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
        : period === 'last30'
            ? today
            : endOfWeek(today, { weekStartsOn: 1 })

    const days = eachDayOfInterval({ start, end })
    const targetCalories = calculateTDEE(user)

    const data = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const log = logs[dateStr]
        const exLog = exerciseLogs[dateStr]

        const totalEaten = (log?.entries || []).reduce((acc, e) => acc + e.calories, 0)
        const totalBurned = (exLog?.entries || []).reduce((acc, e) => acc + (e.calories || 0), 0)

        return {
            day: format(day, 'EEE'), // Mon, Tue
            calories: totalEaten,
            burned: totalBurned,
            net: totalEaten - totalBurned,
            isToday: isSameDay(day, today),
            fullDate: dateStr
        }
    })

    const daysPassed = days.filter(d => d <= today).length || 1
    const daysLogged = Math.max(1, data.filter(d => new Date(d.fullDate) <= today && d.calories > 0).length)

    const totalCaloriesSoFar = data.filter(d => new Date(d.fullDate) <= today).reduce((acc, d) => acc + d.calories, 0)
    const weeklyAverage = Math.round(totalCaloriesSoFar / daysLogged)

    const totalNetSoFar = data.filter(d => new Date(d.fullDate) <= today).reduce((acc, d) => acc + d.net, 0)
    const netAverage = Math.round(totalNetSoFar / daysLogged)

    // Hydration Data (Moved up for trends)
    const waterByDay = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const intake = logs[dateStr]?.waterIntake || 0
        const isPast = new Date(dateStr) <= today
        return { day: format(day, 'EEE'), intake, isPast, hitGoal: intake >= user.waterGoal }
    })
    const daysHitWaterGoal = waterByDay.filter(d => d.isPast && d.hitGoal).length
    const avgWater = Math.round(
        waterByDay.filter(d => d.isPast && d.intake > 0).reduce((acc, d) => acc + d.intake, 0) /
        Math.max(1, waterByDay.filter(d => d.isPast && d.intake > 0).length)
    )

    // Previous Period Progress for Trends
    const prevStart = period === 'lastWeek'
        ? startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 })
        : period === 'last30'
            ? subDays(today, 59)
            : startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })

    const prevEnd = period === 'lastWeek'
        ? endOfWeek(subWeeks(today, 2), { weekStartsOn: 1 })
        : period === 'last30'
            ? subDays(today, 30)
            : endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })

    const prevDays = eachDayOfInterval({ start: prevStart, end: prevEnd })
    const prevData = prevDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const log = logs[dateStr]
        const cal = (log?.entries || []).reduce((acc, e) => acc + e.calories, 0)
        const prot = (log?.entries || []).reduce((acc, e) => acc + e.protein, 0)
        const water = log?.waterIntake || 0
        return { cal, prot, water, hasLog: cal > 0 }
    })

    const prevDaysLogged = Math.max(1, prevData.filter(d => d.hasLog).length)
    const prevAvgCal = Math.round(prevData.reduce((acc, d) => acc + d.cal, 0) / prevDaysLogged)
    const prevAvgProt = Math.round(prevData.reduce((acc, d) => acc + d.prot, 0) / prevDaysLogged)
    const prevAvgWater = Math.round(prevData.reduce((acc, d) => acc + d.water, 0) / prevDaysLogged)

    // Calculate Weekly Macro Averages
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let macroDaysLogged = 0

    days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const log = logs[dateStr]
        if (log && log.entries.length > 0) {
            macroDaysLogged++
            log.entries.forEach(e => {
                totalProtein += e.protein
                totalCarbs += e.carbs
                totalFat += e.fat
            })
        }
    })

    const avgProtein = Math.round(totalProtein / Math.max(1, macroDaysLogged))
    const avgCarbs = Math.round(totalCarbs / Math.max(1, macroDaysLogged))
    const avgFat = Math.round(totalFat / Math.max(1, macroDaysLogged))

    // Trend Direction Helper
    const getTrend = (current: number, previous: number, lowerIsBetter = false) => {
        if (Math.abs(current - previous) < (previous * 0.05)) return 'stable'
        if (lowerIsBetter) return current < previous ? 'improving' : 'declining'
        return current > previous ? 'improving' : 'declining'
    }

    const calTrend = getTrend(weeklyAverage, prevAvgCal, true)
    const protTrend = getTrend(avgProtein, prevAvgProt)
    const waterTrendDir = getTrend(avgWater, prevAvgWater)

    // Macro targets: shared utility
    const { protein: targetProtein, carbs: targetCarbs, fat: targetFat }
        = calculateMacroTargets(targetCalories)

    const [aiInsights, setAiInsights] = useState<{ wins: string, watchOut: string, focusThisWeek: string } | string | null>(null)
    const [isLoadingAI, setIsLoadingAI] = useState(false)
    const lastFetchedRef = useRef<number>(0)

    useEffect(() => {
        const fetchInsights = async () => {
            const now = Date.now()
            if (aiInsights && (now - lastFetchedRef.current < 60 * 60 * 1000)) {
                return
            }

            setIsLoadingAI(true)
            try {
                const insights = await getAIHealthInsights(data, user)
                setAiInsights(insights)
                lastFetchedRef.current = now
            } catch (e) {
                console.error("Failed to fetch AI insights:", e)
            } finally {
                setIsLoadingAI(false)
            }
        }
        fetchInsights()
    }, [])

    // Today at a Glance
    const todayStr = format(today, 'yyyy-MM-dd')
    const todayLog = logs[todayStr]
    const todayExLog = exerciseLogs[todayStr]
    const todayCalories = (todayLog?.entries || []).reduce((acc, e) => acc + e.calories, 0)
    const todayBurned = (todayExLog?.entries || []).reduce((acc, e) => acc + (e.calories || 0), 0)
    const todayWater = todayLog?.waterIntake || 0
    const todayCalPct = Math.min(100, (todayCalories / targetCalories) * 100)
    const todayWaterPct = Math.min(100, (todayWater / user.waterGoal) * 100)

    // Weight Data Processing
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const weightData = weightHistory
        .filter(entry => new Date(entry.date) >= thirtyDaysAgo)
        .map(entry => ({
            date: format(new Date(entry.date), 'MMM d'),
            weight: entry.weight
        }))


    const generateShareImage = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const isDark = document.documentElement.classList.contains('dark')
            const SIZE = 1080
            const canvas = document.createElement('canvas')
            canvas.width = SIZE
            canvas.height = SIZE
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Canvas not supported'))

            // --- Theme Setup ---
            const colors = isDark ? {
                bg: '#020617',
                card: 'rgba(15, 23, 42, 0.8)',
                border: '#1e293b',
                textPrimary: '#ffffff',
                textSecondary: '#64748b',
                textMuted: '#475569',
                accent1: '#f97316', // Orange
                accent2: '#6366f1', // Indigo
                accent3: '#10b981', // Emerald
                grid: 'rgba(30, 41, 59, 0.3)'
            } : {
                bg: '#f8fafc',
                card: 'rgba(255, 255, 255, 0.9)',
                border: '#e2e8f0',
                textPrimary: '#0f172a',
                textSecondary: '#64748b',
                textMuted: '#94a3b8',
                accent1: '#f97316',
                accent2: '#4f46e5',
                accent3: '#059669',
                grid: 'rgba(226, 232, 240, 0.5)'
            }

            // --- Background & Gradients ---
            ctx.fillStyle = colors.bg
            ctx.fillRect(0, 0, SIZE, SIZE)

            // Dynamic Gradients
            const gr = ctx.createRadialGradient(SIZE, 0, 0, SIZE, 0, 800)
            gr.addColorStop(0, isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)')
            gr.addColorStop(1, 'transparent')
            ctx.fillStyle = gr
            ctx.fillRect(0, 0, SIZE, SIZE)

            const gl = ctx.createRadialGradient(0, SIZE, 0, 0, SIZE, 600)
            gl.addColorStop(0, isDark ? 'rgba(99,102,241,0.1)' : 'rgba(79,70,229,0.05)')
            gl.addColorStop(1, 'transparent')
            ctx.fillStyle = gl
            ctx.fillRect(0, 0, SIZE, SIZE)

            const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')
            const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')

            // --- Header ---
            ctx.font = 'bold 56px system-ui, -apple-system, sans-serif'
            ctx.fillStyle = colors.textPrimary
            ctx.fillText('Health Companion', 80, 110)

            ctx.font = 'bold 22px system-ui, sans-serif'
            ctx.fillStyle = colors.textMuted
            ctx.fillText('WEEKLY PERFORMANCE INSIGHTS', 80, 155)

            ctx.textAlign = 'right'
            ctx.font = 'bold 24px system-ui, sans-serif'
            ctx.fillStyle = colors.textSecondary
            ctx.fillText(`${weekStart} — ${weekEnd}`, SIZE - 80, 110)
            ctx.font = 'bold 42px system-ui, sans-serif'
            ctx.fillStyle = colors.accent1
            ctx.fillText(user.name || 'User', SIZE - 80, 160)
            ctx.textAlign = 'left'

            // --- Stat Cards ---
            const drawCard = (x: number, y: number, w: number, h: number, radius = 40) => {
                ctx.save()
                ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)'
                ctx.shadowBlur = 30
                ctx.shadowOffsetY = 10
                ctx.fillStyle = colors.card
                ctx.strokeStyle = colors.border
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.roundRect(x, y, w, h, radius)
                ctx.fill()
                ctx.stroke()
                ctx.restore()
            }

            // Stats row
            drawCard(80, 220, 440, 240)
            ctx.font = 'bold 20px system-ui, sans-serif'
            ctx.fillStyle = colors.accent1
            ctx.fillText('🔥 AVG CALORIES', 130, 280)
            ctx.font = 'bold 90px system-ui, sans-serif'
            ctx.fillStyle = colors.textPrimary
            ctx.fillText(`${weeklyAverage}`, 130, 380)
            ctx.font = 'bold 24px system-ui, sans-serif'
            ctx.fillStyle = colors.textSecondary
            ctx.fillText('kcal / day', 130, 420)

            drawCard(560, 220, 440, 240)
            ctx.font = 'bold 20px system-ui, sans-serif'
            ctx.fillStyle = colors.accent2
            ctx.fillText('⚡ TOTAL NET', 610, 280)
            const totalNet = data.filter(d => new Date(d.fullDate) <= today).reduce((a, d) => a + d.net, 0)
            ctx.font = 'bold 90px system-ui, sans-serif'
            ctx.fillStyle = totalNet < 0 ? colors.accent3 : colors.accent1
            ctx.fillText(`${totalNet > 0 ? '+' : ''}${totalNet}`, 610, 380)
            ctx.font = 'bold 24px system-ui, sans-serif'
            ctx.fillStyle = colors.textSecondary
            ctx.fillText('kcal trend', 610, 420)

            // --- Graph 1: Daily Intake Bar Chart ---
            drawCard(80, 490, 920, 230)
            ctx.font = 'bold 18px system-ui, sans-serif'
            ctx.fillStyle = colors.textMuted
            ctx.fillText('📅 DAILY INTAKE TREND', 130, 535)

            const barW = 85
            const barMaxH = 100
            const barBaseY = 675
            const barStartX = 155
            const maxCal = Math.max(...data.map(d => d.calories), targetCalories, 1)

            data.forEach((d, i) => {
                const h = Math.max(4, (d.calories / maxCal) * barMaxH)
                const x = barStartX + i * (barW + 22)

                ctx.fillStyle = d.isToday ? colors.accent1 : colors.accent2
                ctx.globalAlpha = d.isToday ? 1 : 0.6
                ctx.beginPath()
                ctx.roundRect(x, barBaseY - h, barW, h, 12)
                ctx.fill()
                ctx.globalAlpha = 1

                ctx.font = 'bold 18px system-ui, sans-serif'
                ctx.fillStyle = d.isToday ? colors.accent1 : colors.textSecondary
                ctx.textAlign = 'center'
                ctx.fillText(d.day, x + barW / 2, barBaseY + 30)
                ctx.textAlign = 'left'
            })

            // --- Graph 2: Net Balance Line Chart (NEW) ---
            drawCard(80, 745, 920, 180)
            ctx.font = 'bold 18px system-ui, sans-serif'
            ctx.fillStyle = colors.textMuted
            ctx.fillText('📈 PERFORMANCE TREK (NET CALORIES)', 130, 790)

            const lineStartX = 155
            const lineEndX = SIZE - 155
            const lineBaseY = 880
            const lineMaxH = 50
            const maxNet = Math.max(...data.map(d => Math.abs(d.net)), 1000)

            // Draw baseline
            ctx.strokeStyle = colors.grid
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(lineStartX, lineBaseY)
            ctx.lineTo(lineEndX, lineBaseY)
            ctx.stroke()

            // Draw Net Trend Line
            ctx.beginPath()
            ctx.strokeStyle = colors.accent3
            ctx.lineWidth = 4
            ctx.lineJoin = 'round'
            data.forEach((d, i) => {
                const x = barStartX + i * (barW + 22) + barW / 2
                const y = lineBaseY - (d.net / maxNet) * lineMaxH
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)

                // Point
                ctx.save()
                ctx.fillStyle = colors.accent3
                ctx.beginPath()
                ctx.arc(x, y, 5, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            })
            ctx.stroke()

            // --- Motivational Quotes Section (NEW) ---
            const quotes = [
                "Your only limit is you. Keep pushing!",
                "Great things never come from comfort zones.",
                "Success is a journey, not a destination.",
                "Focus on progress, not perfection.",
                "Health is the greatest wealth.",
                "Small steps every day lead to big results."
            ]
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

            ctx.font = 'italic bold 24px system-ui, sans-serif'
            ctx.fillStyle = colors.accent1
            ctx.textAlign = 'center'
            ctx.fillText(`"${randomQuote}"`, SIZE / 2, 985)
            ctx.textAlign = 'left'

            // --- Footer ---
            ctx.font = 'bold 18px system-ui, sans-serif'
            ctx.fillStyle = colors.textMuted
            ctx.fillText(`Goal: ${user.goal || 'Stay Healthy'}`, 80, 1045)

            ctx.textAlign = 'right'
            ctx.fillStyle = colors.textMuted
            ctx.font = 'bold 18px system-ui, sans-serif'
            ctx.fillText('PROUDLY TRACKED ON HEALTH COMPANION', SIZE - 80, 1045)
            ctx.textAlign = 'left'

            canvas.toBlob((blob) => {
                if (blob) resolve(blob)
                else reject(new Error('Image generation failed'))
            }, 'image/png', 1.0)
        })
    }

    const handleShare = async () => {
        try {
            setIsSharing(true)
            toast.loading('Generating your weekly summary...')

            const blob = await generateShareImage()
            toast.dismiss()

            const file = new File([blob], 'my-weekly-stats.png', { type: 'image/png' })
            const whatsappText = encodeURIComponent(
                `💪 My Weekly Health Summary!\n\n🔥 Avg Calories: ${weeklyAverage} kcal/day\n📅 Tracked on Health Companion\n\nCheck out my progress! 📊`
            )

            // Mobile — native share sheet (user picks WhatsApp)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'My Weekly Health Stats',
                        text: `💪 Avg ${weeklyAverage} kcal/day this week on Health Companion 📊`
                    })
                    toast.success('Shared! 🎉')
                } catch (err: unknown) {
                    if ((err as Error)?.name !== 'AbortError') throw err
                }
            } else {
                // Desktop — download + open WhatsApp web
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'my-weekly-health-summary.png'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                setTimeout(() => URL.revokeObjectURL(url), 2000)

                toast.success('Image downloaded! Opening WhatsApp... 📱', { duration: 4000 })
                setTimeout(() => window.open(`https://wa.me/?text=${whatsappText}`, '_blank'), 800)
            }
        } catch (e) {
            toast.dismiss()
            console.error('Share failed:', e)
            toast.error('Share failed. Please try again.')
        } finally {
            setIsSharing(false)
        }
    }


    const bmi = user.height > 0 ? Number((user.weight / ((user.height / 100) ** 2)).toFixed(1)) : 0

    let bmiZone = "Normal"
    let bmiColor = "text-emerald-500"
    let bmiBarColor = "bg-emerald-500"
    if (bmi < 18.5) {
        bmiZone = "Underweight"
        bmiColor = "text-blue-500"
        bmiBarColor = "bg-blue-500"
    } else if (bmi >= 25 && bmi < 30) {
        bmiZone = "Overweight"
        bmiColor = "text-amber-500"
        bmiBarColor = "bg-amber-500"
    } else if (bmi >= 30) {
        bmiZone = "Obese"
        bmiColor = "text-rose-500"
        bmiBarColor = "bg-rose-500"
    }

    const bmiPercent = Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100))
    const hasAnyData = daysLogged > 0 || weightHistory.length > 0 || Object.keys(exerciseLogs).length > 0

    if (!hasAnyData) {
        return (
            <div className="flex flex-col items-center justify-center px-6 text-center space-y-6 pt-20">
                <div className="p-6 bg-orange-500/10 rounded-full">
                    <TrendingUp size={48} className="text-orange-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your stats are waiting</h2>
                    <p className="text-sm text-slate-400 font-medium max-w-xs">Start logging your meals and workouts to see your progress come alive here.</p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <a href="/log" className="w-full py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest text-center shadow-lg shadow-orange-500/30">
                        Log Your First Meal
                    </a>
                    <a href="/workout" className="w-full py-3 rounded-2xl border border-white/10 text-slate-300 text-xs font-black uppercase tracking-widest text-center">
                        Log a Workout
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container space-y-6 bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Background Blobs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl -z-10 animate-blob"></div>
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000"></div>

            <header className="pt-8 px-2 space-y-2">
                <div className="flex items-center gap-2.5 text-orange-500 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap size={14} fill="currentColor" className="animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/80">Performance Center</span>
                </div>
                <h1 className="text-4xl font-black text-orange-500 tracking-tight leading-none">
                    Health Metrics
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest pl-1">Weekly progress analysis</p>
            </header>

            {/* Period Selector */}
            <div className="flex gap-2 px-1">
                {(['thisWeek', 'lastWeek', 'last30'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                            "flex-1 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                            period === p
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                                : "bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-500 border border-slate-200 dark:border-white/5 hover:text-orange-500"
                        )}
                    >
                        {p === 'thisWeek' ? 'This Week' : p === 'lastWeek' ? 'Last Week' : '30 Days'}
                    </button>
                ))}
            </div>

            {/* Today at a Glance */}
            <div className="glass dark:glass-dark rounded-[2rem] p-5 border-slate-200 dark:border-slate-800/40">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Today at a Glance</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Calories today */}
                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200 dark:border-white/5 relative overflow-hidden group shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Flame size={12} className="text-orange-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Calories</span>
                        </div>
                        {todayCalories > 0 ? (
                            <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{todayCalories}</div>
                        ) : (
                            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-500 leading-tight">Start logging your meals today.</div>
                        )}
                        <div className="flex justify-between items-end mt-1">
                            <div className="text-[9px] text-slate-600 dark:text-slate-500 font-bold">of {targetCalories} kcal</div>
                            {todayCalories > 0 && <span className="text-[8px] font-black bg-orange-500/20 text-orange-400 px-1 rounded">{Math.round(todayCalPct)}%</span>}
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${todayCalPct}%` }} />
                        </div>
                    </div>
                    {/* Exercise today */}
                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Activity size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Exercise</span>
                        </div>
                        {todayBurned > 0 ? (
                            <>
                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{todayBurned}</div>
                                <div className="text-[9px] text-slate-600 dark:text-slate-500 font-bold">kcal burned</div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-black text-slate-400 dark:text-slate-500">—</div>
                                <div className="text-[10px] text-slate-600 dark:text-slate-500 font-bold">Rest day</div>
                            </>
                        )}
                    </div>
                    {/* Water today */}
                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Droplets size={12} className="text-blue-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Water</span>
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{todayWater}</div>
                        <div className="flex justify-between items-end mt-1">
                            <div className="text-[9px] text-slate-600 dark:text-slate-500 font-bold">of {user.waterGoal} ml</div>
                            {todayWater > 0 && <span className="text-[8px] font-black bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1 rounded">{Math.round(todayWaterPct)}%</span>}
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${todayWaterPct}%` }} />
                        </div>
                    </div>
                    {/* Streak */}
                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Flame size={12} className="text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Streak</span>
                        </div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">{streaks.current} <span className="text-xs text-slate-500">days</span></div>
                        <div className="text-[9px] text-slate-600 dark:text-slate-500 font-bold">Best: {streaks.longest}d</div>
                    </div>
                </div>

            </div>



            {/* AI Health Coach Card (Glassmorphism) */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-purple-600 rounded-[2rem] blur opacity-10 group-hover:opacity-25 transition duration-1000"></div>
                <div className="relative glass-dark dark:glass-dark rounded-[2rem] p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
                        <Brain size={140} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-500 text-white p-2 rounded-xl shadow-lg shadow-orange-500/20">
                                <Sparkles size={18} />
                            </div>
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">AI Health Advisor</h3>
                        </div>
                        {isLoadingAI ? (
                            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold italic">
                                <Loader2 size={16} className="animate-spin text-orange-500" />
                                Processing weekly trends...
                            </div>
                        ) : typeof aiInsights === 'object' && aiInsights !== null ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-500 mt-0.5">
                                        <Trophy size={14} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Weekly Win</div>
                                        <p className="text-xs text-slate-300 font-medium">{aiInsights.wins}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-500 mt-0.5">
                                        <AlertTriangle size={14} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Watch Out</div>
                                        <p className="text-xs text-slate-300 font-medium">{aiInsights.watchOut}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-500 mt-0.5">
                                        <Target size={14} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Weekly Focus</div>
                                        <p className="text-xs text-slate-300 font-medium">{aiInsights.focusThisWeek}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400 italic text-xs font-bold">
                                {typeof aiInsights === 'string' ? aiInsights : "Start logging your meals to unlock your AI health coach."}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Core Body Metrics (Vital Stats) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass dark:glass-dark rounded-[2rem] p-5 flex flex-col justify-between group hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors border-slate-200 dark:border-slate-800/40">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <Scale size={20} className="text-blue-500" />
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Weight</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums group-hover:scale-105 transition-transform origin-left">
                            {user.weight} <span className="text-xs text-slate-500">kg</span>
                        </div>
                    </div>
                </div>

                <div className="glass dark:glass-dark rounded-[2rem] p-5 border-slate-200 dark:border-slate-800/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <Activity size={20} className="text-emerald-500" />
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">BMI Index</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white origin-left mb-2">
                            {bmi}
                        </div>
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden relative border border-white/5">
                                <div className="h-full w-[14%] bg-blue-500/30" />
                                <div className="h-full w-[26%] bg-emerald-500/30" />
                                <div className="h-full w-[20%] bg-amber-500/30" />
                                <div className="h-full w-[40%] bg-rose-500/30" />
                                <div
                                    className={cn("absolute top-0 w-2 h-2 rounded-full border border-white shadow-lg -translate-x-1/2", bmiBarColor)}
                                    style={{ left: `${bmiPercent}%` }}
                                />
                            </div>
                            <div className={cn("text-[10px] font-black uppercase tracking-widest", bmiColor)}>
                                {bmiZone} Range
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Calories Card */}
            <div className="glass dark:glass-dark rounded-[2rem] p-6 border-slate-200 dark:border-slate-800/40 border-l-4 border-l-cyan-500">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl">
                            <Flame size={20} className="text-cyan-500" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Net Calories</h3>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">Eaten minus Burned</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={cn(
                            "text-2xl font-black tabular-nums",
                            netAverage <= targetCalories ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {netAverage} <span className="text-[10px] opacity-60">avg</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Target: {targetCalories}</div>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000",
                            netAverage <= targetCalories ? "bg-emerald-500" : "bg-rose-500"
                        )}
                        style={{ width: `${Math.min(100, (netAverage / targetCalories) * 100)}%` }}
                    />
                </div>
            </div>



            {/* Daily Intake Chart */}
            <div className="glass dark:glass-dark rounded-[2rem] p-6 border-slate-200 dark:border-slate-800/50">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <Flame size={20} className="text-orange-500" />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.15em]">Daily Intake</h3>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Daily Intake Avg</div>
                            {calTrend !== 'stable' && (
                                <div className={cn(
                                    "text-[9px] font-black flex items-center gap-0.5",
                                    calTrend === 'improving' ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {calTrend === 'improving' ? '↓' : '↑'}
                                </div>
                            )}
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{weeklyAverage} <span className="text-[10px] text-orange-500">kcal</span></div>
                    </div>
                </div>

                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }}
                                itemStyle={{ color: '#f97316' }}
                                cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                            />
                            <ReferenceLine y={targetCalories} stroke="#334155" strokeDasharray="5 5" label={{ value: 'GOAL', position: 'right', fill: '#475569', fontSize: 9, fontWeight: 900 }} />
                            <Area
                                type="monotone"
                                dataKey="calories"
                                stroke="#f97316"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorCal)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Nutritional Trends */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={16} className="text-cyan-500" />
                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.2em]">Nutritional Trends</h3>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500")} />
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Improving</span>
                        </div>
                        {protTrend !== 'stable' && (
                            <div className={cn(
                                "text-[9px] font-black flex items-center gap-0.5",
                                protTrend === 'improving' ? "text-emerald-500" : "text-rose-500"
                            )}>
                                Protein {protTrend === 'improving' ? '↑' : '↓'}
                            </div>
                        )}
                    </div>
                </div>
                {macroDaysLogged > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        <StatRow
                            label="Protein"
                            value={avgProtein}
                            target={targetProtein}
                            unit="g"
                            color="bg-emerald-500"
                            shadow="shadow-emerald-500/20"
                            higherIsBetter={true}
                        />
                        <StatRow
                            label="Carbs"
                            value={avgCarbs}
                            target={targetCarbs}
                            unit="g"
                            color="bg-cyan-500"
                            shadow="shadow-cyan-500/20"
                            higherIsBetter={false}
                        />
                        <StatRow
                            label="Fat"
                            value={avgFat}
                            target={targetFat}
                            unit="g"
                            color="bg-orange-500"
                            shadow="shadow-orange-500/20"
                            higherIsBetter={false}
                        />
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold uppercase tracking-widest opacity-50">
                        No nutrition data for this period
                    </div>
                )}
            </div>

            {/* Weight Trend Section */}
            {weightHistory.length >= 2 && (
                <div className="glass dark:glass-dark rounded-[2rem] p-6 border-slate-200 dark:border-slate-800/50">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Scale size={20} className="text-blue-500" />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.15em]">Weight Trend</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] text-slate-500 font-black uppercase mb-0.5 tracking-tighter">Current</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{user.weight} <span className="text-[10px] text-blue-500">kg</span></div>
                        </div>
                    </div>

                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    hide
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }}
                                    activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                                    animationDuration={2000}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Hydration Trend */}
            <div className="glass dark:glass-dark rounded-[2rem] p-6 border-slate-200 dark:border-slate-800/40">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Droplets size={20} className="text-blue-500" />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.2em]">Hydration Trend</h3>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <div className="text-[9px] text-slate-500 font-black uppercase">Avg / day</div>
                            {waterTrendDir !== 'stable' && (
                                <div className={cn(
                                    "text-[9px] font-black flex items-center gap-0.5",
                                    waterTrendDir === 'improving' ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {waterTrendDir === 'improving' ? '↑' : '↓'}
                                </div>
                            )}
                        </div>
                        <div className="text-xl font-black text-blue-400">{avgWater > 0 ? `${avgWater}ml` : '—'}</div>
                    </div>
                </div>
                <div className="flex items-end gap-1.5 h-16 mb-3">
                    {waterByDay.map((d, i) => {
                        const pct = user.waterGoal > 0 ? Math.min(100, (d.intake / user.waterGoal) * 100) : 0
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-slate-800 rounded-sm overflow-hidden" style={{ height: '48px' }}>
                                    <div
                                        className={cn(
                                            "w-full rounded-sm transition-all duration-700 mt-auto",
                                            d.hitGoal ? "bg-blue-500" : "bg-slate-600"
                                        )}
                                        style={{ height: `${d.isPast ? pct : 0}%` }}
                                    />
                                </div>
                                <span className={cn("text-[8px] font-black uppercase", d.hitGoal ? "text-blue-400" : "text-slate-600")}>{d.day[0]}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Goal hit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Below goal</span>
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400">{daysHitWaterGoal}/{daysPassed} days on target</span>
                </div>
            </div>
            {/* Share Button (Fixed at bottom) */}
            <div className={cn(
                "fixed bottom-24 px-6 z-40 transition-all",
                !isDesktopView ? "left-1/2 -translate-x-1/2 w-full max-w-[430px]" : "right-12 w-64"
            )}>
                <Button
                    variant="primary"
                    fullWidth
                    className="h-14 rounded-2xl shadow-2xl bg-gradient-to-r from-orange-500 to-rose-500 font-black uppercase tracking-widest text-xs py-0"
                    onClick={handleShare}
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating Summary...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-center">
                            <Share2 size={18} />
                            Share My Week
                        </div>
                    )}
                </Button>
            </div>
        </div>
    )
}

interface StatRowProps {
    label: string
    value: number
    target: number
    unit: string
    color: string
    higherIsBetter?: boolean
}

function StatRow({ label, value, target, unit, color, shadow, higherIsBetter = false }: StatRowProps & { shadow: string }) {
    const pct = Math.min(100, (value / target) * 100)
    const diff = Math.round(((value - target) / target) * 100)
    const isGood = higherIsBetter ? diff >= -10 : diff <= 10

    return (
        <div className="glass dark:glass-dark rounded-[1.5rem] p-5 relative overflow-hidden group border-slate-200 dark:border-slate-800/50">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] block">{label} Intake</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
                        <span className="text-[10px] font-bold text-slate-500">/ {target}{unit}</span>
                    </div>
                </div>
                <div className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-colors",
                    isGood
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                )}>
                    {diff > 0 ? '+' : ''}{diff}%
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden relative border border-white/5">
                <div
                    className={cn("h-full transition-all duration-1000 shadow-lg", color, shadow)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
