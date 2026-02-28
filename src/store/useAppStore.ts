import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { format } from 'date-fns'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, addDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { type RecipeBookItem, addToRecipeBook as firestoreAddRecipe, getRecipeBook as firestoreGetRecipes, removeFromRecipeBook as firestoreRemoveRecipe } from '../services/social'

export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
export type Goal = 'lose' | 'maintain' | 'gain'

export interface UserProfile {
    isAuthenticated: boolean
    uid?: string
    name: string
    email: string
    phoneNumber?: string
    height: number
    weight: number
    age: number
    gender: Gender
    activityLevel: ActivityLevel
    goal: Goal
    onboardingCompleted: boolean
    photoURL?: string
    waterGoal: number
}

export interface MealEntry {
    id: string
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    ingredients?: string[]
    healthScore?: number
    reasoning?: string
    timestamp: number
}

export interface DayLog {
    date: string
    entries: MealEntry[]
    waterIntake: number
}

export interface DayPlan {
    date: string
    entries: MealEntry[]
    totalCalories: number
}

export type ExerciseType = 'walk' | 'run' | 'bike' | 'strength' | 'yoga' | 'other'

export interface ExerciseEntry {
    id: string
    name: string
    type: ExerciseType
    durationMinutes: number
    intensity: 'low' | 'moderate' | 'high'
    calories?: number
    timestamp: number
}

export interface DayExerciseLog {
    date: string
    entries: ExerciseEntry[]
}

export interface Reminder {
    id: string
    medicineName: string
    time: string
    notes: string
    enabled: boolean
    phoneNumber?: string
    createdAt: number
}

export interface WeightEntry {
    date: string
    weight: number
    timestamp: number
}

interface AppState {
    user: UserProfile
    logs: Record<string, DayLog>
    plans: Record<string, DayPlan>
    exerciseLogs: Record<string, DayExerciseLog>
    recipeBook: RecipeBookItem[]
    reminders: Reminder[]
    medicineMode: boolean
    weightHistory: WeightEntry[]
    streaks: {
        current: number
        longest: number
        lastLoggedDate?: string
    }
    apiKey: string | null
    usdaApiKey: string | null
    sharedApiKey: string | null
    theme: 'light' | 'dark' | 'system'
    isDesktopView: boolean
    lastSyncedAt: string | null
    unsubscribers: Unsubscribe[]

    // Actions
    login: () => void
    logout: () => Promise<void>
    cleanup: () => void
    setUser: (profile: Partial<UserProfile>) => Promise<void>
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    toggleMedicineMode: () => void
    setApiKey: (key: string | null) => void
    setUsdaApiKey: (key: string | null) => void
    addEntry: (date: string, entry: Omit<MealEntry, 'id' | 'timestamp'>) => Promise<void>
    updateEntry: (date: string, updatedEntry: MealEntry) => Promise<void>
    removeEntry: (date: string, entryId: string) => Promise<void>
    addPlanEntry: (date: string, entry: Omit<MealEntry, 'id' | 'timestamp'>) => Promise<void>
    updatePlanEntry: (date: string, updatedEntry: MealEntry) => Promise<void>
    removePlanEntry: (date: string, entryId: string) => Promise<void>
    addExerciseEntry: (date: string, entry: Omit<ExerciseEntry, 'id' | 'timestamp'>) => Promise<void>
    removeExerciseEntry: (date: string, entryId: string) => Promise<void>
    syncWithFirestore: () => Promise<void>
    loadRecipeBook: () => Promise<void>
    addToRecipeBook: (item: Omit<RecipeBookItem, 'id' | 'addedAt'>) => Promise<void>
    removeFromRecipeBook: (id: string) => Promise<void>
    addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<void>
    removeReminder: (id: string) => Promise<void>
    clearAllReminders: () => Promise<void>
    updateWaterIntake: (date: string, amount: number) => Promise<void>
    logWeight: (weight: number) => Promise<void>
    toggleDesktopView: () => void
    wipeAllData: () => Promise<void>
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: {
                isAuthenticated: false,
                name: 'Guest',
                email: '',
                phoneNumber: '',
                height: 170,
                weight: 70,
                age: 30,
                gender: 'male',
                activityLevel: 'moderate',
                goal: 'maintain',
                onboardingCompleted: false,
                waterGoal: 2000
            },
            logs: {},
            plans: {},
            exerciseLogs: {},
            recipeBook: [],
            reminders: [],
            medicineMode: false,
            weightHistory: [],
            streaks: {
                current: 0,
                longest: 0
            },
            apiKey: null,
            usdaApiKey: null,
            sharedApiKey: null,
            theme: 'system',
            isDesktopView: false,
            lastSyncedAt: null,
            unsubscribers: [],

