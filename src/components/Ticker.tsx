"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** A number that rolls from `from` to `value` when it scrolls into view or changes. */
export default function Ticker({ value, from, decimals = 1, duration = 1.2 }: { value: number; from?: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef<number>(from ?? value);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [initial] = useState(() => (from ?? value).toFixed(decimals));

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const start = last.current;
    const controls = animate(start, value, {
      duration,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => {
        node.textContent = v.toFixed(decimals);
      },
    });
    last.current = value;
    return () => controls.stop();
  }, [value, decimals, duration, inView]);

  return (
    <span ref={ref} className="tabular-nums">
      {initial}
    </span>
  );
}
