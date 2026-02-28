import React from 'react'
import { Bell, BellOff, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

interface NotificationSettingsProps {
    enabled: boolean
    onToggle: (enabled: boolean) => void
    onPermissionRequest: () => void
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    enabled,
    onToggle,
    onPermissionRequest
}) => {
    const hasPermission = 'Notification' in window && Notification.permission === 'granted'

    const settings = [
        { id: 'scheduled', label: 'Scheduled Doses', icon: <Clock size={16} />, desc: 'Primary reminders' },
        { id: 'missed', label: 'Missed Doses', icon: <AlertTriangle size={16} />, desc: '30 min after schedule' },
        { id: 'inventory', label: 'Low Supply', icon: <Bell size={16} />, desc: 'When < 5 pills left' },
        { id: 'refill', label: 'Refill Reminders', icon: <RefreshCw size={16} />, desc: 'Stay ahead of stock' },
    ]

    return (
        <div className="glass p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
                        enabled && hasPermission ? "bg-indigo-500 text-white shadow-indigo-500/20" : "bg-slate-200 dark:bg-slate-800 text-slate-400 shadow-none"
                    )}>
                        {enabled && hasPermission ? <Bell size={20} /> : <BellOff size={20} />}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Smart Reminders</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {hasPermission ? (enabled ? 'Activated' : 'Paused') : 'Action Required'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={hasPermission ? () => onToggle(!enabled) : onPermissionRequest}
                    className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        enabled && hasPermission ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                >
                    <span
                        className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            enabled && hasPermission ? "translate-x-6" : "translate-x-1"
                        )}
                    />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {settings.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="text-slate-400">{s.icon}</div>
                            <div>
                                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none mb-1">{s.label}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{s.desc}</div>
                            </div>
                        </div>
                        {!hasPermission && (
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">Permission Needed</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