            login: () => set((state: AppState) => ({ user: { ...state.user, isAuthenticated: true } })),

            logout: async () => {
                const state = useAppStore.getState()
                state.cleanup()
                try {
                    await signOut(auth)
                } catch (e) {
                    console.error('Sign out error:', e)
                }
                set({
                    user: {
                        isAuthenticated: false,
                        name: 'Guest',
                        email: '',
                        phoneNumber: '',
                        height: 170,
                        weight: 70,
                        age: 30,
                        gender: 'male',
                        activityLevel: 'moderate',
                        goal: 'maintain',
                        onboardingCompleted: false,
                        waterGoal: 2000
                    },
                    logs: {},
                    plans: {},
                    exerciseLogs: {},
                    recipeBook: [],
                    reminders: [],
                    medicineMode: false,
                    weightHistory: [],
                    streaks: { current: 0, longest: 0 },
                    apiKey: null,
                    usdaApiKey: null,
                    sharedApiKey: null,
                    lastSyncedAt: null,
                    unsubscribers: []
                })
            },

            cleanup: () => {
                const state = useAppStore.getState()
                if (state.unsubscribers && Array.isArray(state.unsubscribers)) {
                    state.unsubscribers.forEach((unsub) => {
                        if (typeof unsub === 'function') {
                            try { unsub() } catch (e) { console.error('Unsubscribe error:', e) }
                        }
                    })
                }
                set({ unsubscribers: [] })
            },

            setUser: async (profile: Partial<UserProfile>) => {
                set((state: AppState) => ({ user: { ...state.user, ...profile } }))
                const latestState = useAppStore.getState()
                if (latestState.user.isAuthenticated && latestState.user.uid) {
                    try {
                        await setDoc(doc(db, 'users', latestState.user.uid!), latestState.user, { merge: true })
                    } catch (e) {
                        console.error('Firestore profile sync error:', e)
                    }
                }
            },

            setApiKey: (key: string | null) => set({ apiKey: key }),
            setUsdaApiKey: (key: string | null) => set({ usdaApiKey: key }),
            setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
            toggleMedicineMode: () => set((state: AppState) => ({ medicineMode: !state.medicineMode })),
            toggleDesktopView: () => set((state: AppState) => ({ isDesktopView: !state.isDesktopView })),

            addEntry: async (date: string, entry: Omit<MealEntry, 'id' | 'timestamp'>) => {
                const newEntry: MealEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }
                const state = useAppStore.getState()
                const existingLog = state.logs[date] || { date, entries: [], waterIntake: 0 }
                const updatedLog = { ...existingLog, entries: [...existingLog.entries, newEntry] }
                set({ logs: { ...state.logs, [date]: updatedLog } })

                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                const yesterdayStr = yesterday.toISOString().split('T')[0]
                const newStreaks = { ...state.streaks }

                if (state.streaks.lastLoggedDate !== date) {
                    if (state.streaks.lastLoggedDate === yesterdayStr) {
                        newStreaks.current += 1
                    } else if (!state.streaks.lastLoggedDate || state.streaks.lastLoggedDate < yesterdayStr) {
                        newStreaks.current = 1
                    }
                    newStreaks.longest = Math.max(newStreaks.longest, newStreaks.current)
                    newStreaks.lastLoggedDate = date
                    set({ streaks: newStreaks })
                    if (state.user.isAuthenticated && state.user.uid) {
                        await setDoc(doc(db, 'users', state.user.uid!), { streaks: newStreaks }, { merge: true })
                    }
                }

