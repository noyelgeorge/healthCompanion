import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Activity, Calendar, User as UserIcon, Heart } from "lucide-react";
import { toast } from "sonner";
import { auth } from "../lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";
import { useAppStore, type UserProfile } from "../store/useAppStore";

// ── Floating ambient particles ─────────────────────────────────
const PARTICLES = [
    { x: 8,  y: 15, d: 0,   s: 3, o: 0.6 }, { x: 88, y: 10, d: 0.7, s: 4, o: 0.4 },
    { x: 75, y: 80, d: 1.3, s: 5, o: 0.5 }, { x: 20, y: 75, d: 0.9, s: 3, o: 0.4 },
    { x: 92, y: 45, d: 2.1, s: 4, o: 0.5 }, { x: 5,  y: 55, d: 1.6, s: 6, o: 0.35 },
    { x: 50, y: 5,  d: 0.4, s: 3, o: 0.45 }, { x: 62, y: 92, d: 1.9, s: 4, o: 0.6 },
];

// ── Motivational quotes ────────────────────────────────────────
const QUOTES = [
    "Health is the greatest wealth. 🏃‍♂️",
    "Small steps every day. 🌱",
    "Invest in yourself. ✨",
    "Your body hears everything your mind says. 🧠",
    "Eat better, not less. 🍎",
    "Progress, not perfection. 🚀",
];

// ── Input field component ──────────────────────────────────────
function Field({
    label, type = "text", value, onChange, placeholder, icon, rightSlot
}: {
    label: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder: string;
    icon?: React.ReactNode; rightSlot?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="space-y-1.5">
            <label style={{
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#ea580c', // Darker green for contrast
                marginLeft: '2px', display: 'block',
            }}>
                {label}
            </label>
            <div className="relative" style={{ transition: 'all 0.3s' }}>
                {icon && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: focused ? '#ea580c' : '#94a3b8', transition: 'color 0.3s' }}>
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        width: '100%',
                        padding: icon ? '14px 48px 14px 44px' : '14px 48px 14px 16px',
                        background: '#ffffff',
                        border: `1px solid ${focused ? 'rgba(249,115,22,0.5)' : '#e2e8f0'}`,
                        borderRadius: '14px',
                        outline: 'none',
                        color: '#0f172a',
                        fontSize: '14px',
                        fontWeight: 600,
                        boxShadow: focused ? '0 0 0 3px rgba(249,115,22,0.1), inset 0 2px 4px rgba(0,0,0,0.02)' : 'inset 0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s',
                    }}
                />
                {rightSlot && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</span>
                )}
            </div>
        </div>
    );
}

