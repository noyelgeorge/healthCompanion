import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppStore, type UserProfile } from "../store/useAppStore"
import { Button } from "../components/ui/Button"
import { Camera, ChevronRight, Bell, Settings, User as UserIcon, Sun, Moon, Monitor, Check, X, Smartphone } from "lucide-react"
import { calculateTDEE } from "../lib/calories"
import { cn } from "../lib/utils"
import { toast } from "sonner"

export default function Profile() {
    const user = useAppStore(state => state.user)
    const setUser = useAppStore(state => state.setUser)
    const theme = useAppStore(state => state.theme)
    const setTheme = useAppStore(state => state.setTheme)
    const navigate = useNavigate()

    const isDesktopView = useAppStore(state => state.isDesktopView)
    const toggleDesktopView = useAppStore(state => state.toggleDesktopView)
    const logWeight = useAppStore(state => state.logWeight)
    const streaks = useAppStore(state => state.streaks)

    const dailyTarget = calculateTDEE(user)

    const [isEditing, setIsEditing] = useState(false)
    const [isWeightLogging, setIsWeightLogging] = useState(false)
    const [newWeight, setNewWeight] = useState(user.weight)

    const [isUploading, setIsUploading] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to log out?')) {
            const logoutPromise = useAppStore.getState().logout()
            toast.promise(logoutPromise, {
                loading: 'Logging out...',
                success: 'Logged out successfully',
                error: 'Logout failed'
            })
            await logoutPromise
            navigate("/auth", { replace: true })
        }
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formRef.current) return

        const formData = new FormData(formRef.current)
        setUser({
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phoneNumber: formData.get("phoneNumber") as string,
            height: Number(formData.get("height")),
            weight: Number(formData.get("weight")),
            age: Number(formData.get("age")),
            gender: formData.get("gender") as UserProfile['gender'],
            activityLevel: formData.get("activity") as UserProfile['activityLevel'],
            goal: formData.get("goal") as UserProfile['goal']
        })
        setIsEditing(false)
    }




    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')

                    // Profile images can be smaller
                    const MAX_SIZE = 400
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width
                            width = MAX_SIZE
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height
                            height = MAX_SIZE
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    ctx?.drawImage(img, 0, 0, width, height)

                    // Compress to JPEG with 0.7 quality
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
                    resolve(compressedBase64)
                }
                img.onerror = (error) => reject(error)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading("Processing profile picture...")

        try {
            // Compress and get Base64 string
            const base64Image = await compressImage(file)

            // Save to store (which syncs to Firestore)
            await setUser({ photoURL: base64Image })

            toast.success("Profile picture updated!", { id: toastId })
        } catch (error) {
            console.error("Upload failed", error)
            toast.error("Upload failed. Please try again.", { id: toastId })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="page-container space-y-6">
            {/* Background Blob */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/5 dark:bg-orange-400/5 rounded-full blur-3xl -z-10 animate-blob"></div>
            <div className="absolute bottom-20 -left-20 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl -z-10 animate-blob animation-delay-4000"></div>

            <header className="flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-5">
                    <div
                        className="relative h-20 w-20 glass rounded-full flex items-center justify-center text-slate-400 group cursor-pointer overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white">
                                <UserIcon size={40} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white" />
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                                <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                            {user.name}
                        </h1>
                        <div className="flex items-center gap-2">
                            {streaks.current > 0 ? (
                                <div className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-orange-200 dark:border-orange-500/30">
                                    {streaks.current} Day Streak 🔥
                                </div>
                            ) : (
                                <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700">
                                    No streak yet — log today!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setTheme('light')}
                        className={cn(
                            "p-2 rounded-xl transition-all",
                            theme === 'light' ? "bg-white dark:bg-slate-700 text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <Sun size={18} />
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={cn(
                            "p-2 rounded-xl transition-all",
                            theme === 'dark' ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <Moon size={18} />
                    </button>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={toggleDesktopView}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                            isDesktopView ? "bg-white dark:bg-slate-700 text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        {isDesktopView ? <Smartphone size={18} /> : <Monitor size={18} />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">
                            {isDesktopView ? "Desktop" : "Mobile"}
                        </span>
                    </button>
                </div>
            </header>

            {/* Profile Content */}
            <div className="space-y-6">
                {/* Physical Profile Section */}
                <div className="glass p-6 rounded-[2rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Vital Stats</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900/50"
                        >
                            {isEditing ? "Cancel" : "Edit Profile"}
                        </Button>
                    </div>

                    {isEditing ? (
                        <form ref={formRef} onSubmit={handleSave} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Full Name</label>
                                    <input name="name" defaultValue={user.name} className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900 dark:text-slate-100 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Phone Number (for WhatsApp)</label>
                                    <input name="phoneNumber" defaultValue={user.phoneNumber} placeholder="+1234567890" className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900 dark:text-slate-100 font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Weight (kg)</label>
                                        <input name="weight" type="number" step="0.1" defaultValue={user.weight} className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Age</label>
                                        <input name="age" type="number" defaultValue={user.age} className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold text-slate-900 dark:text-slate-100" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Height */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Height (cm)</label>
                                        <input
                                            name="height"
                                            type="number"
                                            defaultValue={user.height}
                                            className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold text-slate-900 dark:text-slate-100"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Gender</label>
                                        <select
                                            name="gender"
                                            defaultValue={user.gender}
                                            className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900 dark:text-slate-100 font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {/* Activity Level */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Activity Level</label>
                                        <select
                                            name="activity"
                                            defaultValue={user.activityLevel}
                                            className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900 dark:text-slate-100 font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="sedentary">Sedentary (little or no exercise)</option>
                                            <option value="light">Light (1–3 days/week)</option>
                                            <option value="moderate">Moderate (3–5 days/week)</option>
                                            <option value="active">Active (6–7 days/week)</option>
                                            <option value="athlete">Athlete (intense daily training)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Health Goal</label>
                                    <select
                                        name="goal"
                                        defaultValue={user.goal}
                                        className="w-full p-3 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900 dark:text-slate-100 font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="lose">Weight Reduction (Lose)</option>
                                        <option value="maintain">Maintain Equilibrium (Balance)</option>
                                        <option value="gain">Gain Muscle (Increase)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daily Calorie Target</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                        Based on your age, weight, height & activity
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-orange-500">{dailyTarget}</div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">kcal / day</div>
                                </div>
                            </div>

                            <Button type="submit" fullWidth className="rounded-2xl h-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-100">Save Vitality</Button>
                        </form>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Weight</div>
                                        {!isWeightLogging && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setNewWeight(user.weight)
                                                    setIsWeightLogging(true)
                                                }}
                                                className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline p-0 h-auto"
                                            >
                                                Log
                                            </Button>
                                        )}
                                    </div>
                                    {isWeightLogging ? (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                                            <input
                                                type="number"
                                                value={newWeight}
                                                onChange={e => setNewWeight(Number(e.target.value))}
                                                className="w-16 p-1.5 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                                step="0.1"
                                                autoFocus
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={async () => {
                                                        await logWeight(newWeight)
                                                        setIsWeightLogging(false)
                                                        toast.success("Weight recorded!", {
                                                            description: `Logged at ${newWeight}kg`
                                                        })
                                                    }}
                                                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-transform"
                                                >
                                                    <Check size={12} />
                                                </button>
                                                <button
                                                    onClick={() => setIsWeightLogging(false)}
                                                    className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg hover:scale-110 transition-transform"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xl font-black text-slate-800 dark:text-white">{user.weight} <span className="text-[10px] text-slate-400">kg</span></div>
                                    )}
                                </div>
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">BMI Index</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">
                                        {user.height > 0 ? (user.weight / ((user.height / 100) ** 2)).toFixed(1) : "—"}
                                    </div>
                                </div>
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Age</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">{user.age} <span className="text-[10px] text-slate-400">yrs</span></div>
                                </div>
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1 capitalize">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Activity</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">{user.activityLevel}</div>
                                </div>
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1 capitalize">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Health Goal</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">{user.goal}</div>
                                </div>
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Height</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">{user.height} <span className="text-[10px] text-slate-400">cm</span></div>
                                </div>
                                <div className="glass bg-white/20 p-4 rounded-2xl space-y-1 capitalize">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gender</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white">{user.gender}</div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daily Calorie Target</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                        Based on your age, weight, height & activity
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-orange-500">{dailyTarget}</div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">kcal / day</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Account & Security Shells */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-6 bg-slate-400 rounded-full"></div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">System & AI</h3>
                    </div>

                    <div className="glass rounded-[2rem] overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
                        {/* Notifications */}
                        <div className="w-full p-5 flex items-center justify-between opacity-50 cursor-not-allowed select-none">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Bell size={22} />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <div className="font-black text-slate-800 dark:text-white leading-tight">Notifications</div>
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700">
                                            Coming Soon
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Alerts & Messaging</div>
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <Link to="/settings" className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                                    <Settings size={22} />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-slate-800 dark:text-white leading-tight">Preferences</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global Settings</div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                        </Link>
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <Button
                        variant="danger"
                        fullWidth
                        className="glass rounded-2xl font-black uppercase tracking-widest text-xs"
                        onClick={handleLogout}
                    >
                        Log Out
                    </Button>

                    <div className="flex flex-col items-center gap-1 opacity-50">
                        <div className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-[0.2em]">Health Companion v2.0</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
