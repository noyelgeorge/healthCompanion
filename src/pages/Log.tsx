import { useState, useRef } from "react"
import { format } from "date-fns"
import { useAppStore, type MealEntry } from "../store/useAppStore"
import { Plus, Trash2, Loader2, Camera, X, Pencil, Search } from "lucide-react"
import { AddFoodForm } from "../components/log/AddFoodForm"
import { CameraCapture } from "../components/log/CameraCapture"
import { cn } from "../lib/utils"
import { calculateTDEE, calculateMacroTargets } from "../lib/calories"
import { analyzeImage } from "../lib/ai"
import { searchFood, type FoodSearchResult } from "../services/foodSearch"
import { toast } from "sonner"
import { useEffect } from "react"

export default function Log() {
    // Dynamic Tabs
    const TABS: MealEntry['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack']

    const [activeTab, setActiveTab] = useState<MealEntry['mealType']>('breakfast')
    const [isAddingMode, setIsAddingMode] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [showScanModal, setShowScanModal] = useState(false)
    const [showWebCamera, setShowWebCamera] = useState(false)
    const [scannedData, setScannedData] = useState<Partial<MealEntry> | undefined>(undefined)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [servingAmount, setServingAmount] = useState<number>(100)
    const [selectedResult, setSelectedResult] = useState<FoodSearchResult | null>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    const addEntry = useAppStore(state => state.addEntry)
    const updateEntry = useAppStore(state => state.updateEntry)
    const user = useAppStore(state => state.user)

    const today = format(new Date(), 'yyyy-MM-dd')
    const logs = useAppStore(state => state.logs[today])
    const removeEntry = useAppStore(state => state.removeEntry)
    const isDesktopView = useAppStore(state => state.isDesktopView)

    const entries = logs?.entries.filter(e => e.mealType === activeTab) || []

    const dailyTotal = (logs?.entries || []).reduce((acc, e) => acc + e.calories, 0)
    const dailyProtein = (logs?.entries || []).reduce((acc, e) => acc + (e.protein || 0), 0)
    const dailyCarbs = (logs?.entries || []).reduce((acc, e) => acc + (e.carbs || 0), 0)
    const dailyFat = (logs?.entries || []).reduce((acc, e) => acc + (e.fat || 0), 0)

    // Calculate TDEE/BMR (Miffin-St Jeor Equation)
    const target = calculateTDEE(user)

    // Macro targets: shared utility
    const { protein: proteinTarget, carbs: carbsTarget, fat: fatTarget }
        = calculateMacroTargets(target)

    const progress = Math.min(100, (dailyTotal / target) * 100)

    const handleAddEntry = (entry: Omit<MealEntry, 'id' | 'timestamp'> & { id?: string }) => {
        if (entry.id) {
            updateEntry(today, entry as MealEntry)
        } else {
            addEntry(today, entry as Omit<MealEntry, 'id' | 'timestamp'>)
        }
        setScannedData(undefined) // Reset scan data after add/update
        setIsAddingMode(false)
    }

    const handleScanClick = () => {
        setShowScanModal(true)
    }

    const handleCameraChoice = () => {
        setShowScanModal(false)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        if (isMobile) {
            if (cameraInputRef.current) cameraInputRef.current.click()
        } else {
            setShowWebCamera(true)
        }
    }

    const handleGalleryChoice = () => {
        setShowScanModal(false)
        if (galleryInputRef.current) galleryInputRef.current.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        processScannedFile(file)
    }

    const handleWebCapture = (file: File) => {
        setShowWebCamera(false)
        processScannedFile(file)
    }

    const processScannedFile = async (file: File) => {
        setIsScanning(true)
        try {
            const result = await analyzeImage(file)
            setScannedData(result)
            setIsAddingMode(true)

            if (result.name !== "Identified Food") {
                toast.success("Meal Scanned!", {
                    description: `Identified as ${result.name} with ${result.calories} Cal.`
                })
            }
        } catch (error) {
            console.error("Scan failed", error)
            toast.error("Scan Failed", {
                description: error instanceof Error ? error.message : "Could not analyze the image. Please try again."
            })
        } finally {
            setIsScanning(false)
            if (cameraInputRef.current) cameraInputRef.current.value = ''
            if (galleryInputRef.current) galleryInputRef.current.value = ''
        }
    }

    // Reset search state when closed
    useEffect(() => {
        if (!showSearch) {
            setSearchQuery("");
            setSearchResults([]);
            setSelectedResult(null);
            setServingAmount(100);
        }
    }, [showSearch])

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                setSelectedResult(null); // Reset selection on new search
                try {
                    const results = await searchFood(searchQuery)
                    setSearchResults(results)
                } catch (error) {
                    console.error("Search failed", error)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSelectSearchResult = (result: FoodSearchResult) => {
        setScannedData({
            name: result.name,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            ingredients: [result.name]
        })
        setShowSearch(false)
        setSearchQuery("")
        setIsAddingMode(true)
    }

    return (
        <div className="page-container space-y-6">
            {/* Background Blob */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-orange-500/5 dark:bg-orange-400/5 rounded-full blur-3xl -z-10 animate-blob"></div>
            <div className="absolute top-1/2 -right-20 w-80 h-80 bg-rose-500/5 dark:bg-rose-400/5 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000"></div>

            {/* Daily Summary Header */}
            <div className="glass-dark p-6 rounded-3xl text-white overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -z-10"></div>
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Intake Status</div>
                        <div className="text-3xl font-black">
                            {dailyTotal} <span className="text-sm font-medium text-slate-500">/ {target} kcal</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Remaining</div>
                        <div className="text-xl font-black text-orange-400">{target - dailyTotal}</div>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-orange-500 to-rose-500", progress > 100 ? "from-red-500 to-rose-600" : "")}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-300">
                            P: {dailyProtein}
                            <span className="text-slate-500">/{proteinTarget}g</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                        <span className="text-[10px] font-black text-slate-300">
                            C: {dailyCarbs}
                            <span className="text-slate-500">/{carbsTarget}g</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-[10px] font-black text-slate-300">
                            F: {dailyFat}
                            <span className="text-slate-500">/{fatTarget}g</span>
                        </span>
                    </div>
                </div>

                {/* Macro Row */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/50">
                    <div className="text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            Protein
                        </div>
                        <div className="font-black text-white text-sm">
                            {Math.round(dailyProtein)}
                            <span className="text-slate-500 font-medium text-[10px]">/{proteinTarget}g</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-400 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, (dailyProtein / proteinTarget) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            Carbs
                        </div>
                        <div className="font-black text-white text-sm">
                            {Math.round(dailyCarbs)}
                            <span className="text-slate-500 font-medium text-[10px]">/{carbsTarget}g</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, (dailyCarbs / carbsTarget) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            Fat
                        </div>
                        <div className="font-black text-white text-sm">
                            {Math.round(dailyFat)}
                            <span className="text-slate-500 font-medium text-[10px]">/{fatTarget}g</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, (dailyFat / fatTarget) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs - Glass Pill */}
            <div className="grid grid-cols-4 gap-1 p-1 glass rounded-2xl">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab)
                            setIsAddingMode(false)
                            setScannedData(undefined)
                        }}
                        className={cn(
                            "py-2 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all whitespace-nowrap flex flex-col items-center justify-center gap-0.5 min-h-[44px]",
                            activeTab === tab
                                ? "glass bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-md scale-[1.02]"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <span>{tab}</span>
                        {(() => {
                            const tabTotal = logs?.entries
                                .filter(e => e.mealType === tab)
                                .reduce((acc, e) => acc + e.calories, 0) || 0;
                            return tabTotal > 0 ? (
                                <span className="text-[8px] opacity-70 font-bold">{tabTotal} cal</span>
                            ) : null;
                        })()}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-5 min-h-[300px]">
                {/* Hidden Inputs */}
                <input
                    type="file"
                    ref={cameraInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                />
                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {isAddingMode ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <AddFoodForm
                            key={scannedData ? (scannedData.id || JSON.stringify(scannedData)) : 'new'}
                            mealType={activeTab}
                            initialValues={scannedData}
                            onClose={() => {
                                setIsAddingMode(false)
                                setScannedData(undefined)
                            }}
                            onSubmit={handleAddEntry}
                        />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="glass p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                            >
                                <div className="p-3 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <Plus size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Quick Log</span>
                            </button>

                            <button
                                onClick={handleScanClick}
                                disabled={isScanning}
                                className="glass p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group disabled:opacity-50"
                            >
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    {isScanning ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">AI Scan</span>
                            </button>

                            <button
                                onClick={() => setShowSearch(true)}
                                className="glass p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group col-span-2"
                            >
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <Search size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Search Food</span>
                            </button>
                        </div>

                        {/* Search Panel Inline */}
                        {showSearch && (
                            <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-4 glass p-6 rounded-[2.5rem] relative">
                                <button
                                    onClick={() => setShowSearch(false)}
                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Food Database</h3>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="What did you eat?"
                                            className="w-full pl-12 pr-12 py-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white transition-all text-sm font-bold shadow-lg"
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                                        {isSearching ? (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                                <Loader2 size={32} className="animate-spin text-emerald-500 mb-2" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching USDA Archive...</p>
                                            </div>
                                        ) : selectedResult ? (
                                            /* Serving Size Picker UI */
                                            <div className="glass p-5 rounded-2xl space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-black text-slate-800 dark:text-white text-sm line-clamp-1">
                                                            {selectedResult.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                            Per 100g from USDA database
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSelectedResult(null)} className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                        How much did you eat?
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            value={servingAmount}
                                                            onChange={e => setServingAmount(Number(e.target.value))}
                                                            className="w-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 
                                                                    bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white 
                                                                    text-center font-black text-lg focus:outline-none 
                                                                    focus:ring-2 focus:ring-emerald-500/30"
                                                            min="1"
                                                            autoFocus
                                                        />
                                                        <span className="font-bold text-slate-500 text-sm">grams</span>
                                                    </div>

                                                    <div className="flex gap-2 mt-3 flex-wrap">
                                                        {[50, 100, 150, 200, 300].map(g => (
                                                            <button
                                                                key={g}
                                                                onClick={() => setServingAmount(g)}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                    servingAmount === g
                                                                        ? "bg-emerald-500 text-white"
                                                                        : "glass text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                                                                )}
                                                            >
                                                                {g}g
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="glass p-3 rounded-2xl flex justify-around text-center bg-slate-50/50 dark:bg-slate-800/50">
                                                    <div>
                                                        <div className="font-black text-orange-500 text-lg">
                                                            {Math.round(selectedResult.calories * servingAmount / 100)}
                                                        </div>
                                                        <div className="text-[8px] text-slate-400 font-black uppercase">kcal</div>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-blue-500">
                                                            {Math.round(selectedResult.protein * servingAmount / 100 * 10) / 10}g
                                                        </div>
                                                        <div className="text-[8px] text-slate-400 font-black uppercase">protein</div>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-amber-500">
                                                            {Math.round(selectedResult.carbs * servingAmount / 100 * 10) / 10}g
                                                        </div>
                                                        <div className="text-[8px] text-slate-400 font-black uppercase">carbs</div>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-rose-500">
                                                            {Math.round(selectedResult.fat * servingAmount / 100 * 10) / 10}g
                                                        </div>
                                                        <div className="text-[8px] text-slate-400 font-black uppercase">fat</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        handleSelectSearchResult({
                                                            ...selectedResult,
                                                            calories: Math.round(selectedResult.calories * servingAmount / 100),
                                                            protein: Math.round(selectedResult.protein * servingAmount / 100 * 10) / 10,
                                                            carbs: Math.round(selectedResult.carbs * servingAmount / 100 * 10) / 10,
                                                            fat: Math.round(selectedResult.fat * servingAmount / 100 * 10) / 10,
                                                        })
                                                        setSelectedResult(null)
                                                        setServingAmount(100)
                                                    }}
                                                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white 
                                                                rounded-2xl font-black text-xs uppercase tracking-widest 
                                                                hover:scale-[1.02] active:scale-[0.98] transition-all 
                                                                shadow-lg shadow-emerald-500/20"
                                                >
                                                    Add to {activeTab}
                                                </button>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((result, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setSelectedResult(result);
                                                        setServingAmount(100);
                                                    }}
                                                    className="w-full text-left glass p-4 rounded-2xl hover:bg-emerald-500/5 transition-all flex justify-between items-center group"
                                                >
                                                    <div className="flex-1 pr-4">
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{result.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                            P: {result.protein}g • C: {result.carbs}g • F: {result.fat}g
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-black text-orange-500">{result.calories}</div>
                                                        <div className="text-[8px] text-slate-400 font-black uppercase">kcal</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : searchQuery.length >= 2 ? (
                                            <div className="text-center py-10">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No signals found</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 opacity-30">
                                                <Search size={32} className="mx-auto mb-2" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type to search database</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* List - Entries */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{activeTab} History</h3>
                            </div>

                            <div className="space-y-3">
                                {entries.length === 0 ? (() => {
                                    const emptyStateMessages = {
                                        breakfast: { emoji: '🌅', title: 'Start strong', subtitle: 'Log your breakfast to fuel the day' },
                                        lunch: { emoji: '☀️', title: 'Midday fuel', subtitle: 'What did you have for lunch?' },
                                        dinner: { emoji: '🌙', title: 'Wind down', subtitle: 'Log your evening meal' },
                                        snack: { emoji: '🍎', title: 'Quick bite', subtitle: 'Any snacks between meals?' },
                                    }
                                    const emptyMsg = emptyStateMessages[activeTab]
                                    return (
                                        <div className="text-center py-16 glass rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                            <div className="text-4xl mb-3">{emptyMsg.emoji}</div>
                                            <p className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                {emptyMsg.title}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium mt-1">{emptyMsg.subtitle}</p>
                                        </div>
                                    )
                                })() : (
                                    entries.map(entry => (
                                        <div key={entry.id} className="glass p-4 rounded-3xl flex justify-between items-center hover:scale-[1.01] transition-transform group">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black">
                                                        {entry.name.charAt(0)}
                                                    </div>
                                                    {entry.healthScore && (
                                                        <div className={cn(
                                                            "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-white dark:border-slate-900",
                                                            entry.healthScore >= 8 ? "bg-emerald-500" :
                                                                entry.healthScore >= 5 ? "bg-amber-500" :
                                                                    "bg-rose-500"
                                                        )}>
                                                            {entry.healthScore}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-white leading-tight">{entry.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                        P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g
                                                    </div>
                                                    <div className="text-[10px] text-slate-400/60 font-medium mt-0.5">
                                                        {new Date(entry.timestamp).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <div className="font-black text-slate-800 dark:text-slate-200">{entry.calories}</div>
                                                    <div className="text-[8px] text-slate-400 font-black uppercase">kcal</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setScannedData(entry)
                                                        setIsAddingMode(true)
                                                    }}
                                                    className="p-2.5 text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400 bg-slate-50 dark:bg-slate-950 rounded-xl transition-all"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => removeEntry(today, entry.id)}
                                                    className="p-2.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-950 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Custom Camera Modal for Desktop */}
            {showWebCamera && (
                <CameraCapture
                    onCapture={handleWebCapture}
                    onClose={() => setShowWebCamera(false)}
                />
            )}

            {/* Scan Options Modal */}
            {showScanModal && (
                <div className={cn(
                    "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 transition-all",
                    !isDesktopView && "left-1/2 -translate-x-1/2 w-full max-w-[430px]"
                )}>
                    <div className="w-full max-w-sm glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-white tracking-tight">AI Food Scan</h3>
                                <button onClick={() => setShowScanModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-2">
                                <button
                                    onClick={handleCameraChoice}
                                    className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                        <Camera size={28} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-lg">Snap Photo</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live identification</div>
                                    </div>
                                </button>

                                <button
                                    onClick={handleGalleryChoice}
                                    className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <Plus size={28} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-lg">Pick Image</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">From your gallery</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
