import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, Clipboard, ShoppingBasket, ArrowLeft, Loader2, Search, Upload, BarChart3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

// Local Store & Components
import { useMedicineStore } from './store/medicineStore'
import { analyzeMedicineImage } from './medicine'
import type { ScannedMedicine } from './medicine'
import { MedicineCard } from './components/MedicineCard'
import { ProgressCard } from './components/ProgressCard'
import { BadgesList } from './components/BadgesList'
import { ScanReviewTab } from './components/ScanReviewTab'
import { CameraCapture } from '../components/log/CameraCapture'
import { FileUpload } from './components/FileUpload'
import { FamilySelector } from './components/FamilySelector'
import { AdherenceStats } from './components/AdherenceStats'
import { NotificationSettings } from './components/NotificationSettings'
import { NotificationManager } from './components/NotificationManager'

type Tab = 'basket' | 'review' | 'stats'

export default function MedicineMode() {
    const [activeTab, setActiveTab] = useState<Tab>('basket')
    const [isScanning, setIsScanning] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [scanResults, setScanResults] = useState<ScannedMedicine[]>([])
    const [selectedFamilyMember, setSelectedFamilyMember] = useState('Me')

    // Local Store
    const {
        medicines,
        takenToday,
        streakCount,
        badges,
        familyMembers,
        notificationsEnabled,
        adherenceHistory,
        markTaken,
        addMedicine,
        addFamilyMember,
        setNotificationsEnabled,
        resetDaily
    } = useMedicineStore()

    useEffect(() => {
        resetDaily()
    }, [resetDaily])

    const handleProcessFile = async (file: File) => {
        setIsScanning(true)
        setShowUpload(false)
        try {
            const results = await analyzeMedicineImage(file)
            if (results.length > 0) {
                setScanResults(results)
                setActiveTab('review')
                toast.success(`Processed ${results.length} items! Review them in the Scan Tab.`)
            } else {
                toast.error("No medications detected.")
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Processing failed")
        } finally {
            setIsScanning(false)
        }
    }

    const onConfirmScan = (med: ScannedMedicine) => {
        addMedicine({
            name: med.name,
            schedule: med.time,
            totalPills: 30,
            remainingPills: 30,
            notes: med.notes,
            assignedTo: selectedFamilyMember
        })
        setScanResults(prev => prev.filter(m => m.name !== med.name))
        toast.success(`${med.name} added for ${selectedFamilyMember}!`)
    }

    // Group medicines by family member
    const groupedMedicines = medicines.reduce((acc: Record<string, typeof medicines>, med) => {
        const key = med.assignedTo || 'Me'
        if (!acc[key]) acc[key] = []
        acc[key].push(med)
        return acc
    }, {})

    return (
        <div className="page-container bg-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-32 min-h-screen">
            <NotificationManager />

            {/* Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between p-4 glass dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 dark:text-white leading-none">Medicine Hub</h1>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Health Companion</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUpload(true)}
                        className="w-11 h-11 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    >
                        <Upload size={18} />
                    </button>
                    <button
                        onClick={() => setShowCamera(true)}
                        disabled={isScanning}
                        className="w-11 h-11 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={20} />}
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-8">
                {/* Navigation Tabs */}
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[2rem] gap-1">
                    <button
                        onClick={() => setActiveTab('basket')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all",
                            activeTab === 'basket'
                                ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <ShoppingBasket size={14} /> Basket
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all relative",
                            activeTab === 'review'
                                ? "bg-white dark:bg-slate-800 text-amber-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <Clipboard size={14} /> Review
                        {scanResults.length > 0 && (
                            <span className="absolute top-2 right-4 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all",
                            activeTab === 'stats'
                                ? "bg-white dark:bg-slate-800 text-emerald-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <BarChart3 size={14} /> Stats
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'basket' ? (
                        <motion.div
                            key="basket"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            <ProgressCard
                                streak={streakCount}
                                total={medicines.length}
                                taken={takenToday.length}
                            />

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                                        <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Schedule</h2>
                                    </div>
                                    <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                                        <Search size={12} /> Database
                                    </button>
                                </div>

                                {medicines.length === 0 ? (
                                    <div className="glass p-12 rounded-[2.5rem] bg-indigo-50/5 border-dashed border-2 border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                                            <Plus size={32} />
                                        </div>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Your basket is empty.<br />Upload or scan a prescription to begin.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(groupedMedicines).map(([member, meds]) => (
                                            <div key={member} className="space-y-4">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Users size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {member === 'Me' ? 'Personal' : `${member}'s List`}
                                                    </span>
                                                </div>
                                                <div className="grid gap-4">
                                                    {meds.map((med) => (
                                                        <MedicineCard
                                                            key={med.id}
                                                            name={med.name}
                                                            schedule={med.schedule}
                                                            remainingPills={med.remainingPills}
                                                            totalPills={med.totalPills}
                                                            notes={med.notes}
                                                            isTaken={takenToday.some(t => t.medId === med.id)}
                                                            onTake={() => markTaken(med.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <BadgesList badges={badges} />
                        </motion.div>
                    ) : activeTab === 'review' ? (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="glass p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl">
                                <FamilySelector
                                    members={familyMembers}
                                    selected={selectedFamilyMember}
                                    onSelect={setSelectedFamilyMember}
                                    onAddMember={addFamilyMember}
                                />
                            </div>

                            <ScanReviewTab
                                results={scanResults}
                                onConfirm={onConfirmScan}
                                onDiscard={(idx: number) => setScanResults((prev: ScannedMedicine[]) => prev.filter((_: ScannedMedicine, i: number) => i !== idx))}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <AdherenceStats history={adherenceHistory} streak={streakCount} />

                            <NotificationSettings
                                enabled={notificationsEnabled}
                                onToggle={setNotificationsEnabled}
                                onPermissionRequest={() => { }} // Handled by NotificationManager
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Manual Upload Modal Overlay */}
            <AnimatePresence>
                {showUpload && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-white dark:border-slate-800"
                        >
                            <button
                                onClick={() => setShowUpload(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Manual Upload</h2>
                                <p className="text-xs text-slate-500 font-medium">Upload a photo or PDF of your prescription.</p>
                            </div>

                            <FileUpload onUpload={handleProcessFile} isProcessing={isScanning} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showCamera && (
                <CameraCapture
                    onCapture={handleProcessFile}
                    onClose={() => setShowCamera(false)}
                    label="Position prescription clearly in frame"
                />
            )}
        </div>
    )
}

function X({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    )
}
