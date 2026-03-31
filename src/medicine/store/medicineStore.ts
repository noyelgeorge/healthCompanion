import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { auth, db } from '../../lib/firebase'
import {
    doc, setDoc, getDoc, onSnapshot,
    type Unsubscribe
} from 'firebase/firestore'

// ── Interfaces (all unchanged from original) ──────────────────────────────────

export interface Medicine {
    id: string
    name: string
    schedule: string
    totalPills: number
    remainingPills: number
    notes?: string
    assignedTo: string
    reminderOffsetMinutes?: number
}

export interface MedicineBadge {
    id: string
    name: string
    description: string
    icon: string
    unlockedAt?: string
    seenAt?: string
}

export interface AdherenceDay {
    date: string
    totalDoses: number
    takenDoses: number
}

export interface MedicineState {
    medicines: Medicine[]
    takenToday: { medId: string; time: string }[]
    streakCount: number
    lastCheckDate: string
    badges: MedicineBadge[]
    familyMembers: string[]
    notificationsEnabled: boolean
    hasRequestedPermission: boolean
    adherenceHistory: AdherenceDay[]
    _medicineUnsubscriber: Unsubscribe | null

    // All original action signatures — unchanged
    addMedicine: (medicine: Omit<Medicine, 'id'>) => void
    removeMedicine: (id: string) => void
    updateMedicine: (id: string, updates: Partial<Omit<Medicine, 'id'>>) => void
    markTaken: (id: string) => void
    resetDaily: () => void
    updatePillCount: (id: string, count: number) => void
    addFamilyMember: (name: string) => void
    setNotificationsEnabled: (enabled: boolean) => void
    setHasRequestedPermission: (requested: boolean) => void
    updateAdherence: (date: string, taken: number, total: number) => void
    markBadgeSeen: (id: string) => void

    // New actions for Firebase sync
    syncMedicineWithFirebase: (uid: string) => Promise<void>
    saveMedicineToFirebase: (uid: string) => Promise<void>
    cleanupMedicineListener: () => void
}

// ── Badge definitions (unchanged) ────────────────────────────────────────────

const INITIAL_BADGES: MedicineBadge[] = [
    { id: 'first-dose', name: 'First Dose', description: 'Take your first medicine', icon: '💊' },
    { id: '3-day', name: '3-Day Streak', description: 'Maintain consistency for 3 days', icon: '🔥' },
    { id: 'week-warrior', name: 'Week Warrior', description: 'Perfect week of adherence', icon: '🛡️' },
    { id: 'perfect-day', name: 'Perfect Day', description: 'Take all scheduled doses in one day', icon: '🌟' },
]

// ── localStorage fallback (kept for unauthenticated users) ───────────────────

const localPersistStorage = {
    getItem: (name: string) => {
        const item = localStorage.getItem(name)
        return item ? JSON.parse(item) : null
    },
    setItem: (name: string, value: any) => {
        localStorage.setItem(name, JSON.stringify(value))
    },
    removeItem: (name: string) => {
        localStorage.removeItem(name)
    }
}

// ── ESM-safe UID getter using Firebase Auth directly ─────────────────────────
// Uses auth.currentUser — always reflects the logged-in user synchronously.
// This avoids require() (not available in ESM) and circular store imports entirely.

function getUID(): string | null {
    return auth.currentUser?.uid ?? null
}

// ── Firestore document path helper ───────────────────────────────────────────

const mDoc = (uid: string, section: string) =>
    doc(db, 'users', uid, 'medicine', section)

