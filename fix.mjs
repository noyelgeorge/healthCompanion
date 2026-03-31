import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
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

async function main() {
    const cred = await signInWithEmailAndPassword(auth, 'demo@healthcompanion.app', 'Demo@1234');
    const uid = cred.user.uid;
    const today = new Date();
    console.log('✅ Signed in as:', uid);

    // 1. FIX STREAKS
    await setDoc(doc(db, 'users', uid), {
        streaks: {
            current: 14,
            longest: 14,
            lastLoggedDate: format(today, 'yyyy-MM-dd')
        }
    }, { merge: true });
    console.log('✅ Streaks fixed');

    // 2. CREATE SOCIAL POSTS
    const posts = [
        {
            authorId: uid,
            authorName: "Arjun Menon",
            authorPhoto: "https://ui-avatars.com/api/?name=Arjun+Menon&background=f97316&color=fff&size=128",
            timestamp: subDays(today, 10).getTime(),
            title: "High-Protein Masala Oats Bowl",
            description: "My go-to post-workout breakfast that keeps me full until lunch!\n\nStep 1: Dry roast 1/2 cup rolled oats in a pan for 2 minutes until fragrant.\nStep 2: Add 1.5 cups water, bring to boil, then simmer for 3 minutes stirring frequently.\nStep 3: Mix in 1/2 tsp cumin, pinch of turmeric, salt to taste, and 1 chopped green chilli.\nStep 4: Top with 2 poached eggs, a handful of roasted peanuts, and fresh coriander.\nStep 5: Drizzle with a few drops of ghee for flavour. Serve hot.",
            image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=800&auto=format&fit=crop",
            calories: 380,
            healthScore: 9,
            reasoning: "High-fibre oats with complete protein from eggs, healthy fats from peanuts and ghee. Perfect macro balance for a weight-loss goal.",
            macros: { protein: 22, carbs: 38, fat: 14 },
            ingredients: ["Rolled Oats", "Eggs", "Roasted Peanuts", "Green Chilli", "Turmeric", "Ghee", "Coriander"],
            likes: 8,
            likedBy: []
        },
        {
            authorId: uid,
            authorName: "Arjun Menon",
            authorPhoto: "https://ui-avatars.com/api/?name=Arjun+Menon&background=f97316&color=fff&size=128",
            timestamp: subDays(today, 8).getTime(),
            title: "Grilled Lemon Herb Chicken with Quinoa",
            description: "A clean, macro-friendly lunch I prepped for 3 days straight. Tastes amazing reheated!\n\nStep 1: Marinate 200g chicken breast in lemon juice, garlic, rosemary, olive oil and black pepper for 30 minutes.\nStep 2: Grill on a hot pan for 5-6 minutes each side until golden. Rest for 5 minutes before slicing.\nStep 3: Cook 1/2 cup quinoa in chicken broth instead of water for extra flavour.\nStep 4: Toss steamed broccoli and bell peppers in a little olive oil with salt.\nStep 5: Plate quinoa base, top with sliced chicken, add the vegetables. Squeeze fresh lemon on top.",
            image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
            calories: 485,
            healthScore: 9,
            reasoning: "Lean protein with a complete amino acid profile from quinoa. Anti-inflammatory herbs and a full serving of vegetables make this a nutritionally complete meal.",
            macros: { protein: 42, carbs: 35, fat: 12 },
            ingredients: ["Chicken Breast", "Quinoa", "Broccoli", "Bell Peppers", "Lemon", "Garlic", "Rosemary", "Olive Oil"],
            likes: 14,
            likedBy: []
        },
        {
            authorId: uid,
            authorName: "Arjun Menon",
            authorPhoto: "https://ui-avatars.com/api/?name=Arjun+Menon&background=f97316&color=fff&size=128",
            timestamp: subDays(today, 6).getTime(),
            title: "5-Ingredient Protein Smoothie",
            description: "My cheat-day recovery drink. Simple, fast, and actually tastes like dessert.\n\nStep 1: Add 1 frozen banana, 1 scoop vanilla whey protein (30g), 200ml almond milk to a blender.\nStep 2: Add 1 tbsp natural peanut butter and a small handful of spinach (you won't taste it!).\nStep 3: Blend on high for 45 seconds until completely smooth and creamy.\nStep 4: Pour into a glass, optionally top with a few cacao nibs for crunch.\nTip: Freeze the banana the night before for a thicker texture.",
            image: "https://images.unsplash.com/photo-1553530666-ba11a90bb0ae?q=80&w=800&auto=format&fit=crop",
            calories: 310,
            healthScore: 8,
            reasoning: "Quick post-workout or breakfast option. High protein to support muscle recovery, potassium from banana, and iron from spinach. Low prep time makes it sustainable.",
            macros: { protein: 32, carbs: 28, fat: 9 },
            ingredients: ["Frozen Banana", "Whey Protein", "Almond Milk", "Peanut Butter", "Spinach"],
            likes: 21,
            likedBy: []
        },
        {
            authorId: uid,
            authorName: "Arjun Menon",
            authorPhoto: "https://ui-avatars.com/api/?name=Arjun+Menon&background=f97316&color=fff&size=128",
            timestamp: subDays(today, 4).getTime(),
            title: "Kerala-Style Moong Dal Soup",
            description: "Light, warming, and incredibly filling. Perfect weeknight dinner under 400 calories.\n\nStep 1: Dry roast 1/2 cup split moong dal until golden and fragrant. Wash well.\nStep 2: Pressure cook with 2 cups water, turmeric, and a pinch of hing for 2 whistles.\nStep 3: In a small pan, heat coconut oil. Add mustard seeds, curry leaves, dried red chilli, and sliced shallots. Fry until shallots are golden.\nStep 4: Pour the tempering over the cooked dal. Add salt and a squeeze of lime juice.\nStep 5: Serve with 1 small whole wheat roti or just as a soup.",
            image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop",
            calories: 290,
            healthScore: 9,
            reasoning: "Moong dal is one of the most digestible legumes — high in plant protein, fibre, and B vitamins. The tempering adds flavour without significant calories. Ideal for a caloric deficit.",
            macros: { protein: 18, carbs: 40, fat: 5 },
            ingredients: ["Moong Dal", "Coconut Oil", "Mustard Seeds", "Curry Leaves", "Shallots", "Turmeric", "Lime"],
            likes: 17,
            likedBy: []
        },
        {
            authorId: uid,
            authorName: "Arjun Menon",
            authorPhoto: "https://ui-avatars.com/api/?name=Arjun+Menon&background=f97316&color=fff&size=128",
            timestamp: subDays(today, 2).getTime(),
            title: "Overnight Oats with Chia & Berries",
            description: "Zero morning effort. Prep in 5 minutes the night before and it's ready when you wake up.\n\nStep 1: In a jar, combine 1/2 cup rolled oats, 1 tbsp chia seeds, 1 cup low-fat milk.\nStep 2: Add 1 tsp honey and 1/2 tsp vanilla extract. Stir well.\nStep 3: Cover and refrigerate overnight (minimum 6 hours).\nStep 4: In the morning, top with a handful of mixed berries (blueberries, strawberries) and a few crushed walnuts.\nStep 5: Eat cold, or microwave for 90 seconds if you prefer it warm.",
            image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop",
            calories: 345,
            healthScore: 9,
            reasoning: "Oats and chia seeds together provide soluble fibre that slows glucose absorption. Berries add antioxidants. This breakfast can reduce mid-morning hunger significantly.",
            macros: { protein: 14, carbs: 52, fat: 9 },
            ingredients: ["Rolled Oats", "Chia Seeds", "Low-fat Milk", "Mixed Berries", "Walnuts", "Honey", "Vanilla Extract"],
            likes: 6,
            likedBy: []
        }
    ];

    const q = query(collection(db, 'posts'), where('authorId', '==', uid));
    const existingPostsSnap = await getDocs(q);
    if (existingPostsSnap.empty) {
        for (const post of posts) {
            const ref = await addDoc(collection(db, 'posts'), post);
            console.log(`✅ Post created: ${post.title} → ${ref.id}`);
        }
    } else {
        console.log(`⏭️ Posts already exist for user. Skipping post creation.`);
    }

    // 3. CREATE RECIPE BOOK ENTRIES
    const recipes = [
        {
            id: "recipe-saved-1",
            name: "Grilled Chicken Salad",
            calories: 350,
            protein: 40,
            carbs: 12,
            fat: 15,
            ingredients: ["Chicken Breast", "Mixed Greens", "Cherry Tomatoes", "Olive Oil", "Balsamic Vinegar"],
            healthScore: 9,
            reasoning: "High protein, low carb. Perfect for weight loss goals.",
            source: "community",
            addedAt: subDays(today, 9).getTime()
        },
        {
            id: "recipe-saved-2",
            name: "Palak Paneer (Light Version)",
            calories: 320,
            protein: 16,
            carbs: 20,
            fat: 18,
            ingredients: ["Low-fat Paneer", "Spinach", "Tomato", "Onion", "Ginger-Garlic Paste", "Garam Masala"],
            healthScore: 8,
            reasoning: "Classic comfort food made lighter. High in iron from spinach and calcium from paneer.",
            source: "manual",
            addedAt: subDays(today, 7).getTime()
        },
        {
            id: "recipe-saved-3",
            name: "High-Protein Masala Oats Bowl",
            calories: 380,
            protein: 22,
            carbs: 38,
            fat: 14,
            ingredients: ["Rolled Oats", "Eggs", "Roasted Peanuts", "Green Chilli", "Turmeric", "Ghee"],
            healthScore: 9,
            reasoning: "High-fibre oats with complete protein from eggs. Perfect macro balance.",
            source: "community",
            addedAt: subDays(today, 5).getTime()
        },
        {
            id: "recipe-saved-4",
            name: "Banana Peanut Butter Protein Toast",
            calories: 290,
            protein: 18,
            carbs: 32,
            fat: 10,
            ingredients: ["Whole Grain Bread", "Banana", "Natural Peanut Butter", "Honey", "Chia Seeds"],
            healthScore: 8,
            reasoning: "Quick breakfast with sustained energy. Natural sugars from banana with protein and healthy fats.",
            source: "manual",
            addedAt: subDays(today, 2).getTime()
        }
    ];

    for (const recipe of recipes) {
        await setDoc(doc(db, 'users', uid, 'recipeBook', recipe.id), recipe);
        console.log(`✅ Recipe saved: ${recipe.name}`);
    }

    console.log('\n🎉 All fixes applied!');
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
