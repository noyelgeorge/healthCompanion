import React from 'react'
import { Bell, BellOff } from 'lucide-react'
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
                            "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-200 transition-transform",
                            enabled && hasPermission ? "translate-x-6" : "translate-x-1"
                        )}
                    />
                </button>
            </div>

            <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    When enabled, you will receive:
                </p>
                <div className="space-y-2">
                    {[
                        "Dose reminders at your scheduled times",
                        "Missed dose alerts 30 min after schedule",
                        "Low supply warnings when < 5 pills remain"
                    ].map((item) => (
                        <div key={item} className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {hasPermission && enabled && (
                <button
                    onClick={() => {
                        console.log('🔘 Dispatching test-notification event...');
                        window.dispatchEvent(new CustomEvent('test-notification'));
                    }}
                    className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 border border-indigo-100 dark:border-indigo-900/50 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                >
                    Send Test Notification
                </button>
            )}
        </div>
    )
}