                if (state.user.isAuthenticated && state.user.uid) {
                    try {
                        await setDoc(doc(db, 'users', state.user.uid!, 'logs', date), updatedLog)
                    } catch (e) {
                        console.error('Firestore sync error:', e)
                    }
                }
            },

            updateEntry: async (date: string, updatedEntry: MealEntry) => {
                const state = useAppStore.getState()
                const log = state.logs[date]
                if (!log) return
                const updatedLog = { ...log, entries: log.entries.map((e: MealEntry) => e.id === updatedEntry.id ? { ...e, ...updatedEntry } : e) }
                set({ logs: { ...state.logs, [date]: updatedLog } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'logs', date), updatedLog) } catch (e) { console.error('Firestore sync error:', e) }
                }
            },

            removeEntry: async (date: string, entryId: string) => {
                const state = useAppStore.getState()
                const log = state.logs[date]
                if (!log) return
                const updatedLog = { ...log, entries: log.entries.filter((e: MealEntry) => e.id !== entryId) }
                set({ logs: { ...state.logs, [date]: updatedLog } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'logs', date), updatedLog) } catch (e) { console.error('Firestore sync error:', e) }
                }
            },

            addPlanEntry: async (date: string, entry: Omit<MealEntry, 'id' | 'timestamp'>) => {
                const newEntry: MealEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }
                const state = useAppStore.getState()
                const existingPlan = state.plans[date] || { date, entries: [], totalCalories: 0 }
                const updatedPlan = { ...existingPlan, entries: [...existingPlan.entries, newEntry] }
                set({ plans: { ...state.plans, [date]: updatedPlan } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'plans', date), updatedPlan) } catch (e) { console.error('Firestore sync error:', e) }
                }
            },

            updatePlanEntry: async (date: string, updatedEntry: MealEntry) => {
                const state = useAppStore.getState()
                const plan = state.plans[date]
                if (!plan) return
                const updatedPlan = { ...plan, entries: plan.entries.map((e: MealEntry) => e.id === updatedEntry.id ? updatedEntry : e) }
                set({ plans: { ...state.plans, [date]: updatedPlan } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'plans', date), updatedPlan) } catch (e) { console.error('Firestore sync error:', e) }
                }
            },

            removePlanEntry: async (date: string, entryId: string) => {
                const state = useAppStore.getState()
                const plan = state.plans[date]
                if (!plan) return
                const updatedPlan = { ...plan, entries: plan.entries.filter((e: MealEntry) => e.id !== entryId) }
                set({ plans: { ...state.plans, [date]: updatedPlan } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'plans', date), updatedPlan) } catch (e) { console.error('Firestore sync error:', e) }
                }
            },

            addExerciseEntry: async (date: string, entry: Omit<ExerciseEntry, 'id' | 'timestamp'>) => {
                const newEntry: ExerciseEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }
                const state = useAppStore.getState()
                const existingLog = state.exerciseLogs[date] || { date, entries: [] }
                const updatedLog: DayExerciseLog = { ...existingLog, entries: [...existingLog.entries, newEntry] }
                set({ exerciseLogs: { ...state.exerciseLogs, [date]: updatedLog } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'exercises', date), updatedLog) } catch (e) { console.error('Firestore exercise sync error:', e) }
                }
            },

            removeExerciseEntry: async (date: string, entryId: string) => {
                const state = useAppStore.getState()
                const log = state.exerciseLogs[date]
                if (!log) return
                const updatedLog: DayExerciseLog = { ...log, entries: log.entries.filter((e: ExerciseEntry) => e.id !== entryId) }
                set({ exerciseLogs: { ...state.exerciseLogs, [date]: updatedLog } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'exercises', date), updatedLog) } catch (e) { console.error('Firestore exercise sync error:', e) }
                }
            },

            syncWithFirestore: async () => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return

                try {
                    const userDoc = await getDoc(doc(db, 'users', state.user.uid!))
                    if (userDoc.exists()) {
                        set({ user: { ...state.user, ...userDoc.data() } as UserProfile })
                    }

                    const logsColl = collection(db, 'users', state.user.uid!, 'logs')
                    const logsSnap = await getDocs(logsColl)
                    const fetchedLogs: Record<string, DayLog> = {}
                    logsSnap.forEach((d) => { fetchedLogs[d.id] = d.data() as DayLog })

                    const plansColl = collection(db, 'users', state.user.uid!, 'plans')
                    const plansSnap = await getDocs(plansColl)
                    const fetchedPlans: Record<string, DayPlan> = {}
                    plansSnap.forEach((d) => { fetchedPlans[d.id] = d.data() as DayPlan })

                    const exercisesColl = collection(db, 'users', state.user.uid!, 'exercises')
                    const exercisesSnap = await getDocs(exercisesColl)
                    const fetchedExercises: Record<string, DayExerciseLog> = {}
                    exercisesSnap.forEach((d) => { fetchedExercises[d.id] = d.data() as DayExerciseLog })

                    const remindersColl = collection(db, 'users', state.user.uid!, 'reminders')
                    const remindersSnap = await getDocs(remindersColl)
                    const fetchedReminders: Reminder[] = []
                    remindersSnap.forEach((d) => { fetchedReminders.push({ ...d.data(), id: d.id } as Reminder) })

                    const weightColl = collection(db, 'users', state.user.uid!, 'weightHistory')
                    const weightSnap = await getDocs(weightColl)
                    const fetchedWeight: WeightEntry[] = []
                    weightSnap.forEach((d) => { fetchedWeight.push({ ...d.data(), date: d.id } as WeightEntry) })
                    fetchedWeight.sort((a, b) => a.timestamp - b.timestamp)

                    set({
                        logs: fetchedLogs,
                        plans: fetchedPlans,
                        exerciseLogs: fetchedExercises,
                        reminders: fetchedReminders,
                        weightHistory: fetchedWeight,
                        lastSyncedAt: new Date().toISOString()
                    })

                    // Real-time Listeners
                    const unsubProfile = onSnapshot(doc(db, 'users', state.user.uid!), (snap) => {
                        if (snap.exists()) {
                            set((s: AppState) => ({ user: { ...s.user, ...snap.data() } as UserProfile }))
                        }
                    })

                    const unsubLogs = onSnapshot(collection(db, 'users', state.user.uid!, 'logs'), (snapshot) => {
                        const fl: Record<string, DayLog> = {}
                        snapshot.forEach((d) => { fl[d.id] = d.data() as DayLog })
                        set({ logs: fl })
                    })

                    const unsubExercises = onSnapshot(collection(db, 'users', state.user.uid!, 'exercises'), (snapshot) => {
                        const fe: Record<string, DayExerciseLog> = {}
                        snapshot.forEach((d) => { fe[d.id] = d.data() as DayExerciseLog })
                        set({ exerciseLogs: fe })
                    })

                    const unsubWeight = onSnapshot(collection(db, 'users', state.user.uid!, 'weightHistory'), (snapshot) => {
                        const fw: WeightEntry[] = []
                        snapshot.forEach((d) => { fw.push({ ...d.data(), date: d.id } as WeightEntry) })
                        fw.sort((a, b) => a.timestamp - b.timestamp)
                        set({ weightHistory: fw })
                    })

                    set((s: AppState) => ({
                        unsubscribers: [...s.unsubscribers, unsubProfile, unsubLogs, unsubExercises, unsubWeight]
                    }))
                } catch (e) {
                    console.error('Firestore hydration error:', e)
                }
            },

            loadRecipeBook: async () => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return
                try {
                    const recipes = await firestoreGetRecipes(state.user.uid!)
                    set({ recipeBook: recipes })
                } catch (error) {
                    console.error('Failed to load recipe book', error)
                }
            },

            addToRecipeBook: async (item: Omit<RecipeBookItem, 'id' | 'addedAt'>) => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return
                try {
                    const id = await firestoreAddRecipe(state.user.uid!, item)
                    const newItem: RecipeBookItem = { ...item, id, addedAt: Date.now() }
                    set((s: AppState) => ({ recipeBook: [newItem, ...s.recipeBook] }))
                } catch (error) {
                    console.error('Failed to add to recipe book', error)
                    throw error
                }
            },

            removeFromRecipeBook: async (id: string) => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return
                try {
                    await firestoreRemoveRecipe(state.user.uid!, id)
                    set((s: AppState) => ({ recipeBook: s.recipeBook.filter((i: RecipeBookItem) => i.id !== id) }))
                } catch (error) {
                    console.error('Failed to remove from recipe book', error)
                    throw error
                }
            },

            addReminder: async (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return
                const newReminder: Reminder = { ...reminderData, id: crypto.randomUUID(), createdAt: Date.now() }
                set((s: AppState) => ({ reminders: [...s.reminders, newReminder] }))
                try {
                    const docRef = await addDoc(collection(db, 'users', state.user.uid!, 'reminders'), { ...newReminder })
                    set((s: AppState) => ({
                        reminders: s.reminders.map((r: Reminder) => r.id === newReminder.id ? { ...r, id: docRef.id } : r)
                    }))
                } catch (e) {
                    console.error('Failed to add reminder', e)
                }
            },

            removeReminder: async (id: string) => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return
                set((s: AppState) => ({ reminders: s.reminders.filter((r: Reminder) => r.id !== id) }))
                try {
                    await deleteDoc(doc(db, 'users', state.user.uid!, 'reminders', id))
                } catch (e) {
                    console.error('Failed to remove reminder', e)
                }
            },

            clearAllReminders: async () => {
                const state = useAppStore.getState()
                if (!state.user.isAuthenticated || !state.user.uid) return
                const ids = state.reminders.map((r: Reminder) => r.id)
                set({ reminders: [] })
                try {
                    await Promise.all(ids.map((id: string) => deleteDoc(doc(db, 'users', state.user.uid!, 'reminders', id))))
                } catch (e) {
                    console.error('Failed to clear reminders', e)
                }
            },

            updateWaterIntake: async (date: string, amount: number) => {
                const state = useAppStore.getState()
                const existingLog = state.logs[date] || { date, entries: [], waterIntake: 0 }
                const updatedLog = { ...existingLog, waterIntake: amount }
                set({ logs: { ...state.logs, [date]: updatedLog } })
                if (state.user.isAuthenticated && state.user.uid) {
                    try { await setDoc(doc(db, 'users', state.user.uid!, 'logs', date), updatedLog) } catch (e) { console.error('Firestore water sync error:', e) }
                }
            },

            logWeight: async (weight: number) => {
                const date = new Date().toISOString().split('T')[0]
                const timestamp = Date.now()
                const newEntry: WeightEntry = { date, weight, timestamp }
                const state = useAppStore.getState()
                set((s: AppState) => {
                    const filtered = s.weightHistory.filter((w: WeightEntry) => w.date !== date)
                    const updatedHistory = [...filtered, newEntry].sort((a, b) => a.timestamp - b.timestamp)
                    return { weightHistory: updatedHistory, user: { ...s.user, weight } }
                })
                if (state.user.isAuthenticated && state.user.uid) {
                    try {
                        await setDoc(doc(db, 'users', state.user.uid!), { weight }, { merge: true })
                        await setDoc(doc(db, 'users', state.user.uid!, 'weightHistory', date), newEntry)
                    } catch (e) {
                        console.error('Failed to log weight to Firestore', e)
                    }
                }
            },
            wipeAllData: async () => {
                const state = useAppStore.getState()
                const { uid, isAuthenticated } = state.user

                // 1. Unsubscribe from all Firestore listeners immediately
                state.cleanup()

                // 2. Clear Local State
                set({
                    logs: {},
                    plans: {},
                    exerciseLogs: {},
                    recipeBook: [],
                    reminders: [],
                    weightHistory: [],
                    streaks: { current: 0, longest: 0 },
                    lastSyncedAt: null,
                    unsubscribers: []
                })

                // 3. NUCLEAR WIPE of all local browser storage
                try {
                    // Clear service workers
                    if ('serviceWorker' in navigator) {
                        const regs = await navigator.serviceWorker.getRegistrations()
                        for (const r of regs) await r.unregister()
                    }
                    // Clear caches
                    if ('caches' in window) {
                        const names = await caches.keys()
                        await Promise.all(names.map(n => caches.delete(n)))
                    }
                    localStorage.clear()
                    sessionStorage.clear()
                } catch (e) {
                    console.error('Error clearing local cache:', e)
                }

                // 4. Delete Firestore Data
                if (isAuthenticated && uid) {
                    try {
                        const collectionsToDelete = ['logs', 'plans', 'exercises', 'reminders', 'weightHistory', 'recipeBook']
                        for (const colName of collectionsToDelete) {
                            const colRef = collection(db, 'users', uid, colName)
                            const snap = await getDocs(colRef)
                            // Delete in batches to be more reliable
                            const docs = snap.docs
                            await Promise.all(docs.map(d => deleteDoc(d.ref)))
                        }
                        // Reset streaks in user doc
                        await setDoc(doc(db, 'users', uid), { streaks: { current: 0, longest: 0 } }, { merge: true })
                    } catch (e) {
                        console.error('Failed to wipe Firestore data:', e)
                        throw e
                    }
                }
            },
        }),
        {
            name: 'nutri-track-storage-v2',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: AppState) => {
                const { unsubscribers, ...rest } = state
                void unsubscribers
                return rest
            }
        }
    )
)

// Initialize Firebase Auth listener
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        await useAppStore.getState().setUser({
            isAuthenticated: true,
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User'
        })
        const state = useAppStore.getState()
        if (state.user.isAuthenticated && state.user.uid) {
            await state.syncWithFirestore()
            await state.loadRecipeBook()
        }
    } else {
        useAppStore.getState().setUser({
            isAuthenticated: false,
            email: '',
            name: 'Guest'
        })
    }
})

// Keep format import used
export const _formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
