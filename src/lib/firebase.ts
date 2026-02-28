import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDscYUonnvEW7fsST60Cjw7gG5Rdu07S3o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "calorietracking-d41e8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "calorietracking-d41e8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "calorietracking-d41e8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "190065413740",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:190065413740:web:50ec4f564732d034755249",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T96KKESFBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Initialize Analytics safely without blocking
let _analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) _analytics = getAnalytics(app);
  }).catch(() => {
    // Analytics failure is non-critical
  });
}
export const analytics = _analytics;

export default app;
