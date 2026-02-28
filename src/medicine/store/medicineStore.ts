import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

export interface Medicine {
    id: string
    name: string
    schedule: string // e.g. "09:00"
    totalPills: number
    remainingPills: number
    notes?: string
    assignedTo: string // 'Me' or Family Member name
    reminderOffsetMinutes?: number // Fix 6: 0 = on time, 5/10/15 = before
}

export interface MedicineBadge {
    id: string
    name: string
    description: string
    icon: string
    unlockedAt?: string
}

export interface AdherenceDay {
    date: string
    totalDoses: number
    takenDoses: number
}

interface MedicineState {
    medicines: Medicine[]
    takenToday: { medId: string; time: string }[]
    streakCount: number
    lastCheckDate: string
    badges: MedicineBadge[]
    familyMembers: string[]
    notificationsEnabled: boolean
    hasRequestedPermission: boolean
    adherenceHistory: AdherenceDay[]

    // Actions
    addMedicine: (medicine: Omit<Medicine, 'id'>) => void
    removeMedicine: (id: string) => void
    markTaken: (id: string) => void
    resetDaily: () => void
    updatePillCount: (id: string, count: number) => void
    addFamilyMember: (name: string) => void
    setNotificationsEnabled: (enabled: boolean) => void
    setHasRequestedPermission: (requested: boolean) => void
    updateAdherence: (date: string, taken: number, total: number) => void
    updateMedicineOffset: (id: string, offset: number) => void // Fix 6
}

const INITIAL_BADGES: MedicineBadge[] = [
    { id: 'first-dose', name: 'First Dose', description: 'Take your first medicine', icon: '💊' },
    { id: '3-day', name: '3-Day Streak', description: 'Maintain consistency for 3 days', icon: '🔥' },
    { id: 'week-warrior', name: 'Week Warrior', description: 'Perfect week of adherence', icon: '🛡️' },
    { id: 'perfect-day', name: 'Perfect Day', description: 'Take all scheduled doses in one day', icon: '🌟' },
]

export const useMedicineStore = create<MedicineState>()(
    persist(
        (set, get) => ({
            medicines: [],
            takenToday: [],
            streakCount: 0,
            lastCheckDate: format(new Date(), 'yyyy-MM-dd'),
            badges: INITIAL_BADGES,
            familyMembers: ['Me'],
            notificationsEnabled: false,
            hasRequestedPermission: false,
            adherenceHistory: [],

            addMedicine: (med) => set((state) => ({
                medicines: [...state.medicines, { ...med, id: crypto.randomUUID() }]
            })),

            removeMedicine: (id) => set((state) => ({
                medicines: state.medicines.filter(m => m.id !== id)
            })),

            // Fix 2: auto-call updateAdherence after marking taken
            markTaken: (id) => {
                const today = format(new Date(), 'yyyy-MM-dd')
                const now = format(new Date(), 'HH:mm')
                const state = get()

                if (state.takenToday.some(t => t.medId === id)) return

                set((state) => {
                    const newTaken = [...state.takenToday, { medId: id, time: now }]
                    const med = state.medicines.find(m => m.id === id)

                    let newMedicines = state.medicines
                    if (med) {
                        newMedicines = state.medicines.map(m =>
                            m.id === id ? { ...m, remainingPills: Math.max(0, m.remainingPills - 1) } : m
                        )
                    }

                    // Check for "First Dose" badge
                    const newBadges = state.badges.map(b =>
                        b.id === 'first-dose' && !b.unlockedAt ? { ...b, unlockedAt: today } : b
                    )

                    return {
                        takenToday: newTaken,
                        medicines: newMedicines,
                        badges: newBadges
                    }
                })

                // Fix 2: Auto-update adherence so stats/chart reflect real usage
                const updated = get()
                get().updateAdherence(today, updated.takenToday.length, updated.medicines.length)
            },

            updatePillCount: (id, count) => set((state) => ({
                medicines: state.medicines.map(m => m.id === id ? { ...m, remainingPills: count } : m)
            })),

            addFamilyMember: (name) => set((state) => ({
                familyMembers: [...state.familyMembers, name]
            })),

            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            setHasRequestedPermission: (requested) => set({ hasRequestedPermission: requested }),

            updateAdherence: (date, taken, total) => set((state) => {
                const existing = state.adherenceHistory.find(h => h.date === date)
                if (existing) {
                    return {
                        adherenceHistory: state.adherenceHistory.map(h =>
                            h.date === date ? { ...h, takenDoses: taken, totalDoses: total } : h
                        )
                    }
                }
                return {
                    adherenceHistory: [...state.adherenceHistory, { date, takenDoses: taken, totalDoses: total }].slice(-30)
                }
            }),

            // Fix 6: set reminder offset per medicine
            updateMedicineOffset: (id, offset) => set((state) => ({
                medicines: state.medicines.map(m => m.id === id ? { ...m, reminderOffsetMinutes: offset } : m)
            })),

            resetDaily: () => {
                const today = format(new Date(), 'yyyy-MM-dd')
                const state = get()

                if (state.lastCheckDate !== today) {
                    const totalDoses = state.medicines.length
                    const takenDoses = state.takenToday.length

                    // Record yesterday's adherence before reset
                    const newAdherence = [...state.adherenceHistory, { date: state.lastCheckDate, totalDoses, takenDoses }].slice(-30)

                    const allTaken = totalDoses > 0 && takenDoses === totalDoses
                    const newStreak = allTaken ? state.streakCount + 1 : 0

                    // Check for badges
                    const newBadges = state.badges.map(b => {
                        if (b.id === '3-day' && newStreak >= 3 && !b.unlockedAt) return { ...b, unlockedAt: today }
                        if (b.id === 'week-warrior' && newStreak >= 7 && !b.unlockedAt) return { ...b, unlockedAt: today }
                        return b
                    })

                    set({
                        takenToday: [],
                        lastCheckDate: today,
                        streakCount: newStreak,
                        adherenceHistory: newAdherence,
                        badges: newBadges
                    })
                }
            }
        }),
        {
            name: 'local-medicine-storage'
        }
    )
)
