import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value counting up from its previous value to a
 * new target whenever `target` changes, using a simple eased
 * requestAnimationFrame loop (no animation library dependency).
 * Non-numeric or very small changes just snap instantly — the
 * animation is a polish detail, not something that should ever make
 * a real number feel delayed or wrong.
 */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number>();
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to || Number.isNaN(to)) {
      setValue(to);
      fromRef.current = to;
      return;
    }

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutCubic — fast start, gentle settle, reads as "premium" rather than linear/robotic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
