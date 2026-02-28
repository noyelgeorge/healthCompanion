import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Activity, Calendar, User as UserIcon } from "lucide-react";
import { cn } from "../lib/utils";

import { toast } from "sonner";
import { auth } from "../lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";
import { useAppStore, type UserProfile } from "../store/useAppStore";
import { Button } from "../components/ui/Button";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [signupStep, setSignupStep] = useState(1); // 1 = Auth, 2 = Profile
    const [showPassword, setShowPassword] = useState(false);

    // Auth State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    // Profile State
    const [gender, setGender] = useState<UserProfile['gender']>('male');
    const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>('moderate');
    const [age, setAge] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [weight, setWeight] = useState<string>("");
    const [goal, setGoal] = useState<UserProfile['goal']>('maintain');

    const navigate = useNavigate();
    const setUser = useAppStore(state => state.setUser);

    // Motivational Quotes
    const quotes = [
        "Health is the greatest wealth. 🏃‍♂️",
        "Small steps every day. 🌱",
        "Invest in yourself. ✨",
        "Your body hears everything your mind says. 🧠",
        "Eat better, not less. 🍎",
        "Progress, not perfection. 🚀"
    ];
    const [currentQuote, setCurrentQuote] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % quotes.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [quotes.length]);

    const login = async () => {
        if (!email || !password) {
            toast.error("Missing Info", {
                description: "Please enter both email and password 🥺"
            });
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await useAppStore.getState().setUser({
                isAuthenticated: true,
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                name: userCredential.user.displayName || 'User'
            })
            // Trigger Cloud Sync only if we have a UID and are authenticated
            const state = useAppStore.getState();
            if (state.user.isAuthenticated && state.user.uid) {
                await state.syncWithFirestore()
                await state.loadRecipeBook()
            }
            toast.success("Welcome back! 👋", {
                description: "It's great to see you again!",
                duration: 2000,
            });
            navigate("/");
        } catch (error) {
            console.error("Login error:", error);
            let message = "Something went wrong during login.";
            if (error instanceof Error && (
                (error as any).code === "auth/user-not-found" ||
                (error as any).code === "auth/wrong-password" ||
                (error as any).code === "auth/invalid-credential"
            )) {
                message = "Invalid email or password. Please try again.";
            }
            toast.error("Oops!", {
                description: message
            });
        }
    };

    const signup = async () => {
        if (!fullName || !email || !password) {
            toast.error("Hold up!", {
                description: "We need all your details to get started ✨"
            });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: fullName
            });

            // Advance to profile step instead of navigating immediately
            setSignupStep(2);
            toast.success("Account Created! 🎉", {
                description: "Now let's set up your profile for better tracking."
            });

        } catch (error) {
            console.error("Signup error:", error);
            let message = "Something went wrong during signup.";
            if (error instanceof Error) {
                const code = (error as any).code;
                if (code === "auth/email-already-in-use") {
                    message = "This email is already registered.";
                } else if (code === "auth/weak-password") {
                    message = "Password should be at least 6 characters.";
                }
            }
            toast.error("Signup Failed", {
                description: message
            });
        }
    };

    const handleProfileComplete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!age || !height || !weight) {
            toast.error("Missing Details", {
                description: "Please fill in all fields so we can personalize your plan."
            });
            return;
        }

        const profile: Partial<UserProfile> = {
            isAuthenticated: true,
            email: email,
            name: fullName,
            age: Number(age),
            height: Number(height),
            weight: Number(weight),
            gender: gender,
            activityLevel: activityLevel,
            goal: goal,
            onboardingCompleted: true
        };

        // Save complete profile to store and Firestore (via setUser sync)
        try {
            await setUser(profile);
            toast.success("You're all set! 🚀", {
                description: "Welcome to your new health journey!"
            });
            navigate("/");
        } catch (error) {
            console.error("Profile save error:", error);
            toast.error("Cloud Sync Error", {
                description: "Account created but couldn't sync profile to cloud. We'll try again later."
            });
            navigate("/"); // Continue anyway
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Email Required", {
                description: "Please enter your email to reset password 📧"
            });
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Reset email sent! 🎉", {
                description: "Check your inbox for instructions."
            });
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error("Reset Failed", {
                description: error instanceof Error ? error.message : "Failed to send reset email."
            });
        }
    };

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            login();
        } else {
            signup();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
            {/* Soft Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-950 dark:to-black"></div>

            {/* Warm Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] -z-10">
                <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-orange-200/40 dark:bg-orange-600/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-rose-200/40 dark:bg-rose-600/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-lg space-y-8 relative z-10 py-10">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="relative group mx-auto w-20 h-20 mb-6">
                        <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-rose-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative glass dark:glass-dark rounded-3xl p-4 border-white dark:border-white/10 shadow-2xl animate-bounce-slight overflow-hidden">
                            <img src="/logo.png" alt="Health Companion Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            {isLogin ? "Welcome Back" : signupStep === 1 ? "Hello there!" : "Tell us more"}
                        </h2>
                        <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                            {isLogin
                                ? "Sign in to access your Health Companion"
                                : signupStep === 1
                                    ? "Join us on your path to better health"
                                    : "Help us personalize your experience"
                            }
                        </p>
                    </div>

                    {/* Rotating Quote container - refined */}
                    <div className="mt-6 h-6 flex items-center justify-center overflow-hidden">
                        <p key={currentQuote} className="text-slate-400 dark:text-slate-500 text-[10px] font-bold italic animate-fade-in-up">
                            "{quotes[currentQuote]}"
                        </p>
                    </div>
                </div>

                <div className="glass dark:glass-dark p-8 md:p-10 rounded-[2.5rem] shadow-2xl border-white dark:border-slate-800/50 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl"></div>

                    {/* Toggle - Only show on Step 1 */}
                    {signupStep === 1 && (
                        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-white dark:border-white/5 mb-10 relative z-10">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={cn(
                                    "flex-1 relative z-10 py-3 text-xs font-black transition-all duration-300 rounded-xl uppercase tracking-wider",
                                    isLogin ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xl translate-x-0" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                )}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={cn(
                                    "flex-1 relative z-10 py-3 text-xs font-black transition-all duration-300 rounded-xl uppercase tracking-wider",
                                    !isLogin ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xl translate-x-0" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                )}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    <div className="relative z-10">
                        {signupStep === 1 ? (
                            <form onSubmit={handleAuth} className="space-y-6">
                                {!isLogin && (
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-5 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 dark:text-white shadow-sm"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full px-5 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 dark:text-white shadow-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-5 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 dark:text-white shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {isLogin && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest hover:underline transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    className="h-14 bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40"
                                >
                                    {isLogin ? "Log In" : "Create Account"}
                                </Button>
                            </form>
                        ) : (
                            // Step 2: Profile Setup
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-500">
                                <button
                                    onClick={() => setSignupStep(1)}
                                    className="w-10 h-10 glass dark:glass-dark rounded-2xl flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all hover:scale-105 active:scale-95 shadow-md"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <form onSubmit={handleProfileComplete} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                How old are you?
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="number"
                                                    value={age}
                                                    onChange={(e) => setAge(e.target.value)}
                                                    placeholder="25"
                                                    className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                Gender
                                            </label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <select
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                                                    className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold appearance-none text-slate-800 dark:text-white"
                                                >
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                Height (cm)
                                            </label>
                                            <input
                                                type="number"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                placeholder="175"
                                                className="w-full px-5 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                Weight (kg)
                                            </label>
                                            <input
                                                type="number"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                placeholder="70"
                                                className="w-full px-5 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                            Activity Level
                                        </label>
                                        <div className="relative">
                                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <select
                                                value={activityLevel}
                                                onChange={(e) => setActivityLevel(e.target.value as "sedentary" | "light" | "moderate" | "active" | "athlete")}
                                                className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold appearance-none text-slate-800 dark:text-white"
                                            >
                                                <option value="sedentary">Sedentary (Little to no exercise)</option>
                                                <option value="light">Light (Exercise 1-3 times/week)</option>
                                                <option value="moderate">Moderate (Exercise 3-5 times/week)</option>
                                                <option value="active">Active (Daily exercise)</option>
                                                <option value="athlete">Athlete (Intense daily training)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                            Goal
                                        </label>
                                        <select
                                            value={goal}
                                            onChange={(e) => setGoal(e.target.value as "lose" | "maintain" | "gain")}
                                            className="w-full px-5 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold appearance-none text-slate-800 dark:text-white"
                                        >
                                            <option value="lose">Weight Reduction</option>
                                            <option value="maintain">Maintain Equilibrium</option>
                                            <option value="gain">Gain Muscle</option>
                                        </select>
                                    </div>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        className="h-14 bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
                                    >
                                        Complete Profile <ArrowRight size={18} />
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                        Health Companion v2.0.4 Secure Link
                    </p>
                </div>
            </div>
        </div>
    );
}
