
import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { toast } from 'sonner'

export default function NotificationManager() {
    const reminders = useAppStore(state => state.reminders || [])

    useEffect(() => {
        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const notifiedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const supportsTriggers = typeof Notification !== 'undefined' && 'showTrigger' in Notification.prototype && 'serviceWorker' in navigator;

        if (supportsTriggers) {
            (async () => {
                try {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (!reg) return;
                    type TimestampTriggerCtor = new (timestamp: number) => object;
                    const Trigger = (window as unknown as { TimestampTrigger?: TimestampTriggerCtor }).TimestampTrigger;
                    if (!Trigger) return;
                    const now = new Date();
                    const todayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

                    for (const reminder of reminders) {
                        if (!reminder.enabled) continue;
                        const [h, m] = reminder.time.split(':').map(Number);

                        const nextTime = new Date();
                        nextTime.setHours(h, m, 0, 0);
                        if (nextTime.getTime() < Date.now() - 5 * 60 * 1000) {
                            nextTime.setDate(nextTime.getDate() + 1);
                        }

                        const preTime = new Date(nextTime.getTime() - 15 * 60 * 1000);

                        const tagPre = `med-pre-${reminder.id}-${todayKey}`;
                        const tagNow = `med-now-${reminder.id}-${todayKey}`;

                        const preOptions: Record<string, unknown> = {
                            body: `Take at ${reminder.time}.`,
                            icon: '/pwa-192x192.png',
                            tag: tagPre,
                            showTrigger: new Trigger(preTime.getTime())
                        };
                        await reg.showNotification(`Upcoming Medicine: ${reminder.medicineName}`, preOptions as NotificationOptions);

                        const nowOptions: Record<string, unknown> = {
                            body: `It is ${reminder.time}.`,
                            icon: '/pwa-192x192.png',
                            tag: tagNow,
                            showTrigger: new Trigger(nextTime.getTime())
                        };
                        await reg.showNotification(`TIME TO TAKE: ${reminder.medicineName}`, nowOptions as NotificationOptions);
                    }
                } catch (e) {
                    console.error('Scheduled notification setup failed', e);
                }
            })();
        }

        const send = async (title: string, options: NotificationOptions) => {
            try {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                    await reg.showNotification(title, options);
                    return;
                }
            } catch {
                /* ignore */
            }
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification(title, options);
                } catch {
                    /* ignore */
                }
            }
        };

        const checkReminders = () => {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTimeInMinutes = currentHours * 60 + currentMinutes;
            const dateKey = now.getDate();

            reminders.forEach(reminder => {
                if (!reminder.enabled) return;

                const [rHours, rMinutes] = reminder.time.split(':').map(Number);
                const reminderTimeInMinutes = rHours * 60 + rMinutes;
                const diffMinutes = reminderTimeInMinutes - currentTimeInMinutes;

                if (diffMinutes > 0 && diffMinutes <= 15) {
                    const tag = `med-pre-${reminder.id}-${dateKey}`;
                    if (!notifiedRef.current.has(tag)) {
                        void send(`Upcoming Medicine: ${reminder.medicineName}`, {
                            body: `Take in ${diffMinutes} mins (at ${reminder.time}).`,
                            icon: '/pwa-192x192.png',
                            tag: tag
                        });
                        toast.info(`Upcoming: ${reminder.medicineName}`, {
                            description: `Take in ${diffMinutes} mins (at ${reminder.time})`
                        });
                        notifiedRef.current.add(tag);
                    }
                }

                if (diffMinutes <= 0 && diffMinutes >= -5) {
                    const tag = `med-now-${reminder.id}-${dateKey}`;
                    if (!notifiedRef.current.has(tag)) {
                        void send(`TIME TO TAKE: ${reminder.medicineName}`, {
                            body: `It is ${reminder.time}.`,
                            icon: '/pwa-192x192.png',
                            tag: tag
                        });
                        toast.success(`TIME TO TAKE: ${reminder.medicineName}`, {
                            description: `It is time!`,
                            duration: 10000
                        });
                        notifiedRef.current.add(tag);
                    }
                }
            });
        }

        const intervalId = setInterval(checkReminders, 10 * 1000);
        checkReminders();

        return () => clearInterval(intervalId);
    }, [reminders]);

    return null;
}
