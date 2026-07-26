import { useEffect, useState } from "react";
import logoMark from "@/assets/logo.png";

const VISIBLE_MS = 1400;
const FADE_MS = 500;

/**
 * Brief, premium splash shown once when the app first boots. Purely
 * presentational — it renders on top of the app for a moment and then
 * unmounts itself; no routing, auth, or data-loading logic depends on
 * it, so it's safe to remove without touching anything else.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFadingOut(true), VISIBLE_MS);
    const doneTimer = setTimeout(onDone, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-navy-gradient transition-opacity duration-500"
      style={{ opacity: isFadingOut ? 0 : 1 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-grid-overlay opacity-30" />
      <div className="absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-primary/30 blur-3xl" />
      <div
        className="absolute -bottom-32 -right-20 h-96 w-96 animate-float rounded-full bg-violet/25 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="absolute right-1/3 top-1/4 h-56 w-56 animate-float rounded-full bg-sky-400/20 blur-3xl"
        style={{ animationDelay: "0.6s" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-3xl bg-white/10" />
          <div className="relative flex h-24 w-24 animate-fade-in items-center justify-center rounded-3xl bg-white/10 p-4 shadow-glow backdrop-blur-sm">
            <img src={logoMark} alt="" className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <h1 className="text-2xl font-bold tracking-tight text-white">Nirnaya</h1>
          <p className="text-sm text-white/60">See Deeper. Decide Better.</p>
        </div>

        <div className="mt-2 flex gap-1.5" role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/70"
              style={{
                animation: "pulse-dot 1.1s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
