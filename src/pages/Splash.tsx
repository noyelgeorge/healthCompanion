// Splash screen showing the logo

export default function Splash() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-950">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>

            {/* Dynamic Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] -z-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-30 animate-pulse"></div>
                    <div className="p-1 glass dark:glass-dark rounded-[2.5rem] border-white/20 shadow-2xl relative overflow-hidden bg-white/5 backdrop-blur-2xl">
                        <div className="w-32 h-32 flex items-center justify-center p-4">
                            <img src="/logo.png" alt="Health Companion Logo" className="w-full h-full object-contain drop-shadow-2xl animate-bounce-slight" />
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-4xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent tracking-tighter uppercase leading-none">
                        Health Companion
                    </h1>
                </div>

                {/* Loading Indicator */}
                <div className="mt-12 w-48 h-1 glass rounded-full overflow-hidden relative border-none">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-indigo-500 w-1/3 animate-loading-bar rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                </div>
            </div>
        </div>
    );
}
