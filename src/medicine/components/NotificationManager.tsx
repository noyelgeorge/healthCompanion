import { useEffect, useState, useRef } from 'react'
import { Bell, ShieldCheck, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMedicineStore } from '../store/medicineStore'
import { format, parse, addMinutes, subMinutes } from 'date-fns'

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

    // Initial check for permission prompt
    useEffect(() => {
        if (!hasRequestedPermission && medicines.length > 0) {
            setShowPermissionUI(true)
        }
    }, [hasRequestedPermission, medicines.length])

    const showNotification = (title: string, body: string, medId: string) => {
        console.log('🔔 Requesting notification:', { title, body, medId, permission: Notification.permission });
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body,
                icon: '/icons/pwa-192x192.png',
                badge: '/icons/pwa-192x192.png',
                tag: `med-${medId}`
            }
            console.log('🚀 Executing new Notification()...');
            new Notification(title, options)
        } else {
            console.warn('❌ Notification skipped: Permission not granted or API missing.');
        }
    }

    // Main Notification Loop
    const firedRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!notificationsEnabled || Notification.permission !== 'granted') return

        const checkReminders = () => {
            const now = new Date()
            const currentTime = format(now, 'HH:mm')
            const dateStr = format(now, 'yyyy-MM-dd')

            medicines.forEach(med => {
                const isTaken = takenToday.some(t => t.medId === med.id)
                const scheduleTime = parse(med.schedule, 'HH:mm', now)
                const offset = med.reminderOffsetMinutes ?? 0
                
                // Target time for the reminder (schedule - offset)
                const targetTime = subMinutes(scheduleTime, offset)

                // 1. Regular Reminder (fired if now >= targetTime AND we haven't fired today)
                // We limit it to firing within a 60-minute window to avoid old alerts if the app is opened late
                const diffScheduled = (now.getTime() - targetTime.getTime()) / 60000
                if (diffScheduled >= 0 && diffScheduled < 60 && !isTaken) {
                    const notifKey = `${med.id}-regular-${dateStr}`
                    if (!firedRef.current.has(notifKey)) {
                        firedRef.current.add(notifKey)
                        const label = offset > 0 ? `In ${offset} mins: ${med.name}` : `Time for ${med.name}`
                        showNotification(
                            label,
                            `Scheduled for ${med.schedule}. ${med.notes || ''}`,
                            med.id
                        )
                    }
                }

                // 2. Missed Dose Reminder (30 mins after scheduled time)
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

                // 3. Low Supply Alert (once at 10:00 range)
                if (med.remainingPills < 5 && med.remainingPills > 0 && currentTime === '10:00') {
                    const notifKey = `${med.id}-low-${dateStr}`
                    if (!firedRef.current.has(notifKey)) {
                        firedRef.current.add(notifKey)
                        showNotification(
                            `Low Supply: ${med.name}`,
                            `Only ${med.remainingPills} pills left. Time to restock!`,
                            med.id
                        )
                    }
                }
            })
        }

        // Listener for manual test notifications
        const handleTest = () => {
            console.log('🧪 Test event received in NotificationManager');
            showNotification(
                "Test Alert 💊",
                "Your medication notifications are working correctly!",
                "test-notif"
            )
        }
        window.addEventListener('test-notification', handleTest)

        checkReminders()
        const interval = setInterval(checkReminders, 30000) // Check every 30s for more precision
        return () => {
            clearInterval(interval)
            window.removeEventListener('test-notification', handleTest)
        }
    }, [notificationsEnabled, medicines, takenToday])


    const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        setHasRequestedPermission(true)
        setShowPermissionUI(false)
        if (permission === 'granted') {
            setNotificationsEnabled(true)
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
