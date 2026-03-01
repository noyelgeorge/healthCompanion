import { useState, useEffect } from "react"
import { ArrowLeft, Key, Download, Activity, Eye, EyeOff, ShieldCheck, ExternalLink } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Link } from "react-router-dom"
import { useAppStore } from "../store/useAppStore"
import { testGeminiKey } from "../lib/ai"
import { format } from "date-fns"
import { toast } from "sonner"
import { db } from "../lib/firebase"
import { getDoc, doc } from "firebase/firestore"
import { cn } from "../lib/utils"

export default function Settings() {
    const [resetting, setResetting] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean | null>(null)

    // API Key States
    const [showApiKey, setShowApiKey] = useState(false)
    const [showUsdaKey, setShowUsdaKey] = useState(false)
    const [isEditingGeminiKey, setIsEditingGeminiKey] = useState(false)
    const [isEditingUsdaKey, setIsEditingUsdaKey] = useState(false)
    const [isTestingKey, setIsTestingKey] = useState(false)
    const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')

    const store = useAppStore()
    const apiKey = useAppStore(state => state.apiKey)
    const setApiKey = useAppStore(state => state.setApiKey)
    const usdaApiKey = useAppStore(state => (state as any).usdaApiKey)
    const setUsdaApiKey = useAppStore(state => (state as any).setUsdaApiKey)

    const lastSyncedAt = useAppStore(state => state.lastSyncedAt)

    const checkFirebase = async () => {
        if (!store.user.isAuthenticated || !store.user.uid) {
            setIsFirebaseConnected(false)
            return
        }
        try {
            await getDoc(doc(db, 'users', store.user.uid!))
            setIsFirebaseConnected(true)
        } catch (e) {
            console.error("Firebase connection check failed:", e)
            setIsFirebaseConnected(false)
        }
    }

    useEffect(() => {
        checkFirebase()
    }, [store.user.isAuthenticated, store.user.uid])

    const handleTestKey = async () => {
        if (!apiKey) {
            toast.error("Please enter an API key first");
            return;
        }
        setIsTestingKey(true);
        setKeyStatus('idle');
        try {
            const isValid = await testGeminiKey(apiKey);
            if (isValid) {
                setKeyStatus('valid');
                toast.success("AI Key Verified!", {
                    description: "Your AI features are now fully enabled and working."
                });
            }
        } catch (error: any) {
            setKeyStatus('invalid');
            toast.error("Key Verification Failed", {
                description: error?.message || "Please check your key and try again."
            });
        } finally {
            setIsTestingKey(false);
        }
    }

    const handleSync = async () => {
        if (!store.user.isAuthenticated) {
            toast.error("Not Authenticated", { description: "Please log in to sync your data." })
            return
        }
        try {
            setSyncing(true)
            await store.syncWithFirestore()
            await checkFirebase()
            toast.success("Database Synced!", { description: "Your local data is now up to date with the cloud." })
        } catch (e) {
            toast.error("Sync Failed", { description: "Could not connect to the cloud. Check your internet." })
        } finally {
            setSyncing(false)
        }
    }

    const handleExport = () => {
        try {
            const data = {
                user: store.user,
                logs: store.logs,
                plans: store.plans,
                exerciseLogs: store.exerciseLogs,
                reminders: store.reminders,
                theme: store.theme,
                lastSyncedAt: store.lastSyncedAt,
                exportedAt: new Date().toISOString()
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const today = format(new Date(), 'yyyy-MM-dd')

            a.href = url
            a.download = `health-companion-export-${today}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success("Data exported successfully! 📂")
        } catch (e) {
            toast.error("Export failed. Please try again.")
        }
    }

    const resetCache = async () => {
        try {
            setResetting(true)
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations()
                for (const r of regs) {
                    await r.unregister()
                }
            }
            if ('caches' in window) {
                const names = await caches.keys()
                await Promise.all(names.map(n => caches.delete(n)))
            }
            localStorage.clear()
            sessionStorage.clear()
        } finally {
            location.reload()
        }
    }

    return (
        <div className="page-container space-y-8">
            {/* Background Blobs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl -z-10 animate-blob"></div>
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-blob animation-delay-4000"></div>

            <div className="flex items-center gap-4 mb-2 relative z-10">
                <Link to="/profile" className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-lg border-white/20">
                    <ArrowLeft size={20} />
                </Link>
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">System Core</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Configuration</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-8 relative z-10">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="w-24 h-24 glass dark:glass-dark text-orange-500 dark:text-orange-400 rounded-full flex items-center justify-center shadow-2xl border-white/40 dark:border-slate-800/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
                        <Key size={32} className="drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-bounce-slight" />
                    </div>
                </div>

                <div className="text-center space-y-2 max-w-xs">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                        Neural API Gateway
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Configure your AI Intelligence for clinical scans and coaching.
                    </p>
                </div>

                <div className="w-full max-w-sm space-y-4 px-4">
                    {/* Gemini API Key Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gemini 2.5 Flash</label>
                            {apiKey && !isEditingGeminiKey && (
                                <button onClick={() => setIsEditingGeminiKey(true)} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Change Key</button>
                            )}
                        </div>

                        {(!apiKey || isEditingGeminiKey) ? (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        placeholder="Enter Gemini API Key..."
                                        className={cn(
                                            "w-full p-4 bg-white/50 dark:bg-slate-950/50 border rounded-2xl focus:outline-none transition-all font-bold text-xs pr-12",
                                            keyStatus === 'valid' ? "border-emerald-500/50 focus:ring-emerald-500/20" :
                                                keyStatus === 'invalid' ? "border-rose-500/50 focus:ring-rose-500/20" :
                                                    "border-slate-100 dark:border-slate-800 focus:ring-indigo-500/30"
                                        )}
                                        value={apiKey || ''}
                                        onChange={(e) => {
                                            setApiKey(e.target.value)
                                            setKeyStatus('idle')
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {apiKey && (
                                    <button
                                        onClick={() => setIsEditingGeminiKey(false)}
                                        className="px-4 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                    >
                                        Done
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-sans tracking-normal">••••••••••••••••</span>
                                        <span className="text-[8px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest">Key Saved Locally</span>
                                    </div>
                                </div>
                                <ShieldCheck size={16} className="text-emerald-500" />
                            </div>
                        )}

                        <div className="pt-1">
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline px-1"
                            >
                                <ExternalLink size={12} />
                                Get your key from Google AI Studio
                            </a>
                        </div>

                        <Button
                            onClick={handleTestKey}
                            disabled={isTestingKey || !apiKey}
                            variant={keyStatus === 'valid' ? 'primary' : keyStatus === 'invalid' ? 'danger' : 'primary'}
                            fullWidth
                            className={cn(
                                "h-12 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all",
                                keyStatus === 'valid' && "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
                                keyStatus === 'invalid' && "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
                                keyStatus === 'idle' && "bg-slate-900 dark:bg-white text-white dark:text-black shadow-slate-900/10"
                            )}
                        >
                            {isTestingKey ? "Verifying..." : keyStatus === 'valid' ? "Verified" : "Verify AI Key"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* USDA API Key Section */}
            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">USDA Food Database</label>
                    {usdaApiKey && !isEditingUsdaKey && (
                        <button onClick={() => setIsEditingUsdaKey(true)} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:underline">Change Key</button>
                    )}
                </div>

                {(!usdaApiKey || isEditingUsdaKey) ? (
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={showUsdaKey ? "text" : "password"}
                                placeholder="Enter USDA API Key..."
                                className="w-full p-4 bg-white/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none transition-all font-bold text-xs pr-12 focus:ring-emerald-500/30"
                                value={usdaApiKey || ''}
                                onChange={(e) => setUsdaApiKey(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowUsdaKey(!showUsdaKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                {showUsdaKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {usdaApiKey && (
                            <button
                                onClick={() => setIsEditingUsdaKey(false)}
                                className="px-4 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                                Done
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-sans tracking-normal">••••••••••••••••</span>
                                <span className="text-[8px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest">Key Saved Locally</span>
                            </div>
                        </div>
                        <ShieldCheck size={16} className="text-emerald-500" />
                    </div>
                )}
            </div>

            <div className="px-4 space-y-4 pt-4">
                <Button
                    onClick={handleExport}
                    variant="ghost"
                    fullWidth
                    className="glass p-5 h-auto rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <Download size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-slate-800 dark:text-white leading-tight">Export My Data</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Download JSON Backup</div>
                        </div>
                    </div>
                    <Activity size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </Button>
            </div>

            <div className="mt-auto pt-12 relative z-10">
                <div className="glass dark:glass-dark rounded-3xl p-6 border-white/20 dark:border-slate-800/50 shadow-xl space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Framework</span>
                        <span className="text-slate-800 dark:text-slate-200">Health Companion v2.0.4</span>
                    </div>
                    <div className="h-px bg-white/10 dark:bg-slate-800/50"></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Database</span>
                        <span className={cn(
                            "flex items-center gap-2",
                            isFirebaseConnected ? "text-green-500" : isFirebaseConnected === false ? "text-rose-500" : "text-slate-500"
                        )}>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isFirebaseConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : isFirebaseConnected === false ? "bg-rose-500" : "bg-slate-500"
                            )}></div>
                            {isFirebaseConnected ? "Connected" : isFirebaseConnected === false ? "Disconnected" : "Checking..."}
                            {!isFirebaseConnected && store.user.isAuthenticated && (
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-[8px] rounded-md font-black uppercase tracking-widest animate-pulse disabled:animate-none disabled:opacity-50"
                                >
                                    {syncing ? 'Syncing...' : 'Retry'}
                                </button>
                            )}
                        </span>
                    </div>
                    <div className="h-px bg-white/10 dark:bg-slate-800/50"></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Cloud Sync</span>
                        <span className="text-slate-800 dark:text-slate-200">
                            {lastSyncedAt ? format(new Date(lastSyncedAt), 'MMM d, HH:mm') : 'Never'}
                        </span>
                    </div>
                    <div className="h-px bg-white/10 dark:bg-slate-800/50"></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Environment</span>
                        <span className="text-orange-500">Production Mode</span>
                    </div>
                    <div className="h-px bg-white/10 dark:bg-slate-800/50"></div>
                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            onClick={() => {
                                if (window.confirm('WARNING: This will delete all your locally stored data including food logs, plans, and reminders. Continue?')) {
                                    resetCache()
                                }
                            }}
                            disabled={resetting}
                            variant="ghost"
                            fullWidth
                            className="py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-800"
                        >
                            {resetting ? 'Resetting…' : 'Reset App Cache'}
                        </Button>

                        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Activity size={12} /> Danger Zone
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mb-4 leading-relaxed">
                                This will permanently delete your entire history (meals, exercises, water, weight, streaks) from this device and the cloud. This action is IRREVERSIBLE.
                            </p>
                            <Button
                                onClick={async () => {
                                    if (window.confirm('CRITICAL ACTION: Are you absolutely sure you want to WIPE ALL YOUR DATA? This cannot be undone.')) {
                                        try {
                                            setResetting(true)
                                            await (store as any).wipeAllData()
                                            toast.success("System Purged", { description: "All historical data has been wiped." })
                                            setTimeout(() => location.reload(), 1500)
                                        } catch (e) {
                                            toast.error("Wipe Failed")
                                        } finally {
                                            setResetting(false)
                                        }
                                    }
                                }}
                                disabled={resetting}
                                variant="danger"
                                fullWidth
                                className="py-3 rounded-xl font-black uppercase tracking-widest text-[10px]"
                            >
                                {resetting ? 'Purging System…' : 'Wipe All Historical Data'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-[8px] text-slate-500/50 font-black uppercase tracking-[0.4em] mt-12 mb-8">
                Designed for the next evolution of human performance
            </div>
        </div>
    )
}
