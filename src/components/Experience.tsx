"use client";
import { BASE } from "@/lib/base";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Field, { type FieldApp } from "./Field";
import { realColor, rgb } from "@/lib/color";
import Ticker from "./Ticker";

type Result = {
  id: number;
  name: string;
  seller: string;
  genre: string;
  icon: string;
  stars: number;
  count: number;
  real: number;
  percentile: number;
  category: string;
  categorySize: number;
  verdict: string;
  lowSample: boolean;
};

type Props = {
  apps: FieldApp[];
  genres: string[];
  callouts: number[];
  medianStars: number;
  totalApps: number;
  shareAbove4: number;
  date: string;
};

const SUGGEST = ["ChatGPT", "Duolingo", "Robinhood", "Snapchat", "Notion", "CapCut"];

export default function Experience({ apps, genres, callouts, medianStars, totalApps, shareAbove4, date }: Props) {
  const [mode, setMode] = useState<0 | 1>(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const inSnapshot = useRef(new Set(apps.map((a) => a[4])));
  const searchRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (term: string) => {
    const t = term.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
      const first = (data.results as Result[]).find((r) => inSnapshot.current.has(r.id));
      setHighlight(first ? first.id : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length >= 2) run(q);
    }, 380);
    return () => clearTimeout(t);
  }, [q, run]);

  return (
    <>
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
        <div className="grain pointer-events-none absolute inset-0 z-[1]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-48 bg-gradient-to-b from-[#09090b] via-[#09090b]/70 to-transparent" />
        <Field
          apps={apps}
          genres={genres}
          callouts={callouts}
          highlightId={highlight}
          medianStars={medianStars}
          onMode={setMode}
        />
        <div className="pointer-events-none relative z-[3] mx-auto max-w-6xl px-5 pt-6 sm:px-12 sm:pt-10">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 sm:text-[11px]">
            <span className="hidden sm:inline">Real Rating</span>
            <span>Fig. 01 · {totalApps.toLocaleString("en-US")} iPhone apps · {date}</span>
          </div>
          <h1 className="mt-6 font-serif text-[15vw] leading-[0.86] tracking-[-0.02em] text-white sm:mt-10 sm:text-[8.2vw] lg:text-[112px]">
            4.7 stars is
            <br />
            <em className="text-[#FFC83D]">average.</em>
          </h1>
          <div className="mt-4 flex items-baseline gap-3 font-mono text-[11px] text-white/60 sm:mt-6 sm:text-sm">
            <span>median app</span>
            <span
              className="text-2xl tabular-nums transition-colors duration-700 sm:text-4xl"
              style={{ color: mode === 0 ? "#FFC83D" : rgb(realColor(3)) }}
            >
              <Ticker value={mode === 0 ? medianStars : 3} decimals={mode === 0 ? 2 : 1} />
              {mode === 0 ? "★" : ""}
            </span>
            <span className="text-white/40">{mode === 0 ? "as rated" : "real"}</span>
          </div>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/60 sm:text-[15px]">
            {Math.round(shareAbove4 * 100)}% of the top iPhone apps have 4 stars or more. So I re-scored all{" "}
            {totalApps.toLocaleString("en-US")} of them against their own category. Watch the stars deflate.
          </p>
          <button
            onClick={() => searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="pointer-events-auto mt-4 rounded-full border border-[#FFC83D]/40 bg-[#FFC83D]/10 px-4 py-2 font-mono text-[11px] text-[#FFC83D] backdrop-blur transition hover:bg-[#FFC83D] hover:text-black"
          >
            deflate your app ↓
          </button>
        </div>
      </section>

      <section ref={searchRef} className="relative z-10 mx-auto max-w-3xl scroll-mt-6 px-5 pt-16 sm:px-8 sm:pt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Fig. 02 · Deflate any app</p>
        <h2 className="mt-3 font-serif text-5xl leading-none text-white sm:text-6xl">
          What&apos;s it <em className="text-[#FFC83D]">really</em> worth?
        </h2>
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_0_80px_-20px_rgba(255,200,61,0.25)] focus-within:border-[#FFC83D]/60">
          <span className="text-xl text-[#FFC83D]">★</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(q)}
            placeholder="Type any iPhone app…"
            className="w-full bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
            aria-label="Search any iPhone app"
            enterKeyHint="search"
          />
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#FFC83D]" />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGEST.map((s) => (
            <button
              key={s}
              onClick={() => setQ(s)}
              className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-white/55 transition hover:border-white/30 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
        {error && <p className="mt-6 font-mono text-sm text-[#FF4D5E]">{error}</p>}
        <div className="mt-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {results?.map((r, i) => (
              <ResultRow key={r.id} r={r} i={i} />
            ))}
          </AnimatePresence>
          {results && results.length === 0 && (
            <p className="font-mono text-sm text-white/50">No rated iPhone app found for that. Try the exact App Store name.</p>
          )}
        </div>
      </section>
    </>
  );
}

function ResultRow({ r, i }: { r: Result; i: number }) {
  const c = rgb(realColor(r.real));
  return (
    <motion.a
      layout
      href={`${BASE}/app/${r.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 26 }}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-white/20 hover:bg-white/[0.05] sm:p-4"
    >
      {r.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.icon} alt="" width={52} height={52} className="h-12 w-12 shrink-0 rounded-[22%] sm:h-14 sm:w-14" />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-[22%] bg-white/10" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] text-white">{r.name}</div>
        <div className="truncate font-mono text-[11px] text-white/45">
          {r.category} · {r.count.toLocaleString("en-US")} ratings{r.lowSample ? " · few ratings, pulled to the average" : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-baseline gap-2 font-mono">
        <span className="text-sm text-[#FFC83D]/80 line-through decoration-white/40">{r.stars.toFixed(1)}★</span>
        <span className="text-3xl tabular-nums sm:text-4xl" style={{ color: c }}>
          <Ticker value={r.real} from={r.stars} decimals={1} />
        </span>
      </div>
      <span className="hidden font-mono text-white/30 transition group-hover:translate-x-1 group-hover:text-white sm:block">→</span>
    </motion.a>
  );
}