// ── Select field component ─────────────────────────────────────
function SelectField({
    label, value, onChange, icon, children
}: {
    label: string; value: string; onChange: (v: string) => void;
    icon?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label style={{
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#ea580c',
                marginLeft: '2px', display: 'block',
            }}>
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }}>
                        {icon}
                    </span>
                )}
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: icon ? '14px 16px 14px 44px' : '14px 16px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        outline: 'none',
                        color: '#0f172a',
                        fontSize: '14px',
                        fontWeight: 600,
                        appearance: 'none',
                        cursor: 'pointer',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
                    }}
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </div>
    );
}

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [signupStep, setSignupStep] = useState(1);
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

    const [currentQuote, setCurrentQuote] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setCurrentQuote(p => (p + 1) % QUOTES.length), 4000);
        return () => clearInterval(i);
    }, []);

    // ── Firebase auth logic (unchanged) ─────────────────────────
    const login = async () => {
        if (!email || !password) {
            toast.error("Missing Info", { description: "Please enter both email and password 🥺" });
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await useAppStore.getState().setUser({
                isAuthenticated: true,
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                name: userCredential.user.displayName || 'User'
            });
            const state = useAppStore.getState();
            if (state.user.isAuthenticated && state.user.uid) {
                await state.syncWithFirestore();
                await state.loadRecipeBook();
            }
            toast.success("Welcome back! 👋", { description: "It's great to see you again!", duration: 2000 });
            navigate("/");
        } catch (error) {
            console.error("Login error:", error);
            let message = "Something went wrong during login.";
            if (error instanceof Error && (
                (error as any).code === "auth/user-not-found" ||
                (error as any).code === "auth/wrong-password" ||
                (error as any).code === "auth/invalid-credential"
            )) { message = "Invalid email or password. Please try again."; }
            toast.error("Oops!", { description: message });
        }
    };

    const signup = async () => {
        if (!fullName || !email || !password) {
            toast.error("Hold up!", { description: "We need all your details to get started ✨" });
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: fullName });
            setSignupStep(2);
            toast.success("Account Created! 🎉", { description: "Now let's set up your profile for better tracking." });
        } catch (error) {
            console.error("Signup error:", error);
            let message = "Something went wrong during signup.";
            if (error instanceof Error) {
                const code = (error as any).code;
                if (code === "auth/email-already-in-use") message = "This email is already registered.";
                else if (code === "auth/weak-password") message = "Password should be at least 6 characters.";
            }
            toast.error("Signup Failed", { description: message });
        }
    };

    const handleProfileComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!age || !height || !weight) {
            toast.error("Missing Details", { description: "Please fill in all fields so we can personalize your plan." });
            return;
        }
        const profile: Partial<UserProfile> = {
            isAuthenticated: true, email, name: fullName,
            age: Number(age), height: Number(height), weight: Number(weight),
            gender, activityLevel, goal, onboardingCompleted: true
        };
        try {
            await setUser(profile);
            toast.success("You're all set! 🚀", { description: "Welcome to your new health journey!" });
            navigate("/");
        } catch (error) {
            console.error("Profile save error:", error);
            toast.error("Cloud Sync Error", { description: "Account created but couldn't sync profile. We'll try again later." });
            navigate("/");
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Email Required", { description: "Please enter your email to reset password 📧" });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Reset email sent! 🎉", { description: "Check your inbox for instructions." });
        } catch (error) {
            toast.error("Reset Failed", { description: error instanceof Error ? error.message : "Failed to send reset email." });
        }
    };

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        isLogin ? login() : signup();
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc', // Light slate modern background
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        }}>
            {/* ── Background radial glow ── */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(251,146,60,0.12) 0%, transparent 60%)',
            }} />
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(249,115,22,0.08) 0%, transparent 60%)',
            }} />

            {/* ── Dot grid ── */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.4) 0.5px, transparent 0.5px)',
                backgroundSize: '36px 36px',
            }} />

            {/* ── Floating particles ── */}
            {PARTICLES.map((p, i) => (
                <div key={i} className="animate-particle-float" style={{
                    position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                    width: `${p.s}px`, height: `${p.s}px`, borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(249,115,22,${p.o}) 0%, transparent 70%)`,
                    animationDelay: `${p.d}s`, animationDuration: `${5 + p.d}s`,
                }} />
            ))}

            {/* ── ECG decorative line top ── */}
            <div style={{ position: 'absolute', top: '5%', left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.15, pointerEvents: 'none' }}>
                <svg viewBox="0 0 400 30" fill="none" style={{ width: '80%', maxWidth: '500px' }}>
                    <path d="M0,15 L80,15 L95,15 L103,3 L111,27 L116,8 L122,15 L140,15 L200,15 L210,15 L218,3 L226,27 L231,8 L237,15 L260,15 L400,15"
                        stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>

            {/* ══════════ CARD ══════════ */}
            <div style={{
                position: 'relative', zIndex: 10,
                width: '100%', maxWidth: '440px',
                display: 'flex', flexDirection: 'column', gap: '24px',
            }}>
                {/* ── Logo + Title ── */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    {/* Logo */}
                    <div style={{ position: 'relative' }}>
                        <div className="animate-slow-breath" style={{
                            position: 'absolute', inset: '-16px', borderRadius: '40px',
                            background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, transparent 60%)',
                            filter: 'blur(16px)',
                        }} />
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
                            position: 'relative',
                            background: '#0a0f0a' // Logo background stays dark for contrast
                        }}>
                            <img src="/logo.png" alt="Health Companion" className="logo-neon" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }} />
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
                            {isLogin ? 'Welcome Back' : signupStep === 1 ? 'Create Account' : 'Complete Profile'}
                        </h1>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>
                            {isLogin
                                ? 'Sign in to your Health Companion'
                                : signupStep === 1
                                    ? 'Start your wellness journey today'
                                    : 'Help us personalize your experience'}
                        </p>
                    </div>

                    {/* Rotating quote */}
                    <div style={{ height: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                        <p key={currentQuote} className="animate-subtle-slide-up" style={{
                            fontSize: '10.5px', color: '#ea580c', fontStyle: 'italic', margin: 0, fontWeight: 600
                        }}>
                            "{QUOTES[currentQuote]}"
                        </p>
                    </div>
                </div>

                {/* ── Glass Card ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,1)',
                    borderRadius: '28px',
                    padding: '32px',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Card top internal reflection */}
                    <div style={{
                        position: 'absolute', top: 0, left: '10%', right: '10%', height: '1.5px',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)',
                    }} />

                    {/* ── Login / Sign Up Toggle (step 1 only) ── */}
                    {signupStep === 1 && (
                        <div style={{
                            display: 'flex', background: '#f1f5f9',
                            borderRadius: '14px', padding: '4px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '28px',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            {[{ label: 'Login', active: isLogin, action: () => setIsLogin(true) },
                              { label: 'Sign Up', active: !isLogin, action: () => setIsLogin(false) }].map(tab => (
                                <button key={tab.label} onClick={tab.action} style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                                    cursor: 'pointer', fontWeight: 800, fontSize: '12px',
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    transition: 'all 0.3s',
                                    background: tab.active ? '#ffffff' : 'transparent',
                                    color: tab.active ? '#ea580c' : '#64748b',
                                    boxShadow: tab.active ? '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Step 1: Auth form ── */}
                    {signupStep === 1 ? (
                        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {!isLogin && (
                                <Field label="Full Name" value={fullName} onChange={setFullName}
                                    placeholder="John Doe"
                                    icon={<UserIcon size={15} />} />
                            )}
                            <Field label="Email Address" type="email" value={email} onChange={setEmail}
                                placeholder="john@example.com"
                                icon={<span style={{ fontSize: '15px', fontWeight: 800 }}>@</span>} />
                            <Field
                                label="Password" type={showPassword ? "text" : "password"}
                                value={password} onChange={setPassword}
                                placeholder="••••••••"
                                icon={<Heart size={15} />}
                                rightSlot={
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                }
                            />

                            {isLogin && (
                                <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                                    <button type="button" onClick={handleForgotPassword} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '11px', fontWeight: 800, color: '#ea580c',
                                        letterSpacing: '0.05em',
                                    }}>
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {/* Submit button */}
                            <button type="submit" style={{
                                marginTop: '6px', width: '100%', padding: '15px',
                                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                border: '1px solid #ea580c', borderRadius: '14px', cursor: 'pointer',
                                color: '#ffffff', fontWeight: 800, fontSize: '13px',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                boxShadow: '0 8px 20px rgba(249,115,22,0.3)',
                                transition: 'all 0.3s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                                onMouseEnter={e => { (e.target as HTMLButtonElement).style.boxShadow = '0 12px 25px rgba(249,115,22,0.4)'; (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(249,115,22,0.3)'; (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                            >
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={16} />
                            </button>
                        </form>
                    ) : (
                        /* ── Step 2: Profile Setup ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <button onClick={() => setSignupStep(1)} style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                cursor: 'pointer', color: '#64748b', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ea580c'; (e.target as HTMLElement).style.borderColor = '#ea580c'; }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.color = '#64748b'; (e.target as HTMLElement).style.borderColor = '#e2e8f0'; }}
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <form onSubmit={handleProfileComplete} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <Field label="Age" type="number" value={age} onChange={setAge}
                                        placeholder="25" icon={<Calendar size={14} />} />
                                    <SelectField label="Gender" value={gender}
                                        onChange={v => setGender(v as 'male' | 'female' | 'other')}
                                        icon={<UserIcon size={14} />}>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </SelectField>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <Field label="Height (cm)" type="number" value={height} onChange={setHeight} placeholder="175" />
                                    <Field label="Weight (kg)" type="number" value={weight} onChange={setWeight} placeholder="70" />
                                </div>

                                <SelectField label="Activity Level" value={activityLevel}
                                    onChange={v => setActivityLevel(v as UserProfile['activityLevel'])}
                                    icon={<Activity size={14} />}>
                                    <option value="sedentary">Sedentary</option>
                                    <option value="light">Light (1-3×/week)</option>
                                    <option value="moderate">Moderate (3-5×/week)</option>
                                    <option value="active">Active (daily)</option>
                                    <option value="athlete">Athlete</option>
                                </SelectField>

                                <SelectField label="Your Goal" value={goal}
                                    onChange={v => setGoal(v as UserProfile['goal'])}>
                                    <option value="lose">Weight Reduction</option>
                                    <option value="maintain">Maintain Equilibrium</option>
                                    <option value="gain">Gain Muscle</option>
                                </SelectField>

                                <button type="submit" style={{
                                    marginTop: '6px', width: '100%', padding: '15px',
                                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                    border: '1px solid #ea580c', borderRadius: '14px', cursor: 'pointer',
                                    color: '#ffffff', fontWeight: 800, fontSize: '13px',
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    boxShadow: '0 8px 20px rgba(249,115,22,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}>
                                    Complete Profile <ArrowRight size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        Health Companion
                    </p>
                </div>
            </div>
        </div>
    );
}
