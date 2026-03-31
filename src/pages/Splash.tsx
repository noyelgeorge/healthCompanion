import { useEffect, useState } from 'react';

// Floating particle component
function Particle({ x, y, delay, size, opacity }: { x: number; y: number; delay: number; size: number; opacity: number }) {
  return (
    <div
      className="absolute rounded-full animate-particle-float"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(249,115,22,${opacity}) 0%, transparent 70%)`,
        animationDelay: `${delay}s`,
        animationDuration: `${4 + delay}s`,
      }}
    />
  );
}

// Static particle positions to avoid hydration issues
const PARTICLES = [
  { x: 15, y: 20, delay: 0,   size: 4,  opacity: 0.6 },
  { x: 82, y: 15, delay: 0.5, size: 3,  opacity: 0.4 },
  { x: 70, y: 75, delay: 1.2, size: 5,  opacity: 0.5 },
  { x: 25, y: 80, delay: 0.8, size: 3,  opacity: 0.3 },
  { x: 90, y: 50, delay: 2.0, size: 4,  opacity: 0.5 },
  { x: 10, y: 55, delay: 1.5, size: 6,  opacity: 0.3 },
  { x: 50, y: 10, delay: 0.3, size: 3,  opacity: 0.4 },
  { x: 60, y: 88, delay: 1.8, size: 4,  opacity: 0.6 },
  { x: 35, y: 42, delay: 2.5, size: 2,  opacity: 0.3 },
  { x: 78, y: 38, delay: 1.1, size: 5,  opacity: 0.4 },
  { x: 5,  y: 30, delay: 3.0, size: 3,  opacity: 0.5 },
  { x: 92, y: 82, delay: 0.7, size: 4,  opacity: 0.3 },
];

export default function Splash() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 1: logo appears        @ 300ms
    const t1 = setTimeout(() => setStage(1), 300);
    // Stage 2: ECG line draws      @ 1400ms
    const t2 = setTimeout(() => setStage(2), 1400);
    // Stage 3: text reveal         @ 2300ms
    const t3 = setTimeout(() => setStage(3), 2300);
    // Stage 4: fade out            @ 3800ms
    const t4 = setTimeout(() => setStage(4), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#060a06',
        opacity: stage === 4 ? 0 : 1,
        transition: stage === 4 ? 'opacity 0.7s ease-in-out' : 'none',
      }}
    >
      {/* ── Deep radial background glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(251,146,60,0.07) 0%, transparent 70%)',
          opacity: stage >= 1 ? 1 : 0,
          transition: 'opacity 2s ease',
        }}
      />

      {/* ── Ambient corner glows ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full animate-slow-breath pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full animate-slow-breath pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 70%)', filter: 'blur(60px)', animationDelay: '3s' }} />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* ── Subtle dot grid ── */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(249,115,22,0.8) 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="relative z-10 flex flex-col items-center">

        {/* ── Logo block ── */}
        <div
          className="relative flex items-center justify-center"
          style={{
            opacity: stage >= 1 ? 1 : 0,
            transform: stage >= 1 ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(20px)',
            filter: stage >= 1 ? 'blur(0px)' : 'blur(12px)',
            transition: 'opacity 1s cubic-bezier(0.22,1,0.36,1), transform 1s cubic-bezier(0.22,1,0.36,1), filter 1s ease',
          }}
        >
          {/* Pulsing rings */}
          {stage >= 1 && (
            <>
              <div className="absolute rounded-[40px] animate-ring-pulse pointer-events-none"
                style={{ width: '210px', height: '210px', border: '1.5px solid rgba(251,146,60,0.35)', animationDelay: '0s' }} />
              <div className="absolute rounded-full animate-ring-pulse pointer-events-none"
                style={{ width: '270px', height: '270px', border: '1px solid rgba(251,146,60,0.18)', animationDelay: '0.5s' }} />
              <div className="absolute rounded-full animate-ring-pulse pointer-events-none"
                style={{ width: '330px', height: '330px', border: '1px solid rgba(251,146,60,0.08)', animationDelay: '1.0s' }} />
            </>
          )}

          {/* Logo — dark background already baked in, display directly */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '40px',
              boxShadow: stage >= 1
                ? '0 0 80px rgba(251,146,60,0.25), 0 0 160px rgba(251,146,60,0.1)'
                : 'none',
              transition: 'box-shadow 1.5s ease',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: '40px' }}>
              <div className="absolute inset-0 animate-shimmer"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)' }} />
            </div>

            <img
              src="/logo.png"
              alt="Health Companion Logo"
              className="relative z-10 logo-neon"
              style={{
                width: '180px',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '40px',
              }}
            />
          </div>
        </div>

        {/* ── ECG / heartbeat line ── */}
        <div
          className="relative overflow-hidden"
          style={{
            width: '280px',
            height: '50px',
            marginTop: '28px',
            opacity: stage >= 2 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          <svg
            viewBox="0 0 280 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(249,115,22,0)" />
                <stop offset="30%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="70%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* ECG path: flat → spike → flat */}
            <path
              d="M0,25 L60,25 L75,25 L82,8 L89,40 L94,15 L100,25 L115,25 L175,25 L182,25 L190,8 L197,40 L202,15 L208,25 L220,25 L280,25"
              stroke="url(#ecgGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className={stage >= 2 ? 'animate-ecg-draw' : ''}
              style={{ strokeDasharray: 600, strokeDashoffset: stage >= 2 ? 0 : 600, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>

          {/* Traveling glow dot */}
          {stage >= 2 && (
            <div className="absolute top-1/2 -translate-y-1/2 animate-ecg-dot pointer-events-none"
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 10px rgba(249,115,22,0.9), 0 0 20px rgba(249,115,22,0.5)', left: '0' }} />
          )}
        </div>

        {/* ── "Health Companion" text ── */}
        <div
          style={{
            marginTop: '20px',
            opacity: stage >= 3 ? 1 : 0,
            transform: stage >= 3 ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Main title */}
            <h1 className="flex items-baseline gap-0 leading-none">
              {'HEALTH'.split('').map((ch, i) => (
                <span
                  key={i}
                  className="inline-block animate-letter-pop"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    fontSize: '28px',
                    fontWeight: 200,
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: '0.32em',
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  }}
                >
                  {ch}
                </span>
              ))}
              <span style={{ width: '0.4em', display: 'inline-block' }} />
              {'COMPANION'.split('').map((ch, i) => (
                <span
                  key={i}
                  className="inline-block animate-letter-pop"
                  style={{
                    animationDelay: `${(i + 7) * 0.06}s`,
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#f97316',
                    letterSpacing: '0.04em',
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    textShadow: '0 0 28px rgba(249,115,22,0.5)',
                  }}
                >
                  {ch}
                </span>
              ))}
            </h1>

            {/* Divider line */}
            <div
              className="animate-line-expand"
              style={{
                height: '1px',
                width: '0',
                background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.7), transparent)',
                animationFillMode: 'forwards',
              }}
            />

            {/* Tagline */}
            <p
              style={{
                fontSize: '9px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              }}
            >
              Your Precision Wellness Partner
            </p>
          </div>
        </div>

        {/* ── Loading progress bar ── */}
        <div
          style={{
            marginTop: '48px',
            opacity: stage >= 2 ? 1 : 0,
            transition: 'opacity 0.5s ease 0.3s',
          }}
        >
          <div
            style={{
              width: '200px',
              height: '1.5px',
              borderRadius: '9999px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              position: 'relative',
            }}
          >
            <div
              className="animate-loading-bar"
              style={{
                position: 'absolute',
                inset: '0',
                background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.9), transparent)',
                boxShadow: '0 0 12px rgba(249,115,22,0.6)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
