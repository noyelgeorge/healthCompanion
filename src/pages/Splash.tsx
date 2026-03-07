export default function Splash() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#020405]">
            {/* Pure Midnight Background with localized brand glows */}
            <div className="absolute inset-0 bg-[#000000]"></div>

            {/* High-Contrast "Aurora" Glows (Teal & Orange) */}
            <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[140px] animate-slow-breath"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[140px] animate-slow-breath [animation-delay:4s]"></div>

            {/* Subtle Tech Grid - Ultra Low Opacity */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:48px_48px] opacity-[0.05]"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative group animate-cinematic-fade-in">
                    {/* Deep Space Shadow */}
                    <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full transform scale-75 opacity-40"></div>

                    {/* OLED-Optimized Frame */}
                    <div className="p-[1px] rounded-[3.5rem] bg-gradient-to-b from-white/30 via-transparent to-transparent shadow-[0_0_50px_rgba(0,0,0,1)]">
                        <div className="w-56 h-56 sm:w-68 sm:h-68 flex items-center justify-center p-8 bg-[#000000] rounded-[3.4rem] border border-white/[0.08] relative overflow-hidden group-hover:border-cyan-500/30 transition-all duration-1000">
                            {/* Cinematic Shimmer Effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                            </div>

                            <img
                                src="/logo.png"
                                alt="Health Companion Logo"
                                className="w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(6,182,212,0.2)] relative z-10 scale-110"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-16 sm:mt-24 text-center animate-subtle-slide-up [animation-delay:0.4s]">
                    <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                        <div className="relative">
                            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-[0.3em] sm:tracking-[0.4em] uppercase leading-none mb-2">
                                Health <span className="font-black text-orange-500 tracking-[-0.02em] lowcase">Companion</span>
                            </h1>
                            {/* Sharp Brand Line */}
                            <div className="absolute -bottom-4 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"></div>
                        </div>
                        <p className="text-white/40 font-bold tracking-[0.8em] sm:tracking-[1em] uppercase text-[8px] sm:text-[9px] pt-4">
                            Precision Wellness
                        </p>
                    </div>
                </div>

                {/* OLED-Matched Loading Indicator */}
                <div className="mt-24 sm:mt-32 flex flex-col items-center gap-4 animate-subtle-slide-up [animation-delay:0.8s]">
                    <div className="w-48 sm:w-56 h-[1.5px] bg-white/[0.02] rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-full animate-loading-bar opacity-100 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                    </div>
                </div>
            </div>

            {/* Absolute Brand Assurance */}
            <div className="absolute bottom-16 flex flex-col items-center opacity-40 animate-subtle-slide-up [animation-delay:1.2s]">
                <div className="text-[10px] font-black text-white tracking-[1.2em] uppercase">
                    Secured Framework
                </div>
            </div>
        </div>
    );
}
