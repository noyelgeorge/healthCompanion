import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { format, subDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid' // Re-adding uuid just in case since crypto.randomUUID isn't always fully supported

const firebaseConfig = {
    apiKey: "AIzaSyDscYUonnvEW7fsST60Cjw7gG5Rdu07S3o",
    authDomain: "calorietracking-d41e8.firebaseapp.com",
    projectId: "calorietracking-d41e8",
    storageBucket: "calorietracking-d41e8.firebasestorage.app",
    messagingSenderId: "190065413740",
    appId: "1:190065413740:web:50ec4f564732d034755249"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const mDoc = (uid, section) => doc(db, 'users', uid, 'medicine', section)
const fmt = (d) => format(d, 'yyyy-MM-dd')
const today = new Date()

async function main() {
    const cred = await signInWithEmailAndPassword(auth, 'demo@healthcompanion.app', 'Demo@1234')
    const uid = cred.user.uid
    console.log('✅ Signed in:', uid)

    // Medicine IDs — using uuidv4 instead of crypto.randomUUID() for safe global usage
    const uid_vitamin = uuidv4()
    const uid_omega = uuidv4()
    const uid_mag = uuidv4()

    // 1. medicines
    await setDoc(mDoc(uid, 'medicines'), {
        items: [
            {
                id: uid_vitamin, name: "Vitamin D3", schedule: "08:00",
                totalPills: 30, remainingPills: 16,
                notes: "Take with breakfast, 1 tablet daily",
                assignedTo: "Me", reminderOffsetMinutes: 15
            },
            {
                id: uid_omega, name: "Omega-3 Fish Oil", schedule: "13:00",
                totalPills: 60, remainingPills: 32,
                notes: "2 capsules after lunch",
                assignedTo: "Me", reminderOffsetMinutes: 10
            },
            {
                id: uid_mag, name: "Magnesium Glycinate", schedule: "21:30",
                totalPills: 30, remainingPills: 16,
                notes: "1 tablet before bed, helps with sleep",
                assignedTo: "Me", reminderOffsetMinutes: 5
            }
        ],
        updatedAt: Date.now()
    })
    console.log('✅ medicines written')

    // 2. profile
    await setDoc(mDoc(uid, 'profile'), {
        streakCount: 7,
        lastCheckDate: fmt(today),  // MUST be today's date
        familyMembers: ['Me'],
        notificationsEnabled: false,
        hasRequestedPermission: false,
    })
    console.log('✅ profile written  (streak: 7, lastCheckDate:', fmt(today), ')')

    // 3. takenToday — all 3 taken today
    await setDoc(mDoc(uid, 'takenToday'), {
        date: fmt(today),
        entries: [
            { medId: uid_vitamin, time: "08:03" },
            { medId: uid_omega, time: "13:11" },
            { medId: uid_mag, time: "21:32" }
        ]
    })
    console.log('✅ takenToday written')

    // 4. adherenceHistory — 14 days, Day 7 is partial (missed omega — cheat day)
    const history = Array.from({ length: 14 }, (_, i) => {
        const date = fmt(subDays(today, 13 - i))
        const takenDoses = (i + 1) === 7 ? 2 : 3
        return { date, totalDoses: 3, takenDoses }
    })
    await setDoc(mDoc(uid, 'adherenceHistory'), {
        history,
        updatedAt: Date.now()
    })
    console.log('✅ adherenceHistory written (14 days)')

    // 5. badges — all 4 unlocked
    await setDoc(mDoc(uid, 'badges'), {
        badges: [
            { id: 'first-dose', name: 'First Dose', description: 'Take your first medicine', icon: '💊', unlockedAt: fmt(subDays(today, 13)) },
            { id: '3-day', name: '3-Day Streak', description: 'Maintain consistency for 3 days', icon: '🔥', unlockedAt: fmt(subDays(today, 10)) },
            { id: 'week-warrior', name: 'Week Warrior', description: 'Perfect week of adherence', icon: '🛡️', unlockedAt: fmt(today) },
            { id: 'perfect-day', name: 'Perfect Day', description: 'Take all scheduled doses in one day', icon: '🌟', unlockedAt: fmt(subDays(today, 13)) }
        ],
        updatedAt: Date.now()
    })
    console.log('✅ badges written (all 4 unlocked)')

    console.log(`\n🎉 Done! Firestore path: users/${uid}/medicine/`)
    console.log('5 documents written: profile, medicines, takenToday, adherenceHistory, badges')
    process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
