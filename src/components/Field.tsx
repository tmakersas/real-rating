"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GOLD, realColor } from "@/lib/color";

export type FieldApp = [number, number, number, number, number, string];
// [stars, real, genreIndex, ratingCount, appId, name]

type Props = {
  apps: FieldApp[];
  genres: string[];
  callouts: number[];
  highlightId?: number | null;
  medianStars: number;
  onMode?: (m: 0 | 1) => void;
};

type Dot = {
  i: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  sx: number;
  sy: number;
  delayIn: number;
  delaySwap: number;
  colorB: string;
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export default function Field({ apps, genres, callouts, highlightId, medianStars, onMode }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const geomRef = useRef({ w: 0, h: 0, left: 0, right: 0, base: 0, pitch: 3, size: 2, cols: 0 });
  const stateRef = useRef({ mode: 0 as 0 | 1, from: 0, to: 0, swapStart: 0, introStart: 0, raf: 0 });
  const [mode, setMode] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<"intro" | "ready">("intro");
  const [hover, setHover] = useState<{ x: number; y: number; i: number; w: number } | null>(null);
  const hoverRef = useRef<number | null>(null);
  const highlightRef = useRef<number | null>(null);
  const monoRef = useRef("ui-monospace, monospace");

  const xFor = useCallback((v: number) => {
    const g = geomRef.current;
    return g.left + ((v - 1) / 4) * (g.right - g.left);
  }, []);

  const layout = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
    if (fam) monoRef.current = `${fam}, ui-monospace, monospace`;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const mobile = w < 640;
    const size = mobile ? 2 : w < 1100 ? 3 : 3.5;
    const pitch = size + (mobile ? 0.6 : 1);
    const left = mobile ? 18 : 48;
    const right = w - (mobile ? 18 : 48);
    const base = h - (mobile ? 92 : 104);
    const cols = Math.floor((right - left) / pitch);
    geomRef.current = { w, h, left, right, base, pitch, size, cols };

    const colOf = (v: number) => Math.max(0, Math.min(cols - 1, Math.floor(((v - 1) / 4) * cols)));
    // Stack per column, low real ratings at the bottom.
    const order = apps.map((_, i) => i).sort((a, b) => apps[a][1] - apps[b][1] || apps[a][0] - apps[b][0]);
    const stackA = new Array(cols).fill(0);
    const stackB = new Array(cols).fill(0);
    const colA = new Array(apps.length);
    const colB = new Array(apps.length);
    const rowA = new Array(apps.length);
    const rowB = new Array(apps.length);
    for (const i of order) {
      const ca = colOf(apps[i][0]);
      const cb = colOf(apps[i][1] + (((apps[i][4] % 97) / 97) - 0.5) * 0.1);
      colA[i] = ca;
      colB[i] = cb;
      rowA[i] = stackA[ca]++;
      rowB[i] = stackB[cb]++;
    }
    const maxA = Math.max(...stackA);
    const maxB = Math.max(...stackB);
    const topLimit = mobile ? h * 0.46 : h * 0.12;
    const avail = base - topLimit;
    const pyA = Math.min(pitch, avail / maxA);
    const pyB = Math.min(pitch, avail / maxB);
    dotsRef.current = apps.map((a, i) => {
      const c = realColor(a[1]);
      return {
        i,
        ax: left + colA[i] * pitch,
        ay: base - rowA[i] * pyA,
        bx: left + colB[i] * pitch,
        by: base - rowB[i] * pyB,
        sx: left + colA[i] * pitch,
        sy: -20 - Math.random() * h * 0.6,
        delayIn: (colA[i] / cols) * 0.35 + Math.random() * 0.45,
        delaySwap: (1 - Math.abs(a[0] - a[1]) / 4) * 0.25 + Math.random() * 0.3,
        colorB: `${c[0]},${c[1]},${c[2]}`,
      };
    });
  }, [apps]);

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const g = geomRef.current;
      const st = stateRef.current;
      const dpr = canvas.width / g.w;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, g.w, g.h);

      const introT = (now - st.introStart) / 1000;
      const swapT = (now - st.swapStart) / 1000;
      const SWAP = 1.5;
      let animating = introT < 1.6 || swapT < SWAP + 0.6;

      // mode blend: 0 = stars, 1 = real
      const target = st.to;
      const from = st.from;

      // axis
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.left, g.base + 6);
      ctx.lineTo(g.right, g.base + 6);
      ctx.stroke();
      ctx.font = `${g.w < 640 ? 10 : 11}px ${monoRef.current}`;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.textAlign = "center";
      for (let v = 1; v <= 5; v++) {
        const x = xFor(v);
        ctx.fillRect(x, g.base + 3, 1, 7);
        const label = target === 0 ? `${v}★` : `${v}.0`;
        ctx.fillText(label, x, g.base + 24);
      }

      const s = g.size;
      // ghost of the inflated tower, so you can see where the stars were
      if (target === 1 || from === 1) {
        const gk = from === target ? 1 : easeInOut(clamp01(swapT / SWAP));
        const ghost = target === 1 ? gk : 1 - gk;
        if (ghost > 0.01) {
          ctx.fillStyle = `rgba(255,200,61,${0.07 * ghost})`;
          for (const d of dotsRef.current) ctx.fillRect(d.ax, d.ay - s, s, s);
        }
      }

      // dots
      let hx = -1;
      let hy = -1;
      const hi = highlightRef.current;
      for (const d of dotsRef.current) {
        let x: number;
        let y: number;
        let blend: number;
        const tin = clamp01((introT - d.delayIn) / 0.9);
        const k = clamp01((swapT - d.delaySwap) / (SWAP - 0.4));
        const e = easeInOut(k);
        const aX = from === 0 ? d.ax : d.bx;
        const aY = from === 0 ? d.ay : d.by;
        const bX = target === 0 ? d.ax : d.bx;
        const bY = target === 0 ? d.ay : d.by;
        if (from === target) {
          x = bX;
          y = bY;
          blend = target;
        } else {
          x = aX + (bX - aX) * e;
          const lift = Math.sin(Math.PI * e) * Math.min(160, Math.abs(bX - aX) * 0.35 + 30);
          y = aY + (bY - aY) * e - lift;
          blend = from + (target - from) * e;
        }
        if (tin < 1) {
          const ei = 1 - Math.pow(1 - tin, 4);
          y = d.sy + (y - d.sy) * ei;
        }
        const app = apps[d.i];
        const [cr, cg, cb] = d.colorB.split(",").map(Number);
        const r = Math.round(GOLD[0] + (cr - GOLD[0]) * blend);
        const gg = Math.round(GOLD[1] + (cg - GOLD[1]) * blend);
        const b = Math.round(GOLD[2] + (cb - GOLD[2]) * blend);
        const alpha = tin <= 0 ? 0 : 0.55 + 0.45 * Math.min(1, app[3] / 200000);
        ctx.fillStyle = `rgba(${r},${gg},${b},${alpha})`;
        ctx.fillRect(x, y - s, s, s);
        if (hi !== null && app[4] === hi) {
          hx = x;
          hy = y;
        }
      }

      // median marker
      const medX = xFor(target === 0 && from === 0 ? medianStars : 3);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(medX, g.base + 2);
      ctx.lineTo(medX, g.h * (g.w < 640 ? 0.36 : 0.3));
      ctx.stroke();
      ctx.setLineDash([]);

      // callouts
      const rows = [0.4, 0.5, 0.6];
      ctx.textAlign = "left";
      callouts.forEach((id, ci) => {
        const d = dotsRef.current.find((dd) => apps[dd.i][4] === id);
        if (!d || introT < 1.4) return;
        const app = apps[d.i];
        const k = clamp01((swapT - d.delaySwap) / (SWAP - 0.4));
        const e = easeInOut(k);
        const aX = from === 0 ? d.ax : d.bx;
        const aY = from === 0 ? d.ay : d.by;
        const bX = target === 0 ? d.ax : d.bx;
        const bY = target === 0 ? d.ay : d.by;
        const x = from === target ? bX : aX + (bX - aX) * e;
        const y = from === target ? bY : aY + (bY - aY) * e - Math.sin(Math.PI * e) * Math.min(160, Math.abs(bX - aX) * 0.35 + 30);
        const ly = g.base - (g.base - g.h * 0.3) * rows[ci] - 40;
        const showReal = target === 1 && (from === 1 || e > 0.6);
        const name = app[5].split(/[:\-–]/)[0].trim();
        const label = showReal ? `${name}  ${app[0].toFixed(2)}★ → ${app[1].toFixed(1)}` : `${name}  ${app[0].toFixed(2)}★`;
        ctx.font = `${g.w < 640 ? 10 : 12}px ${monoRef.current}`;
        const tw = ctx.measureText(label).width;
        let lx = x + 14;
        if (lx + tw + 12 > g.w) lx = x - tw - 22;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.moveTo(x + s / 2, y - s / 2);
        ctx.lineTo(x + s / 2, ly + 8);
        ctx.lineTo(lx > x ? lx - 4 : lx + tw + 10, ly + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + s / 2, y - s / 2, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(10,10,12,0.85)";
        ctx.fillRect(lx - 4, ly - 4, tw + 14, 22);
        const [cr, cg, cb] = showReal ? realColor(app[1]) : GOLD;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.fillText(label, lx + 3, ly + 12);
      });

      // highlight ring (search)
      if (hx >= 0) {
        const pulse = 8 + Math.sin(now / 180) * 3;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx + s / 2, hy - s / 2, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        animating = true;
      }
      // hover ring
      const hv = hoverRef.current;
      if (hv !== null) {
        const d = dotsRef.current[hv];
        const x = target === 0 ? d.ax : d.bx;
        const y = target === 0 ? d.ay : d.by;
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + s / 2, y - s / 2, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      return animating;
    },
    [apps, callouts, medianStars, xFor],
  );

  const loop = useCallback(() => {
    const st = stateRef.current;
    cancelAnimationFrame(st.raf);
    const tick = (now: number) => {
      const more = draw(now);
      if (more) st.raf = requestAnimationFrame(tick);
    };
    st.raf = requestAnimationFrame(tick);
  }, [draw]);

  const swap = useCallback(
    (to: 0 | 1) => {
      const st = stateRef.current;
      if (st.to === to && st.from === to) return;
      st.from = st.to;
      st.to = to;
      st.swapStart = performance.now();
      setMode(to);
      onMode?.(to);
      loop();
    },
    [loop, onMode],
  );

  useEffect(() => {
    highlightRef.current = highlightId ?? null;
    if (highlightId) {
      // a searched app always shows on the real scale
      if (stateRef.current.to === 0) swap(1);
      else loop();
    }
  }, [highlightId, loop, swap]);

  useEffect(() => {
    layout();
    const st = stateRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = performance.now();
    st.introStart = reduce ? now - 10000 : now;
    st.swapStart = now - 10000;
    st.from = 0;
    st.to = 0;
    loop();
    const t1 = window.setTimeout(() => setPhase("ready"), reduce ? 0 : 1500);
    const t2 = window.setTimeout(() => swap(1), reduce ? 400 : 3300);
    const ro = new ResizeObserver(() => {
      layout();
      stateRef.current.swapStart = performance.now() - 10000;
      stateRef.current.from = stateRef.current.to;
      loop();
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
      cancelAnimationFrame(st.raf);
    };
  }, [layout, loop, swap]);

  const onMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const to = stateRef.current.to;
    let best = -1;
    let bd = 64;
    for (const d of dotsRef.current) {
      const x = to === 0 ? d.ax : d.bx;
      if (Math.abs(x - px) > 8) continue;
      const y = to === 0 ? d.ay : d.by;
      const dist = (x - px) ** 2 + (y - py) ** 2;
      if (dist < bd) {
        bd = dist;
        best = d.i;
      }
    }
    hoverRef.current = best >= 0 ? best : null;
    setHover(best >= 0 ? { x: px, y: py, i: best, w: rect.width } : null);
    loop();
  };

  const hv = hover ? apps[hover.i] : null;

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-pan-y"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => {
          hoverRef.current = null;
          setHover(null);
          loop();
        }}
        aria-label="Every dot is one of the top iPhone apps, placed by its App Store stars, then by its real rating"
        role="img"
      />
      {hv && hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-white/15 bg-black/85 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/90 shadow-2xl backdrop-blur"
          style={{
            left: Math.max(8, Math.min(hover.x + 14, hover.w - 220)),
            top: Math.max(8, hover.y - 70),
          }}
        >
          <div className="max-w-[200px] truncate text-white">{hv[5]}</div>
          <div className="text-white/50">{genres[hv[2]]} · {hv[3].toLocaleString("en-US")} ratings</div>
          <div>
            <span className="text-[#FFC83D]">{hv[0].toFixed(2)}★</span>
            <span className="text-white/40"> → real </span>
            <span style={{ color: `rgb(${realColor(hv[1]).join(",")})` }}>{hv[1].toFixed(1)}</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 font-mono text-[11px] backdrop-blur sm:bottom-5">
        <button
          onClick={() => swap(0)}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${mode === 0 ? "bg-[#FFC83D] text-black" : "text-white/60 hover:text-white"}`}
        >
          App Store stars
        </button>
        <button
          onClick={() => swap(1)}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${mode === 1 ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
        >
          Real rating
        </button>
      </div>
      <span className="sr-only">{phase}</span>
    </div>
  );
}

