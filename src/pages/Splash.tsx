export default function Splash() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
            {/* Full-Screen Brand Color Background (Cyan Dominant) */}
            <div className="absolute inset-0 bg-[#06b6d4]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_#06b6d4_0%,_#0891b2_50%,_#0e7490_100%)]"></div>

            {/* Immersive Brand Blurs (Orange Core) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,_rgba(249,115,22,0.15)_0%,_transparent_60%)] animate-slow-breath"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-white/10 rounded-full blur-[160px] animate-blob"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#f97316]/10 rounded-full blur-[160px] animate-blob animation-delay-2000"></div>

            {/* Subtle Brand Texture Layer */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.2]"></div>

            {/* Main Full-Screen Logo Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-12 sm:p-24 animate-cinematic-fade-in">
                <div className="relative max-w-3xl w-full aspect-square flex items-center justify-center">
                    {/* Integrated Brand Glow */}
                    <div className="absolute inset-0 bg-white/20 blur-[120px] rounded-full transform scale-75 opacity-40"></div>
                    <div className="absolute inset-0 bg-[#f97316]/20 blur-[100px] rounded-full transform scale-90 translate-y-10 opacity-30"></div>

                    {/* The Logo - No Boxes, Pure Immersion */}
                    <img
                        src="/logo.png"
                        alt="Health Companion Logo"
                        className="w-[80%] max-w-[500px] h-auto object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-float relative z-10"
                    />
                </div>
            </div>

            {/* Minimalist Unified Loading Indicator */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-24 sm:px-48">
                <div className="w-full max-w-md h-[2px] bg-black/10 rounded-full overflow-hidden relative border border-white/5 backdrop-blur-sm">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white to-transparent w-full animate-loading-bar opacity-80"></div>
                </div>
            </div>

            {/* Sophisticated Invisible Tag */}
            <div className="absolute bottom-6 flex flex-col items-center opacity-10">
                <div className="text-[10px] font-black text-white tracking-[1.5em] uppercase">
                    Immersive Brand
                </div>
            </div>
        </div>
    );
}