// ── Store ─────────────────────────────────────────────────────────────────────

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
            _medicineUnsubscriber: null,

            // ── Load all medicine data from Firestore + start real-time listener
            syncMedicineWithFirebase: async (uid: string) => {
                const existing = get()._medicineUnsubscriber
                if (existing) existing()

                try {
                    const [profileSnap, medicinesSnap, takenSnap, historySnap, badgesSnap] =
                        await Promise.all([
                            getDoc(mDoc(uid, 'profile')),
                            getDoc(mDoc(uid, 'medicines')),
                            getDoc(mDoc(uid, 'takenToday')),
                            getDoc(mDoc(uid, 'adherenceHistory')),
                            getDoc(mDoc(uid, 'badges')),
                        ])

                    const today = format(new Date(), 'yyyy-MM-dd')
                    const updates: Partial<MedicineState> = {}

                    if (profileSnap.exists()) {
                        const p = profileSnap.data()
                        updates.streakCount = p.streakCount ?? 0
                        updates.lastCheckDate = p.lastCheckDate ?? today
                        updates.familyMembers = p.familyMembers ?? ['Me']
                        updates.notificationsEnabled = p.notificationsEnabled ?? false
                        updates.hasRequestedPermission = p.hasRequestedPermission ?? false
                    }
                    if (medicinesSnap.exists()) {
                        updates.medicines = medicinesSnap.data().items ?? []
                    }
                    if (takenSnap.exists()) {
                        const td = takenSnap.data()
                        updates.takenToday = td.date === today ? (td.entries ?? []) : []
                    }
                    if (historySnap.exists()) {
                        updates.adherenceHistory = historySnap.data().history ?? []
                    }
                    if (badgesSnap.exists()) {
                        const remoteBadges: MedicineBadge[] = badgesSnap.data().badges ?? []
                        updates.badges = get().badges.map(lb => {
                            const remote = remoteBadges.find(rb => rb.id === lb.id)
                            return remote ? { ...lb, ...remote } : lb
                        })
                    }

                    set(updates)

                    // Real-time listener on profile (catches streak/date updates from other devices)
                    const unsub = onSnapshot(mDoc(uid, 'profile'), (snap) => {
                        if (snap.exists()) {
                            const p = snap.data()
                            set({
                                streakCount: p.streakCount ?? get().streakCount,
                                lastCheckDate: p.lastCheckDate ?? get().lastCheckDate,
                                familyMembers: p.familyMembers ?? get().familyMembers,
                                notificationsEnabled: p.notificationsEnabled ?? get().notificationsEnabled,
                                hasRequestedPermission: p.hasRequestedPermission ?? get().hasRequestedPermission,
                            })
                        }
                    })

                    set({ _medicineUnsubscriber: unsub })
                } catch (err) {
                    console.error('[MedicineStore] Firebase sync failed, using local data:', err)
                }
            },

            // ── Save entire current state to Firestore (used after login migration)
            saveMedicineToFirebase: async (uid: string) => {
                const s = get()
                const today = format(new Date(), 'yyyy-MM-dd')
                try {
                    await Promise.all([
                        setDoc(mDoc(uid, 'profile'), {
                            streakCount: s.streakCount,
                            lastCheckDate: s.lastCheckDate,
                            familyMembers: s.familyMembers,
                            notificationsEnabled: s.notificationsEnabled,
                            hasRequestedPermission: s.hasRequestedPermission,
                        }),
                        setDoc(mDoc(uid, 'medicines'), {
                            items: s.medicines,
                            updatedAt: Date.now()
                        }),
                        setDoc(mDoc(uid, 'takenToday'), {
                            date: today,
                            entries: s.takenToday,
                        }),
                        setDoc(mDoc(uid, 'adherenceHistory'), {
                            history: s.adherenceHistory,
                            updatedAt: Date.now()
                        }),
                        setDoc(mDoc(uid, 'badges'), {
                            badges: s.badges,
                            updatedAt: Date.now()
                        }),
                    ])
                } catch (err) {
                    console.error('[MedicineStore] Firebase save failed:', err)
                }
            },

            // ── Unsubscribe real-time listener (called on logout / wipeAllData)
            cleanupMedicineListener: () => {
                const unsub = get()._medicineUnsubscriber
                if (unsub) { unsub(); set({ _medicineUnsubscriber: null }) }
            },

            // ── addMedicine ───────────────────────────────────────────────────
            addMedicine: (med) => {
                set((state) => ({
                    medicines: [
                        ...state.medicines,
                        { ...med, id: crypto.randomUUID(), reminderOffsetMinutes: med.reminderOffsetMinutes ?? 15 }
                    ]
                }))
                const uid = getUID()
                if (uid) {
                    setDoc(mDoc(uid, 'medicines'), {
                        items: get().medicines, updatedAt: Date.now()
                    }).catch(e => console.error('[MedicineStore] addMedicine sync failed:', e))
                }
            },

            // ── removeMedicine ────────────────────────────────────────────────
            removeMedicine: (id) => {
                set((state) => ({ medicines: state.medicines.filter(m => m.id !== id) }))
                const uid = getUID()
                if (uid) {
                    setDoc(mDoc(uid, 'medicines'), {
                        items: get().medicines, updatedAt: Date.now()
                    }).catch(e => console.error('[MedicineStore] removeMedicine sync failed:', e))
                }
            },

            // ── updateMedicine ────────────────────────────────────────────────
            updateMedicine: (id, updates) => {
                set((state) => ({
                    medicines: state.medicines.map(m => m.id === id ? { ...m, ...updates } : m)
                }))
                const uid = getUID()
                if (uid) {
                    setDoc(mDoc(uid, 'medicines'), {
                        items: get().medicines, updatedAt: Date.now()
                    }).catch(e => console.error('[MedicineStore] updateMedicine sync failed:', e))
                }
            },

            // ── markTaken ─────────────────────────────────────────────────────
            markTaken: (id) => {
                const today = format(new Date(), 'yyyy-MM-dd')
                const now = format(new Date(), 'HH:mm')
                const state = get()

                if (state.takenToday.some(t => t.medId === id)) return

                set((state) => {
                    const newTaken = [...state.takenToday, { medId: id, time: now }]
                    const med = state.medicines.find(m => m.id === id)
                    const newMedicines = med
                        ? state.medicines.map(m =>
                            m.id === id && m.totalPills > 0
                                ? { ...m, remainingPills: Math.max(0, m.remainingPills - 1) }
                                : m
                        )
                        : state.medicines
                    const newBadges = state.badges.map(b =>
                        b.id === 'first-dose' && !b.unlockedAt ? { ...b, unlockedAt: today } : b
                    )
                    return { takenToday: newTaken, medicines: newMedicines, badges: newBadges }
                })

                const updated = get()
                get().updateAdherence(today, updated.takenToday.length, updated.medicines.length)

                const uid = getUID()
                if (uid) {
                    const s = get()
                    Promise.all([
                        setDoc(mDoc(uid, 'takenToday'), { date: today, entries: s.takenToday }),
                        setDoc(mDoc(uid, 'medicines'), { items: s.medicines, updatedAt: Date.now() }),
                        setDoc(mDoc(uid, 'badges'), { badges: s.badges, updatedAt: Date.now() }),
                    ]).catch(e => console.error('[MedicineStore] markTaken sync failed:', e))
                }
            },

            // ── updatePillCount ───────────────────────────────────────────────
            updatePillCount: (id, count) => {
                set((state) => ({
                    medicines: state.medicines.map(m => m.id === id ? { ...m, remainingPills: count } : m)
                }))
                const uid = getUID()
                if (uid) {
                    setDoc(mDoc(uid, 'medicines'), {
                        items: get().medicines, updatedAt: Date.now()
                    }).catch(e => console.error('[MedicineStore] updatePillCount sync failed:', e))
                }
            },

            // ── addFamilyMember ───────────────────────────────────────────────
            addFamilyMember: (name) => {
                set((state) => ({ familyMembers: [...state.familyMembers, name] }))
                const uid = getUID()
                if (uid) {
                    const s = get()
                    setDoc(mDoc(uid, 'profile'), {
                        streakCount: s.streakCount,
                        lastCheckDate: s.lastCheckDate,
                        familyMembers: s.familyMembers,
                        notificationsEnabled: s.notificationsEnabled,
                        hasRequestedPermission: s.hasRequestedPermission,
                    }).catch(e => console.error('[MedicineStore] addFamilyMember sync failed:', e))
                }
            },

            // ── setNotificationsEnabled ───────────────────────────────────────
            setNotificationsEnabled: (enabled) => {
                set({ notificationsEnabled: enabled })
                const uid = getUID()
                if (uid) {
                    const s = get()
                    setDoc(mDoc(uid, 'profile'), {
                        streakCount: s.streakCount,
                        lastCheckDate: s.lastCheckDate,
                        familyMembers: s.familyMembers,
                        notificationsEnabled: enabled,
                        hasRequestedPermission: s.hasRequestedPermission,
                    }).catch(e => console.error('[MedicineStore] setNotificationsEnabled sync failed:', e))
                }
            },

            // ── setHasRequestedPermission ─────────────────────────────────────
            setHasRequestedPermission: (requested) => {
                set({ hasRequestedPermission: requested })
                const uid = getUID()
                if (uid) {
                    const s = get()
                    setDoc(mDoc(uid, 'profile'), {
                        streakCount: s.streakCount,
                        lastCheckDate: s.lastCheckDate,
                        familyMembers: s.familyMembers,
                        notificationsEnabled: s.notificationsEnabled,
                        hasRequestedPermission: requested,
                    }).catch(e => console.error('[MedicineStore] setHasRequestedPermission sync failed:', e))
                }
            },

            // ── updateAdherence ───────────────────────────────────────────────
            updateAdherence: (date, taken, total) => {
                set((state) => {
                    const existing = state.adherenceHistory.find(h => h.date === date)
                    const newHistory = existing
                        ? state.adherenceHistory.map(h =>
                            h.date === date ? { ...h, takenDoses: taken, totalDoses: total } : h
                        )
                        : [...state.adherenceHistory, { date, takenDoses: taken, totalDoses: total }].slice(-30)
                    return { adherenceHistory: newHistory }
                })
                const uid = getUID()
                if (uid) {
                    setDoc(mDoc(uid, 'adherenceHistory'), {
                        history: get().adherenceHistory, updatedAt: Date.now()
                    }).catch(e => console.error('[MedicineStore] updateAdherence sync failed:', e))
                }
            },

            // ── markBadgeSeen ─────────────────────────────────────────────────
            markBadgeSeen: (id) => {
                set((state) => ({
                    badges: state.badges.map(b =>
                        b.id === id ? { ...b, seenAt: new Date().toISOString() } : b
                    )
                }))
                const uid = getUID()
                if (uid) {
                    setDoc(mDoc(uid, 'badges'), {
                        badges: get().badges, updatedAt: Date.now()
                    }).catch(e => console.error('[MedicineStore] markBadgeSeen sync failed:', e))
                }
            },

            // ── resetDaily ────────────────────────────────────────────────────
            resetDaily: () => {
                const today = format(new Date(), 'yyyy-MM-dd')
                const state = get()

                if (state.lastCheckDate === today) return

                const totalDoses = state.medicines.length
                const takenDoses = state.takenToday.length

                const newAdherence = totalDoses > 0
                    ? [...state.adherenceHistory, {
                        date: state.lastCheckDate,
                        totalDoses,
                        takenDoses
                    }].slice(-30)
                    : state.adherenceHistory

                const allTaken = totalDoses > 0 && takenDoses === totalDoses
                const newStreak = allTaken ? state.streakCount + 1 : 0

                const newBadges = state.badges.map(b => {
                    if (b.id === '3-day' && newStreak >= 3 && !b.unlockedAt) return { ...b, unlockedAt: today }
                    if (b.id === 'week-warrior' && newStreak >= 7 && !b.unlockedAt) return { ...b, unlockedAt: today }
                    if (b.id === 'perfect-day' && allTaken && !b.unlockedAt) return { ...b, unlockedAt: today }
                    return b
                })

                set({
                    takenToday: [],
                    lastCheckDate: today,
                    streakCount: newStreak,
                    adherenceHistory: newAdherence,
                    badges: newBadges,
                })

                const uid = getUID()
                if (uid) {
                    Promise.all([
                        setDoc(mDoc(uid, 'profile'), {
                            streakCount: newStreak,
                            lastCheckDate: today,
                            familyMembers: state.familyMembers,
                            notificationsEnabled: state.notificationsEnabled,
                            hasRequestedPermission: state.hasRequestedPermission,
                        }),
                        setDoc(mDoc(uid, 'adherenceHistory'), {
                            history: newAdherence, updatedAt: Date.now()
                        }),
                        setDoc(mDoc(uid, 'badges'), {
                            badges: newBadges, updatedAt: Date.now()
                        }),
                        setDoc(mDoc(uid, 'takenToday'), {
                            date: today, entries: []
                        }),
                    ]).catch(e => console.error('[MedicineStore] resetDaily sync failed:', e))
                }
            },
        }),
        {
            name: 'local-medicine-storage',
            storage: localPersistStorage,
            // IMPORTANT: exclude the Firestore unsubscriber — functions cannot be serialized
            partialize: (state) => {
                const { _medicineUnsubscriber, ...rest } = state as any
                void _medicineUnsubscriber
                return rest
            }
        }
    )
)
