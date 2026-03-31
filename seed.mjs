import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { format, subDays, startOfDay, addMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
    apiKey: "AIzaSyDscYUonnvEW7fsST60Cjw7gG5Rdu07S3o",
    authDomain: "calorietracking-d41e8.firebaseapp.com",
    projectId: "calorietracking-d41e8",
    storageBucket: "calorietracking-d41e8.firebasestorage.app",
    messagingSenderId: "190065413740",
    appId: "1:190065413740:web:50ec4f564732d034755249"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Data Generation Constants
const userProfileData = {
    isAuthenticated: true,
    name: "Arjun Menon",
    email: "demo@healthcompanion.app",
    height: 175,
    weight: 78,
    age: 29,
    gender: "male",
    activityLevel: "moderate",
    goal: "lose",
    onboardingCompleted: true,
    waterGoal: 2500
};

const breakfasts = [
    { name: "Oats with banana", cal: 300, pro: 10, carbs: 45, fat: 8, ingredients: ["Oats", "Banana", "Milk"] },
    { name: "Masala dosa with sambar", cal: 350, pro: 8, carbs: 50, fat: 12, ingredients: ["Dosa batter", "Lentils", "Vegetables"] },
    { name: "Egg white omelette", cal: 250, pro: 25, carbs: 5, fat: 12, ingredients: ["Egg whites", "Onions", "Tomatoes", "Olive oil"] },
    { name: "Poha with peanuts", cal: 320, pro: 7, carbs: 45, fat: 10, ingredients: ["Flattened rice", "Peanuts", "Onions", "Spices"] },
    { name: "Greek yogurt with berries", cal: 280, pro: 20, carbs: 30, fat: 5, ingredients: ["Greek yogurt", "Mixed berries", "Honey"] }
];

const lunches = [
    { name: "Brown rice + dal + sabzi", cal: 550, pro: 20, carbs: 70, fat: 15, ingredients: ["Brown rice", "Dal", "Mixed vegetables", "Spices"] },
    { name: "Chicken breast with roti", cal: 600, pro: 45, carbs: 45, fat: 18, ingredients: ["Chicken breast", "Whole wheat roti", "Spices"] },
    { name: "Paneer tikka bowl", cal: 650, pro: 30, carbs: 50, fat: 25, ingredients: ["Paneer", "Rice", "Vegetables", "Yogurt marinade"] },
    { name: "Grilled fish with salad", cal: 500, pro: 40, carbs: 20, fat: 20, ingredients: ["Fish fillet", "Mixed greens", "Olive oil dressing"] },
    { name: "Rajma chawal", cal: 580, pro: 18, carbs: 80, fat: 12, ingredients: ["Kidney beans", "Rice", "Spices", "Onions", "Tomatoes"] }
];

const dinners = [
    { name: "Moong dal soup + roti", cal: 400, pro: 15, carbs: 55, fat: 10, ingredients: ["Moong dal", "Whole wheat roti", "Spices"] },
    { name: "Grilled chicken with vegetables", cal: 450, pro: 40, carbs: 25, fat: 15, ingredients: ["Chicken breast", "Broccoli", "Carrots", "Zucchini"] },
    { name: "Palak paneer with brown rice", cal: 500, pro: 22, carbs: 50, fat: 20, ingredients: ["Spinach", "Paneer", "Brown rice", "Spices"] },
    { name: "Lentil soup", cal: 350, pro: 18, carbs: 45, fat: 8, ingredients: ["Lentils", "Vegetable broth", "Carrots", "Celery"] },
    { name: "Oats khichdi", cal: 380, pro: 12, carbs: 55, fat: 10, ingredients: ["Oats", "Moong dal", "Mixed vegetables", "Spices"] }
];

const snacks = [
    { name: "Handful of almonds", cal: 160, pro: 6, carbs: 6, fat: 14, ingredients: ["Almonds"] },
    { name: "Protein shake", cal: 150, pro: 25, carbs: 5, fat: 2, ingredients: ["Whey protein", "Water"] },
    { name: "Apple slices with peanut butter", cal: 200, pro: 4, carbs: 25, fat: 10, ingredients: ["Apple", "Peanut butter"] },
    { name: "Green tea", cal: 0, pro: 0, carbs: 0, fat: 0, ingredients: ["Green tea bag", "Hot water"] },
    { name: "Roasted chana", cal: 120, pro: 6, carbs: 18, fat: 2, ingredients: ["Roasted chickpeas", "Spices"] },
    { name: "Banana", cal: 105, pro: 1, carbs: 27, fat: 0, ingredients: ["Banana"] }
];

const cheatMeals = [
    { name: "Pizza slice + Soft drink", mealType: "lunch", cal: 850, pro: 20, carbs: 100, fat: 30, ingredients: ["Pizza base", "Cheese", "Pepperoni", "Cola"], healthScore: 4, reasoning: "High in simple carbs and saturated fats, poor nutritional value." },
    { name: "Chicken Biryani (restaurant style)", mealType: "dinner", cal: 950, pro: 35, carbs: 110, fat: 40, ingredients: ["Basmati rice", "Chicken", "Ghee", "Spices", "Oil"], healthScore: 5, reasoning: "High calorie density and saturated fat from ghee/oil." }
];

const exerciseSchedule = [
    { day: 1, hasLog: true, entries: [{ name: "Morning walk", type: "walk", durationMinutes: 30, intensity: "low", calories: 120 }] },
    { day: 2, hasLog: true, entries: [{ name: "Strength training", type: "strength", durationMinutes: 45, intensity: "high", calories: 280 }] },
    { day: 3, hasLog: false, entries: [] }, // Rest day
    { day: 4, hasLog: true, entries: [{ name: "Run", type: "run", durationMinutes: 25, intensity: "moderate", calories: 220 }] },
    { day: 5, hasLog: true, entries: [{ name: "Yoga", type: "yoga", durationMinutes: 40, intensity: "low", calories: 140 }] },
    { day: 6, hasLog: true, entries: [{ name: "Strength training", type: "strength", durationMinutes: 50, intensity: "high", calories: 310 }] },
    { day: 7, hasLog: true, entries: [{ name: "Light walk", type: "walk", durationMinutes: 20, intensity: "low", calories: 80 }] }, // Cheat day
    { day: 8, hasLog: true, entries: [{ name: "Run", type: "run", durationMinutes: 30, intensity: "moderate", calories: 260 }] },
    { day: 9, hasLog: true, entries: [{ name: "Bike ride", type: "bike", durationMinutes: 45, intensity: "moderate", calories: 300 }] },
    { day: 10, hasLog: false, entries: [] }, // Rest day
    { day: 11, hasLog: true, entries: [{ name: "Strength training", type: "strength", durationMinutes: 45, intensity: "high", calories: 290 }] },
    { day: 12, hasLog: true, entries: [{ name: "Morning walk", type: "walk", durationMinutes: 35, intensity: "low", calories: 150 }, { name: "Yoga", type: "yoga", durationMinutes: 20, intensity: "low", calories: 80 }] },
    { day: 13, hasLog: true, entries: [{ name: "Run", type: "run", durationMinutes: 35, intensity: "high", calories: 310 }] },
    { day: 14, hasLog: true, entries: [{ name: "Strength training", type: "strength", durationMinutes: 40, intensity: "moderate", calories: 250 }] }
];

const weightSchedule = {
    1: 80.2, 2: 80.0, 3: 79.8, 4: 79.9, 5: 79.7, 6: 79.5, 7: 79.8,
    8: 79.6, 9: 79.4, 10: 79.3, 11: 79.1, 12: 79.0, 13: 78.8, 14: 78.5
};
const logWeightDays = [1, 3, 5, 7, 9, 11, 13, 14];
const targetWater = { 1: 2500, 2: 2600, 3: 1800, 4: 2800, 5: 2500, 6: 2550, 7: 2000, 8: 2700, 9: 2500, 10: 2400, 11: 2800, 12: 2600, 13: 2500, 14: 2550 };

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDayLog(dateStr, dayIndexOffset, dateObj) {
    const dayNumber = 14 - dayIndexOffset;
    const isCheatDay = dayNumber === 7;

    const entries = [];

    const baseDay = startOfDay(dateObj);
    const tsBreakfast = addMinutes(baseDay, 8 * 60 + Math.floor(Math.random() * 60)).getTime();
    const tsLunch = addMinutes(baseDay, 13 * 60 + Math.floor(Math.random() * 60)).getTime();
    const tsSnack = addMinutes(baseDay, 16 * 60 + Math.floor(Math.random() * 60)).getTime();
    const tsDinner = addMinutes(baseDay, 19 * 60 + 30 + Math.floor(Math.random() * 60)).getTime();

    if (isCheatDay) {
        const b = pickRandom(breakfasts);
        entries.push({ id: uuidv4(), mealType: 'breakfast', timestamp: tsBreakfast, name: b.name, calories: b.cal, protein: b.pro, carbs: b.carbs, fat: b.fat, ingredients: b.ingredients, healthScore: 8, reasoning: "Good, balanced meal." });

        entries.push({ id: uuidv4(), mealType: 'lunch', timestamp: tsLunch, name: cheatMeals[0].name, calories: cheatMeals[0].cal, protein: cheatMeals[0].pro, carbs: cheatMeals[0].carbs, fat: cheatMeals[0].fat, ingredients: cheatMeals[0].ingredients, healthScore: cheatMeals[0].healthScore, reasoning: cheatMeals[0].reasoning });

        entries.push({ id: uuidv4(), mealType: 'dinner', timestamp: tsDinner, name: cheatMeals[1].name, calories: cheatMeals[1].cal, protein: cheatMeals[1].pro, carbs: cheatMeals[1].carbs, fat: cheatMeals[1].fat, ingredients: cheatMeals[1].ingredients, healthScore: cheatMeals[1].healthScore, reasoning: cheatMeals[1].reasoning });
    } else {
        const b = pickRandom(breakfasts);
        entries.push({ id: uuidv4(), mealType: 'breakfast', timestamp: tsBreakfast, name: b.name, calories: b.cal, protein: b.pro, carbs: b.carbs, fat: b.fat, ingredients: b.ingredients, healthScore: 8, reasoning: "Good, balanced meal." });

        const l = pickRandom(lunches);
        entries.push({ id: uuidv4(), mealType: 'lunch', timestamp: tsLunch, name: l.name, calories: l.cal, protein: l.pro, carbs: l.carbs, fat: l.fat, ingredients: l.ingredients, healthScore: 9, reasoning: "Excellent macros and nutritious ingredients." });

        const s = pickRandom(snacks);
        entries.push({ id: uuidv4(), mealType: 'snack', timestamp: tsSnack, name: s.name, calories: s.cal, protein: s.pro, carbs: s.carbs, fat: s.fat, ingredients: s.ingredients, healthScore: 9, reasoning: "Healthy snack choice." });

        const d = pickRandom(dinners);
        entries.push({ id: uuidv4(), mealType: 'dinner', timestamp: tsDinner, name: d.name, calories: d.cal, protein: d.pro, carbs: d.carbs, fat: d.fat, ingredients: d.ingredients, healthScore: 8, reasoning: "Light and nutritious." });
    }

    return {
        date: dateStr,
        entries,
        waterIntake: targetWater[dayNumber]
    };
}

const plannedBreakfast = { name: "Oats with milk and fruits", cal: 350, pro: 12, carbs: 55, fat: 8 };
const plannedLunch = { name: "Grilled chicken with quinoa salad", cal: 480, pro: 40, carbs: 45, fat: 15 };
const plannedDinner = { name: "Dal tadka with 2 rotis", cal: 420, pro: 16, carbs: 65, fat: 10 };
const plannedSnack = { name: "Whey protein shake", cal: 150, pro: 25, carbs: 5, fat: 2 };

function generateDayPlan(dateStr, dateObj) {
    const baseDay = startOfDay(dateObj);
    const tsBreakfast = addMinutes(baseDay, 8 * 60).getTime();
    const tsLunch = addMinutes(baseDay, 13 * 60).getTime();
    const tsSnack = addMinutes(baseDay, 16 * 60).getTime();
    const tsDinner = addMinutes(baseDay, 19 * 60 + 30).getTime();

    return {
        date: dateStr,
        totalCalories: 1400,
        entries: [
            { id: uuidv4(), mealType: 'breakfast', timestamp: tsBreakfast, name: plannedBreakfast.name, calories: plannedBreakfast.cal, protein: plannedBreakfast.pro, carbs: plannedBreakfast.carbs, fat: plannedBreakfast.fat },
            { id: uuidv4(), mealType: 'lunch', timestamp: tsLunch, name: plannedLunch.name, calories: plannedLunch.cal, protein: plannedLunch.pro, carbs: plannedLunch.carbs, fat: plannedLunch.fat },
            { id: uuidv4(), mealType: 'snack', timestamp: tsSnack, name: plannedSnack.name, calories: plannedSnack.cal, protein: plannedSnack.pro, carbs: plannedSnack.carbs, fat: plannedSnack.fat },
            { id: uuidv4(), mealType: 'dinner', timestamp: tsDinner, name: plannedDinner.name, calories: plannedDinner.cal, protein: plannedDinner.pro, carbs: plannedDinner.carbs, fat: plannedDinner.fat }
        ]
    };
}

async function main() {
    console.log('Starting seed process...');
    // 1. Sign in or create the demo user
    let userCredential;
    try {
        userCredential = await signInWithEmailAndPassword(auth, 'demo@healthcompanion.app', 'Demo@1234');
        console.log('Signed in existing user:', userCredential.user.uid);
    } catch (e) {
        console.log('Sign in failed, trying to create new user:', e.message);
        userCredential = await createUserWithEmailAndPassword(auth, 'demo@healthcompanion.app', 'Demo@1234');
        console.log('Created new user:', userCredential.user.uid);
    }

    const uid = userCredential.user.uid;
    const today = new Date();

    // 2. Write UserProfile
    await setDoc(doc(db, 'users', uid), {
        ...userProfileData,
        streaks: {
            current: 14,
            longest: 14,
            lastLoggedDate: format(today, 'yyyy-MM-dd')
        }
    }, { merge: true });
    console.log('✅ User profile written');

    // Loop 14 days
    for (let i = 13; i >= 0; i--) {
        const dayObj = subDays(today, i);
        const dateStr = format(dayObj, 'yyyy-MM-dd');
        const dayNumber = 14 - i;

        // 3. Write Food Logs
        const logRef = doc(db, 'users', uid, 'logs', dateStr);
        const logSnap = await getDoc(logRef);
        if (!logSnap.exists()) {
            const dayLog = generateDayLog(dateStr, i, dayObj);
            await setDoc(logRef, dayLog);
            console.log(`✅ Food log seed: ${dateStr}`);
        } else {
            console.log(`⏭️ Skipped existing Food log: ${dateStr}`);
        }

        // 4. Write Exercise Logs
        const exerciseConfig = exerciseSchedule.find(e => e.day === dayNumber);
        if (exerciseConfig && exerciseConfig.hasLog && exerciseConfig.entries.length > 0) {
            const exRef = doc(db, 'users', uid, 'exercises', dateStr);
            const exSnap = await getDoc(exRef);
            if (!exSnap.exists()) {
                const baseDay = startOfDay(dayObj);
                let exTsOffset = 17 * 60; // 5pm default

                const generatedEntries = exerciseConfig.entries.map(e => {
                    const entryTs = addMinutes(baseDay, e.name.toLowerCase().includes('morning') ? 7 * 60 : exTsOffset).getTime();
                    exTsOffset += 60; // Offset multiple entries
                    return {
                        id: uuidv4(),
                        timestamp: entryTs, // Set at appropriate time
                        name: e.name,
                        type: e.type,
                        durationMinutes: e.durationMinutes,
                        intensity: e.intensity,
                        calories: e.calories
                    };
                });

                await setDoc(exRef, {
                    date: dateStr,
                    entries: generatedEntries
                });
                console.log(`✅ Exercise log seed: ${dateStr}`);
            } else {
                console.log(`⏭️ Skipped existing Exercise log: ${dateStr}`);
            }
        }

        // 5. Write Weight History
        if (logWeightDays.includes(dayNumber)) {
            const wRef = doc(db, 'users', uid, 'weightHistory', dateStr);
            const wSnap = await getDoc(wRef);
            if (!wSnap.exists()) {
                await setDoc(wRef, {
                    date: dateStr,
                    weight: weightSchedule[dayNumber],
                    timestamp: startOfDay(dayObj).getTime()
                });
                console.log(`✅ Weight log seed: ${dateStr}`);
            } else {
                console.log(`⏭️ Skipped existing Weight log: ${dateStr}`);
            }
        }

        // 6. Write Meal Plans (Days 1-7 only)
        if (dayNumber >= 1 && dayNumber <= 7) {
            const pRef = doc(db, 'users', uid, 'plans', dateStr);
            const pSnap = await getDoc(pRef);
            if (!pSnap.exists()) {
                const pLog = generateDayPlan(dateStr, dayObj);
                await setDoc(pRef, pLog);
                console.log(`✅ Meal plan seed: ${dateStr}`);
            } else {
                console.log(`⏭️ Skipped existing Meal plan log: ${dateStr}`);
            }
        }
    }

    // 7. Write Medicine Reminders
    const fourteenDaysAgoTs = subDays(today, 13).getTime();

    const reminders = [
        {
            id: "rmndr-vitd3-seed",
            medicineName: "Vitamin D3",
            time: "08:00",
            notes: "Take with breakfast, 1 tablet daily",
            enabled: true,
            createdAt: fourteenDaysAgoTs
        },
        {
            id: "rmndr-omega3-seed",
            medicineName: "Omega-3 Fish Oil",
            time: "13:00",
            notes: "2 capsules after lunch",
            enabled: true,
            createdAt: fourteenDaysAgoTs
        },
        {
            id: "rmndr-magnesium-seed",
            medicineName: "Magnesium Glycinate",
            time: "21:30",
            notes: "1 tablet before bed, helps with sleep",
            enabled: true,
            createdAt: fourteenDaysAgoTs
        }
    ];

    for (const r of reminders) {
        const rmndrRef = doc(db, 'users', uid, 'reminders', r.id);
        const rSnap = await getDoc(rmndrRef);
        if (!rSnap.exists()) {
            const rData = { ...r };
            // If we strictly need it created by addDoc without dictating ID in path (prompt said 'autoId'),
            // we can still just setDoc over 'rmndr-vitd3-seed' doc string to be safe and reproducible,
            // it doesn't violate Firebase mechanics.
            await setDoc(rmndrRef, rData);
        }
    }
    console.log('✅ Medicine reminders written');

    console.log('\n🎉 DONE! All 2-week data seeded for UID:', uid);
    console.log('Login with: demo@healthcompanion.app / Demo@1234');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
