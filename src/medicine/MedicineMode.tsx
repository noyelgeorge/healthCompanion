import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, Clipboard, ShoppingBasket, ArrowLeft, Loader2, Upload, BarChart3, Users } from 'lucide-react'
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
import { FamilySelector } from './components/FamilySelector'
import { AdherenceStats } from './components/AdherenceStats'
import { NotificationSettings } from './components/NotificationSettings'
import { NotificationManager } from './components/NotificationManager'

type Tab = 'basket' | 'review' | 'stats'

export default function MedicineMode() {
    const [activeTab, setActiveTab] = useState<Tab>('basket')
    const [isScanning, setIsScanning] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const [scanResults, setScanResults] = useState<ScannedMedicine[]>([])
    const [selectedFamilyMember, setSelectedFamilyMember] = useState('Me')
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [qaForm, setQaForm] = useState({ name: '', time: '08:00', totalPills: 30, notes: '' })
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        removeMedicine, // Fix 1
        addFamilyMember,
        setNotificationsEnabled,
        resetDaily,
        updateMedicineOffset  // Fix 6
    } = useMedicineStore()

    useEffect(() => {
        resetDaily()
    }, [resetDaily])

    const handleProcessFile = async (file: File) => {
        setIsScanning(true)
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp', 'image/heic']
            if (validTypes.includes(file.type) || file.name.endsWith('.pdf')) {
                handleProcessFile(file)
            } else {
                toast.error("Invalid file type. Please upload an image or PDF.")
            }
        }
        // clear input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const onConfirmScan = (med: ScannedMedicine) => {
        // Fix 5: use extracted quantity; fall back to 0 (shows 'Set Stock' prompt)
        const pills = med.quantity ?? 0
        addMedicine({
            name: med.name,
            schedule: med.time,
            totalPills: pills,
            remainingPills: pills,
            notes: med.notes,
            assignedTo: selectedFamilyMember
        })
        setScanResults(prev => prev.filter(m => m.name !== med.name))
        toast.success(`${med.name} added for ${selectedFamilyMember}!`)
    }

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!qaForm.name || !qaForm.time) return

        addMedicine({
            name: qaForm.name,
            schedule: qaForm.time,
            totalPills: Number(qaForm.totalPills),
            remainingPills: Number(qaForm.totalPills),
            notes: qaForm.notes || undefined,
            assignedTo: selectedFamilyMember
        })

        toast.success(`${qaForm.name} added for ${selectedFamilyMember}!`)
        setQaForm({ name: '', time: '08:00', totalPills: 30, notes: '' })
        setShowQuickAdd(false)
    }

    // Group medicines by family member
    const groupedMedicines = medicines.reduce((acc: Record<string, typeof medicines>, med) => {
        const key = med.assignedTo || 'Me'
        if (!acc[key]) acc[key] = []
        acc[key].push(med)
        return acc
    }, {})

    return (
        <div className="page-container bg-slate-50 dark:bg-slate-950 pb-32 min-h-screen">
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
                    {/* Fix 2: Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".jpg,.jpeg,.png,.pdf,.webp,.heic"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="w-11 h-11 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {isScanning ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Upload size={18} />}
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
                                    <button
                                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={12} /> {showQuickAdd ? 'Close' : 'Add Medicine'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showQuickAdd && (
                                        <motion.form
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            onSubmit={handleQuickAdd}
                                            className="glass p-5 rounded-[2rem] border-slate-100 dark:border-slate-800 overflow-hidden"
                                        >
                                            <div className="grid gap-3">
                                                <input
                                                    required
                                                    autoFocus
                                                    value={qaForm.name}
                                                    onChange={e => setQaForm(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="Medicine Name *"
                                                    className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="time"
                                                        required
                                                        value={qaForm.time}
                                                        onChange={e => setQaForm(p => ({ ...p, time: e.target.value }))}
                                                        className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400"
                                                    />
                                                    <input
                                                        type="number"
                                                        required
                                                        min={1}
                                                        value={qaForm.totalPills || ''}
                                                        onChange={e => setQaForm(p => ({ ...p, totalPills: Number(e.target.value) }))}
                                                        placeholder="Pills"
                                                        className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400"
                                                    />
                                                </div>
                                                <input
                                                    value={qaForm.notes}
                                                    onChange={e => setQaForm(p => ({ ...p, notes: e.target.value }))}
                                                    placeholder="Notes (optional)"
                                                    className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full py-3 mt-3 bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={14} /> Add to Basket
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

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
                                                            reminderOffsetMinutes={med.reminderOffsetMinutes ?? 0}
                                                            onOffsetChange={(offset) => updateMedicineOffset(med.id, offset)}
                                                            onRemove={() => removeMedicine(med.id)} // Fix 1
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

