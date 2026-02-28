import { useState } from "react"
import { QuoteCard, MotivationHeader } from "../components/home/MotivationHeader"
import { Feed } from "../components/social/Feed"
import { CreatePostModal } from "../components/social/CreatePostModal"
import { Plus, Sparkles, Pill, ArrowRight, Droplets, Zap, Minus, ChefHat, Utensils } from "lucide-react"
import { cn } from "../lib/utils"
import { useAppStore } from "../store/useAppStore"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { Camera } from "lucide-react"
import { calculateTDEE } from "../lib/calories"
import type { Post } from "../services/social"

export default function Home() {
    const navigate = useNavigate()
    const [showCreatePost, setShowCreatePost] = useState(false)
    const [isDialOpen, setIsDialOpen] = useState(false)
    const [postToEdit, setPostToEdit] = useState<Post | null>(null)
    const isDesktopView = useAppStore(state => state.isDesktopView)
    const user = useAppStore(state => state.user)
    const streaks = useAppStore(state => state.streaks)
    const updateWaterIntake = useAppStore(state => state.updateWaterIntake)
    const reminders = useAppStore(state => state.reminders)
    const today = format(new Date(), 'yyyy-MM-dd')
    const todaysLog = useAppStore(state => state.logs[today])
    const waterIntake = todaysLog?.waterIntake || 0
    const totalCalories = (todaysLog?.entries || []).reduce((acc, e) => acc + e.calories, 0)
    const calorieTarget = calculateTDEE(user)

    const [feedKey, setFeedKey] = useState<number>(0)

    const handleCreateClick = () => {
        if (!user.isAuthenticated) {
            toast.error("Please login to post recipes")
            return
        }
        setShowCreatePost(true)
    }

    const handleEditPost = (post: Post) => {
        setPostToEdit(post)
    }

    return (
        <div className="page-container bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Soft decorative background blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-200/10 dark:bg-orange-500/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-200/10 dark:bg-rose-500/5 rounded-full blur-[100px] -z-10"></div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Full Width Motivation Header */}
                <MotivationHeader />

                {/* Compact Today summary strip */}
                <Link to="/stats" className="block hover:scale-[1.01] transition-transform active:scale-95 group">
                    <div className="px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2 group-hover:border-orange-500/30 transition-colors">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex flex-wrap gap-x-2 gap-y-1">
                            <span>Today: <span className="font-semibold text-slate-900 dark:text-white">{totalCalories}</span> / {calorieTarget} kcal</span>
                            <span>• Water: <span className="font-semibold text-slate-900 dark:text-white">{waterIntake}</span> / {user.waterGoal} ml</span>
                            <span>• Meds: <span className="font-semibold text-slate-900 dark:text-white">{reminders.length}</span></span>
                            <span>• Streak: <span className="font-semibold text-orange-600 dark:text-orange-400">{streaks.current}</span>d</span>
                        </p>
                        <ArrowRight size={12} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                </Link>

                <div className="grid grid-cols-2 gap-4">
                    {/* Quotes Card - Refactored */}
                    <QuoteCard />

                    {/* Hydration Section - Now in Grid */}
                    <div className="relative overflow-hidden rounded-[2.5rem] p-6 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 -mr-4 -mt-4">
                            <Droplets size={80} />
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Droplets size={20} className="fill-white/20" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90">Hydration</h3>
                                <p className="text-base font-black tabular-nums">
                                    {waterIntake} <span className="text-[10px] opacity-60">/</span> {user.waterGoal}
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Progress (Compact for grid) */}
                        <div className="mt-4 space-y-3">
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (waterIntake / user.waterGoal) * 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateWaterIntake(today, Math.max(0, waterIntake - 250))}
                                    className="flex-1 py-2 bg-white/10 rounded-xl backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center border border-white/10"
                                >
                                    <Minus size={14} />
                                </button>
                                <button
                                    onClick={() => updateWaterIntake(today, waterIntake + 250)}
                                    className="flex-1 py-2 bg-white/10 rounded-xl backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center border border-white/10"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Streaks */}
                    <div className="relative overflow-hidden rounded-[2.5rem] p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between group">
                        <div className="absolute -top-2 -right-2 p-2 opacity-10">
                            <Zap size={80} />
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Zap size={20} className="fill-white/20" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/90">Consistency</h3>
                                <div className="text-2xl font-black tabular-nums">{streaks.current} <span className="text-[10px] opacity-70">Days</span></div>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-center gap-1 mt-4 mx-auto text-[10px] font-black bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md transition-colors uppercase tracking-widest border border-white/10">
                            🔥 Best: {streaks.longest}
                        </div>
                    </div>

                    {/* Medicine CTA */}
                    <Link to="/medicine" className="block h-full group">
                        <div className="h-full relative overflow-hidden rounded-[2.5rem] p-6 bg-gradient-to-br from-rose-500 to-orange-600 dark:from-rose-600 dark:to-orange-700 text-white shadow-xl shadow-rose-500/20 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                            {/* Inner glass layer */}
                            <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]"></div>
                            <div className="absolute -bottom-4 -right-4 p-2 opacity-10">
                                <Pill size={80} />
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Pill size={20} className="fill-white/20" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/90">Medicine</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigate('/medicine?scan=true');
                                            }}
                                            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                                            title="Quick Scan"
                                        >
                                            <Camera size={14} />
                                        </button>
                                        <p className="text-[10px] text-white/70 font-bold uppercase">Schedule</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center justify-center gap-1 mt-4 mx-auto text-[10px] font-black bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md group-hover:bg-white/30 transition-colors uppercase tracking-widest border border-white/10">
                                Manage <ArrowRight size={12} className="ml-1" />
                            </div>
                        </div>
                    </Link>
                </div>


                {/* Feed Section */}
                <div>
                    <div className="flex justify-between items-center mb-6 px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Community Recipes
                            </h2>
                        </div>
                    </div>

                    <Feed key={feedKey} onEditPost={handleEditPost} />
                </div>

                {/* Floating Action Speed Dial */}
                {!postToEdit && !showCreatePost && (
                    <div className={cn(
                        "fixed bottom-24 z-50 transition-all",
                        !isDesktopView ? "left-1/2 -translate-x-1/2 w-full max-w-[430px]" : "right-10 w-auto"
                    )}>
                        <div className="absolute bottom-0 right-6 flex flex-col items-end gap-4">
                            {/* Backdrop for clicking outside */}
                            {isDialOpen && (
                                <div
                                    className={cn(
                                        "fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] -z-10 animate-in fade-in duration-300 transition-all",
                                        !isDesktopView && "left-1/2 -translate-x-1/2 w-full max-w-[430px]"
                                    )}
                                    onClick={() => setIsDialOpen(false)}
                                />
                            )}

                            {/* Action Buttons */}
                            <div className={cn(
                                "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom",
                                isDialOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-50 pointer-events-none"
                            )}>
                                <button
                                    onClick={() => {
                                        handleCreateClick()
                                        setIsDialOpen(false)
                                    }}
                                    className="flex items-center gap-3 group/btn"
                                >
                                    <span className="px-3 py-1.5 glass dark:glass-dark rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-xl opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                        Post Recipe
                                    </span>
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 text-orange-600 rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-100 dark:border-slate-700">
                                        <ChefHat size={20} />
                                    </div>
                                </button>

                                <Link
                                    to="/log"
                                    className="flex items-center gap-3 group/btn"
                                    onClick={() => setIsDialOpen(false)}
                                >
                                    <span className="px-3 py-1.5 glass dark:glass-dark rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-xl opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                        Log Meal
                                    </span>
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-100 dark:border-slate-700">
                                        <Utensils size={20} />
                                    </div>
                                </Link>
                            </div>

                            {/* Main Toggle Button */}
                            <button
                                onClick={() => setIsDialOpen(!isDialOpen)}
                                className={cn(
                                    "w-16 h-16 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white rounded-2xl shadow-2xl shadow-orange-500/50 flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 z-10",
                                    isDialOpen && "shadow-none"
                                )}
                            >
                                <Plus
                                    size={32}
                                    className={cn("transition-transform duration-500", isDialOpen && "rotate-45")}
                                    strokeWidth={2.5}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Create/Edit Post Modal */}
                {(showCreatePost || postToEdit) && (
                    <CreatePostModal
                        postToEdit={postToEdit || undefined}
                        onClose={() => {
                            setShowCreatePost(false)
                            setPostToEdit(null)
                        }}
                        onPostCreated={() => {
                            setFeedKey(prev => prev + 1)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
