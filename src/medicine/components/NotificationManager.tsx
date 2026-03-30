import { useEffect, useState, useRef } from 'react'
import { Bell, ShieldCheck, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMedicineStore } from '../store/medicineStore'
import { format, parse, addMinutes, subMinutes } from 'date-fns'
import { toast } from 'sonner'

export const NotificationManager = () => {
    const {
        medicines,
        takenToday,
        notificationsEnabled,
        hasRequestedPermission,
        setHasRequestedPermission,
        setNotificationsEnabled
    } = useMedicineStore()

    const [showPermissionUI, setShowPermissionUI] = useState(false)
    const [localPermission, setLocalPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    )

    // Sync permission on window focus (in case user changed it in browser settings)
    useEffect(() => {
        const syncPermission = () => {
            if (typeof Notification !== 'undefined') {
                setLocalPermission(Notification.permission)
            }
        }
        window.addEventListener('focus', syncPermission)
        return () => window.removeEventListener('focus', syncPermission)
    }, [])

    // Initial check for permission prompt
    useEffect(() => {
        if (!hasRequestedPermission && medicines.length > 0) {
            setShowPermissionUI(true)
        }
    }, [hasRequestedPermission, medicines.length])

    const showNotification = (title: string, body: string, medId: string) => {
        console.log('🔔 Requesting notification:', { title, body, medId, permission: Notification.permission });
        
        // 1. UI Toast Fallback (Always show in-app feedback)
        toast.info(title, { 
            description: body,
            duration: 8000,
            icon: '💊'
        });

        // 2. Browser Native Notification (OS level)
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: `med-${medId}`
            }
            console.log('🚀 [NotificationManager] Executing new Notification()...');
            new Notification(title, options)
        } else if (Notification.permission === 'denied') {
            console.warn('❌ [NotificationManager] Native permission denied.');
            toast.error("Notifications Blocked", {
                description: "Please enable notifications in your browser settings (click the lock icon in the address bar)."
            });
        } else {
             console.warn('❌ [NotificationManager] Native API missing or default permission.');
        }
    }

    // Main Notification Loop
    const firedRef = useRef<Set<string>>(new Set())

    // 1. Independent Listener for manual/automated test notifications
    useEffect(() => {
        const handleTest = () => {
            console.log('🧪 [NotificationManager] Test event received. Current permission:', Notification.permission);
            showNotification(
                "Test Alert 💊",
                "Your medication notifications are working correctly!",
                "test-notif"
            )
        }
        window.addEventListener('test-notification', handleTest)
        console.log('✅ [NotificationManager] Global test-notification listener active.');
        return () => window.removeEventListener('test-notification', handleTest)
    }, [])

    // 2. Main Notification Loop
    useEffect(() => {
        console.log('🔄 [NotificationManager] Loop effect triggered:', { notificationsEnabled, localPermission });
        if (!notificationsEnabled || localPermission !== 'granted') {
            console.warn('⏸️ [NotificationManager] Loop suspended: Disabled or missing permission.');
            return
        }

        const checkReminders = () => {
            const now = new Date()
            const currentTime = format(now, 'HH:mm')
            const dateStr = format(now, 'yyyy-MM-dd')

            console.log(`💓 [NotificationManager] Heartbeat - Checking ${medicines.length} medicines at ${currentTime}`);

            medicines.forEach(med => {
                const isTaken = takenToday.some(t => t.medId === med.id)
                const scheduleTime = parse(med.schedule, 'HH:mm', now)
                
                // 1. Upcoming Reminder (15 mins before)
                const targetTime = subMinutes(scheduleTime, 15)
                const diffUpcoming = (now.getTime() - targetTime.getTime()) / 60000
                if (diffUpcoming >= 0 && diffUpcoming < 2 && !isTaken) {
                    const notifKey = `${med.id}-upcoming-${dateStr}`
                    if (!firedRef.current.has(notifKey)) {
                        firedRef.current.add(notifKey)
                        showNotification(
                            `Upcoming: ${med.name}`,
                            `Scheduled for ${med.schedule}. Please prepare to take it.`,
                            `${med.id}-upcoming`
                        )
                    }
                }

                // 2. On-Time Reminder (at schedule time)
                const diffOnTime = (now.getTime() - scheduleTime.getTime()) / 60000
                if (diffOnTime >= 0 && diffOnTime < 2 && !isTaken) {
                    const notifKey = `${med.id}-ontime-${dateStr}`
                    if (!firedRef.current.has(notifKey)) {
                        firedRef.current.add(notifKey)
                        showNotification(
                            `Time for ${med.name}`,
                            `It is ${med.schedule}. Please take your dose now.`,
                            `${med.id}-ontime`
                        )
                    }
                }

                // 3. Missed Dose Reminder (30 mins after scheduled time)
                const missedThreshold = addMinutes(scheduleTime, 30)
                const diffMissed = (now.getTime() - missedThreshold.getTime()) / 60000
                if (diffMissed >= 0 && diffMissed < 60 && !isTaken) {
                    const notifKey = `${med.id}-missed-${dateStr}`
                    if (!firedRef.current.has(notifKey)) {
                        firedRef.current.add(notifKey)
                        showNotification(
                            `Missed Dose: ${med.name}`,
                            `Scheduled time was ${med.schedule}. Please take it as soon as possible.`,
                            `${med.id}-missed`
                        )
                    }
                }

                // 4. Low Supply Alert (once at 10:00 range)
                if (med.remainingPills < 5 && med.remainingPills > 0 && currentTime === '10:00') {
                    const notifKey = `${med.id}-low-${dateStr}`
                    if (!firedRef.current.has(notifKey)) {
                        firedRef.current.add(notifKey)
                        showNotification(
                            `Low Supply: ${med.name}`,
                            `Only ${med.remainingPills} pills left. Time to restock!`,
                            `${med.id}-low`
                        )
                    }
                }
            })
        }

        checkReminders()
        const interval = setInterval(checkReminders, 30000) 
        return () => clearInterval(interval)
    }, [notificationsEnabled, medicines, takenToday, localPermission])


    const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        setHasRequestedPermission(true)
        setShowPermissionUI(false)
        if (permission === 'granted') {
            setNotificationsEnabled(true)
            // Trigger an immediate check so user sees it works
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('test-notification'));
            }, 500);
        }
    }

    return (
        <AnimatePresence>
            {showPermissionUI && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="glass bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative border border-white dark:border-slate-800"
                    >
                        <button
                            onClick={() => {
                                setHasRequestedPermission(true)
                                setShowPermissionUI(false)
                            }}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 bg-indigo-500 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                            <Bell size={32} />
                        </div>

                        <div className="text-center space-y-3 mb-8">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Never Miss a Dose</h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Get smart reminders for your medications, missed doses, and low supply alerts.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={requestPermission}
                                className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={18} /> Enable Notifications
                            </button>
                            <button
                                onClick={() => {
                                    setHasRequestedPermission(true)
                                    setShowPermissionUI(false)
                                }}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
