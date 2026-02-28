
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    setDoc,
    doc,
    deleteDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment
} from "firebase/firestore";

import { db } from "../lib/firebase";

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    timestamp: number; // or Firestore Timestamp
    title: string;
    description: string;
    image?: string;
    calories: number;
    healthScore?: number; // v2.2
    reasoning?: string;   // v2.2
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    ingredients: string[];
    likes: number;
    likedBy: string[]; // Array of user IDs/emails who liked the post
}


export interface RecipeBookItem {
    id: string; // The ID in the user's recipeBook subcollection
    originalPostId?: string; // If saved from a post
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients?: string[]; // Added for shopping list
    healthScore?: number; // v2.2
    reasoning?: string;   // v2.2
    source: "community" | "manual";
    addedAt: number;
}

// Collection References
const POSTS_COLLECTION = "posts";
const USERS_COLLECTION = "users";


// --- Helper ---
function sanitizeFirestoreData(data: any) {
    return Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            (acc as any)[key] = value
        }
        return acc
    }, {} as Record<string, any>)
}

// --- Posts / Feed ---

export async function createPost(postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'likedBy'>) {
    try {
        const postsRef = collection(db, "posts")
        const safeData = sanitizeFirestoreData(postData)

        const docRef = await addDoc(postsRef, {
            ...safeData,
            timestamp: Date.now(),
            likes: 0,
            likedBy: []
        })
        return docRef.id
    } catch (error) {
        console.error("Error creating post:", error)
        throw error
    }
}

export const fetchFeed = async (limitCount = 20) => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Post[];
    } catch (error) {
        console.error("Error fetching feed:", error);
        throw error;
    }
};

// --- Recipe Book ---

export const addToRecipeBook = async (userId: string, item: Omit<RecipeBookItem, "id" | "addedAt">) => {
    try {
        // Use originalPostId as doc ID if available to prevent duplicates, otherwise auto-gen
        const docId = item.originalPostId || doc(collection(db, USERS_COLLECTION, userId, "recipeBook")).id;
        const safeData = sanitizeFirestoreData(item)

        await setDoc(doc(db, USERS_COLLECTION, userId, "recipeBook", docId), {
            ...safeData,
            id: docId,
            addedAt: Date.now()
        });
        return docId;
    } catch (error) {
        console.error("Error adding to recipe book:", error);
        throw error;
    }
};

export const getRecipeBook = async (userId: string) => {
    try {
        const q = query(collection(db, USERS_COLLECTION, userId, "recipeBook"), orderBy("addedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as RecipeBookItem);
    } catch (error) {
        console.error("Error fetching recipe book:", error);
        throw error;
    }
};

export const removeFromRecipeBook = async (userId: string, recipeId: string) => {
    try {
        await deleteDoc(doc(db, USERS_COLLECTION, userId, "recipeBook", recipeId));
    } catch (error) {
        console.error("Error removing from recipe book:", error);
        throw error;
    }
};

export const isRecipeSaved = async (userId: string, originalPostId: string): Promise<boolean> => {
    try {
        const docRef = doc(db, USERS_COLLECTION, userId, "recipeBook", originalPostId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking saved status:", error);
        return false;
    }
};

export const toggleLikePost = async (postId: string, userId: string, isLiked: boolean) => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            likes: increment(isLiked ? -1 : 1),
            likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

export async function deletePost(postId: string) {
    try {
        const postRef = doc(db, "posts", postId)
        await deleteDoc(postRef)
    } catch (error) {
        console.error("Error deleting post:", error)
        throw error
    }
}

export async function updatePost(postId: string, data: Partial<Post>) {
    try {
        const postRef = doc(db, "posts", postId)
        const safeData = sanitizeFirestoreData(data)

        await updateDoc(postRef, safeData)
    } catch (error) {
        console.error("Error updating post:", error)
        throw error
    }
}
