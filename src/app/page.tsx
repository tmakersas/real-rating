import { BASE } from "@/lib/base";
import field from "@/data/field.json";
import Experience from "@/components/Experience";
import Ticker from "@/components/Ticker";
import type { FieldApp } from "@/components/Field";
import { GENRES, PRIOR, MIN_COUNT, SNAPSHOT_DATE, inflationBoard, scoreApp } from "@/lib/score";
import { realColor, rgb } from "@/lib/color";
import { MINE, VIDEO_BOARD, TP_DATE, type SaasRow } from "@/lib/saas";

const apps = field.apps as unknown as FieldApp[];
const genres = field.genres as string[];

const CALLOUTS = [431946152, 389801252, 6448311069]; // Roblox, Instagram, ChatGPT
const FAMOUS = [
  938003185, 547702041, 431946152, 686449807, 447188370, 1641486558, 1500855883, 886427730, 544007664, 389801252,
  333903271, 6473753684, 835599320, 570060128, 363590051, 324684580, 6448311069, 529379082, 284993459,
];
const SHORT: Record<number, string> = {
  938003185: "Robinhood",
  547702041: "Tinder",
  686449807: "Telegram",
  1641486558: "Temu",
  1500855883: "CapCut",
  886427730: "Coinbase",
  6473753684: "Claude",
  835599320: "TikTok",
  570060128: "Duolingo",
  324684580: "Spotify",
  284993459: "Shazam",
};

function fmtDate(d: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function Home() {
  const stars = apps.map((a) => a[0]).sort((a, b) => a - b);
  const median = stars[Math.floor(stars.length / 2)];
  const above4 = stars.filter((s) => s >= 4).length / stars.length;
  const above45 = stars.filter((s) => s >= 4.5).length / stars.length;
  const below3 = stars.filter((s) => s < 3).length / stars.length;
  const date = fmtDate(SNAPSHOT_DATE);
  const byId = new Map(apps.map((a) => [a[4], a]));
  const famous = FAMOUS.map((id) => byId.get(id)).filter((a): a is FieldApp => !!a);
  const board = inflationBoard();
  const all = GENRES["All apps"];
  const food = GENRES["Food & Drink"];
  const robin = byId.get(938003185);
  const robinPct = robin ? scoreApp(robin[0], robin[3], genres[robin[2]]).percentile : 7;
  const revid = MINE.find((m) => m.domain === "revid.ai");

  return (
    <main className="relative overflow-x-clip bg-[#09090b] text-white">
      <Experience
        apps={apps}
        genres={genres}
        callouts={CALLOUTS}
        medianStars={Math.round(median * 100) / 100}
        totalApps={apps.length}
        shareAbove4={above4}
        date={date}
      />

      {/* FIG 03: famous apps */}
      <section className="mx-auto max-w-5xl px-5 pt-28 sm:px-8 sm:pt-36">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Fig. 03 · The deflation board</p>
        <h2 className="mt-3 max-w-3xl font-serif text-5xl leading-[0.95] sm:text-7xl">
          Robinhood has {robin ? robin[0].toFixed(1) : "4.3"} stars. That&apos;s{" "}
          <em className="text-[#FF4D5E]">bottom {Math.max(1, robinPct)}%</em> of
          finance apps.
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/55">
          Stars in, real rating out. Each app is ranked against the other top apps in its own App Store category. 3.0 is the
          middle of the pack.
        </p>
        <div className="mt-10 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {famous.map((a) => {
            const c = rgb(realColor(a[1]));
            const name = SHORT[a[4]] ?? a[5].split(/[:\-–]/)[0].trim();
            return (
              <a
                key={a[4]}
                href={`${BASE}/app/${a[4]}`}
                className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[180px_1fr_150px]"
              >
                <div className="min-w-0">
                  <div className="truncate text-lg text-white group-hover:underline">{name}</div>
                  <div className="truncate font-mono text-[11px] text-white/40">{genres[a[2]]}</div>
                </div>
                <div className="relative order-3 col-span-2 h-6 sm:order-none sm:col-span-1">
                  <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/[0.06]" />
                  <div
                    className="absolute top-1/2 h-[2px] -translate-y-1/2 opacity-70"
                    style={{
                      left: `${((Math.min(a[0], a[1]) - 1) / 4) * 100}%`,
                      width: `${(Math.abs(a[0] - a[1]) / 4) * 100}%`,
                      background: `linear-gradient(90deg, ${c}, #FFC83D)`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFC83D]/30 ring-1 ring-[#FFC83D]"
                    style={{ left: `${((a[0] - 1) / 4) * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${((a[1] - 1) / 4) * 100}%`, background: c, boxShadow: `0 0 18px ${c}` }}
                  />
                </div>
                <div className="flex items-baseline justify-end gap-2 font-mono">
                  <span className="text-sm text-[#FFC83D]/70 line-through decoration-white/30">{a[0].toFixed(2)}★</span>
                  <span className="text-3xl tabular-nums" style={{ color: c }}>
                    <Ticker value={a[1]} from={a[0]} decimals={1} />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* FIG 04: categories */}
      <section className="mx-auto max-w-5xl px-5 pt-28 sm:px-8 sm:pt-36">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Fig. 04 · Most inflated categories</p>
        <h2 className="mt-3 max-w-3xl font-serif text-5xl leading-[0.95] sm:text-7xl">
          In Food &amp; Drink, a <em className="text-[#FFC83D]">{food ? food.p10.toFixed(1) : "4.5"}</em> is bottom 10%.
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/55">
          Each bar is where the middle 80% of a category&apos;s top apps sit on the 1 to 5 scale. Most of the scale is
          empty. {Math.round(above45 * 100)}% of all {apps.length.toLocaleString("en-US")} apps have 4.5 or more, and only{" "}
          {(below3 * 100).toFixed(1)}% are under 3.
        </p>
        <div className="mt-10 space-y-[10px]">
          {board.map((g, i) => (
            <div key={g.name} className="grid grid-cols-[112px_1fr_52px] items-center gap-3 sm:grid-cols-[190px_1fr_70px]">
              <div className="truncate font-mono text-[11px] text-white/60 sm:text-xs">
                <span className="text-white/30">{String(i + 1).padStart(2, "0")} </span>
                {g.name}
              </div>
              <div className="relative h-5">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.08]" />
                {[2, 3, 4].map((v) => (
                  <div key={v} className="absolute inset-y-1 w-px bg-white/10" style={{ left: `${((v - 1) / 4) * 100}%` }} />
                ))}
                <div
                  className="absolute inset-y-1 rounded-sm bg-gradient-to-r from-[#FFC83D]/25 to-[#FFC83D]"
                  style={{ left: `${((g.p10 - 1) / 4) * 100}%`, width: `${((g.p90 - g.p10) / 4) * 100}%` }}
                />
                <div className="absolute inset-y-0 w-[2px] bg-white" style={{ left: `${((g.median - 1) / 4) * 100}%` }} />
              </div>
              <div className="text-right font-mono text-xs tabular-nums text-[#FFC83D]">{g.median.toFixed(2)}★</div>
            </div>
          ))}
          <div className="grid grid-cols-[112px_1fr_52px] gap-3 pt-1 font-mono text-[10px] text-white/30 sm:grid-cols-[190px_1fr_70px]">
            <div>median →</div>
            <div className="flex justify-between">
              <span>1★</span>
              <span>2★</span>
              <span>3★</span>
              <span>4★</span>
              <span>5★</span>
            </div>
            <div />
          </div>
        </div>
      </section>

      {/* FIG 05: confession */}
      <section className="mx-auto max-w-5xl px-5 pt-28 sm:px-8 sm:pt-36">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Fig. 05 · Mine go first</p>
        <h2 className="mt-3 max-w-3xl font-serif text-5xl leading-[0.95] sm:text-7xl">
          I make Revid. It&apos;s a <em className="text-[#FFC83D]">{revid?.real.toFixed(1)}</em>.
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/55">
          My products aren&apos;t on the App Store, so I ran them on Trustpilot. Revid goes against {VIDEO_BOARD.length - 1}{" "}
          other AI video tools. Trustpilot isn&apos;t squished like the App Store, it&apos;s love or hate: lots of 5 stars,
          lots of 1 stars, almost nothing in between.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {MINE.map((m) => (
            <MineCard key={m.domain} m={m} />
          ))}
        </div>

        <div className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            AI video tools on Trustpilot · ranked by real rating
          </p>
          <div className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {VIDEO_BOARD.map((r, i) => (
              <div
                key={r.domain}
                className={`grid grid-cols-[28px_1fr_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[36px_200px_1fr_120px] ${r.mine ? "bg-[#FFC83D]/[0.07]" : ""}`}
              >
                <span className="pl-1 font-mono text-xs text-white/30">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="truncate text-[15px]">
                    {r.name}{" "}
                    {r.mine && <span className="ml-1 rounded bg-[#FFC83D] px-1.5 py-0.5 font-mono text-[10px] text-black">MINE</span>}
                  </div>
                  <div className="font-mono text-[11px] text-white/40">{r.reviews.toLocaleString("en-US")} reviews</div>
                </div>
                <StarSplit stars={r.stars} className="order-4 col-span-3 sm:order-none sm:col-span-1" />
                <div className="flex items-baseline justify-end gap-2 font-mono">
                  <span className="text-xs text-white/40">{r.trustScore.toFixed(1)}</span>
                  <span className="text-2xl tabular-nums" style={{ color: rgb(realColor(r.real)) }}>
                    {r.real.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-white/35">
            Left number: TrustScore. Right: real rating among these {VIDEO_BOARD.length} tools. Bar: share of 5★ to 1★
            reviews. Trustpilot pages read {fmtDate(TP_DATE)}.
          </p>
        </div>
      </section>

      {/* FIG 06: method */}
      <section className="mx-auto max-w-5xl px-5 pt-28 sm:px-8 sm:pt-36">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Fig. 06 · How the math works</p>
        <h2 className="mt-3 font-serif text-5xl leading-[0.95] sm:text-6xl">No vibes. Just rank.</h2>
        <div className="mt-10 grid gap-8 text-[14px] leading-relaxed text-white/60 sm:grid-cols-3">
          <div>
            <div className="font-mono text-xs text-[#FFC83D]">01 · the pile</div>
            <p className="mt-2">
              {all.n.toLocaleString("en-US")} apps from the US App Store top free, paid and grossing charts in 25
              categories, read from Apple&apos;s public API on {date}. Apps with fewer than {MIN_COUNT} ratings stay out of
              the pile.
            </p>
          </div>
          <div>
            <div className="font-mono text-xs text-[#FFC83D]">02 · the shrink</div>
            <p className="mt-2">
              Small apps get pulled toward the middle of their category, as if {PRIOR} middle-of-the-pack ratings were added to every app. A
              5.0 from 12 people doesn&apos;t beat a 4.8 from 2 million.
            </p>
          </div>
          <div>
            <div className="font-mono text-xs text-[#FFC83D]">03 · the rank</div>
            <p className="mt-2">
              Real rating = 1 + 4 × your percentile in your category. Middle of the pack is 3.0, the top app is 5.0, the
              last one is 1.0. Categories under 60 apps use the whole store.
            </p>
          </div>
        </div>
        <p className="mt-8 max-w-2xl font-mono text-[11px] leading-relaxed text-white/35">
          Public numbers and simple math. This says nothing about whether any review is fake. A low real rating means
          &quot;rated lower than its neighbours&quot;, that&apos;s all. Searches outside the snapshot use the live App Store
          rating against the {date} spread.
        </p>
      </section>

      <footer className="mx-auto mt-32 flex max-w-5xl flex-col gap-4 border-t border-white/[0.06] px-5 py-10 font-mono text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>
          made by{" "}
          <a href="https://x.com/tibo_maker" className="text-white/70 hover:text-white">
            @tibo_maker
          </a>{" "}
          ·{" "}
          <a href="https://github.com/tmakersas/real-rating" className="hover:text-white">
            source
          </a>
        </span>
        <span>
          need people to find your app?{" "}
          <a href="https://revid.ai/?ref=realrating" className="text-white/70 underline decoration-white/20 hover:text-white">
            turn it into short videos with Revid
          </a>
        </span>
      </footer>
    </main>
  );
}

function StarSplit({ stars, className = "" }: { stars: SaasRow["stars"]; className?: string }) {
  const order = ["5", "4", "3", "2", "1"] as const;
  const colors = ["#3DFFB4", "#9EE88E", "#FFC83D", "#FF8A5C", "#FF4D5E"];
  return (
    <div className={`flex h-2 w-full overflow-hidden rounded-full bg-white/5 ${className}`}>
      {order.map((k, i) => (
        <div key={k} style={{ width: `${stars[k]}%`, background: colors[i] }} title={`${k}★ ${stars[k]}%`} />
      ))}
    </div>
  );
}

function MineCard({ m }: { m: SaasRow }) {
  const c = rgb(realColor(m.real));
  const vs = m.domain === "revid.ai" ? `vs ${m.peers - 1} AI video tools` : `vs ${m.peers - 1} other SaaS sampled`;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <span className="text-lg">{m.name}</span>
        <span className="font-mono text-[10px] text-white/40">{m.domain}</span>
      </div>
      <div className="mt-5 flex items-baseline gap-3 font-mono">
        <span className="text-sm text-white/40 line-through decoration-white/30">{m.trustScore.toFixed(1)}</span>
        <span className="text-6xl tabular-nums" style={{ color: c }}>
          <Ticker value={m.real} from={m.trustScore} decimals={1} />
        </span>
      </div>
      <div className="mt-1 font-mono text-[11px] text-white/45">
        {vs} · {m.reviews} reviews
      </div>
      <StarSplit stars={m.stars} className="mt-5" />
      <div className="mt-2 font-mono text-[11px] text-white/45">
        {m.stars["5"]}% 5★ · {m.stars["1"]}% 1★{m.reviews < 30 ? " · too few reviews to mean much" : ""}
      </div>
    </div>
  );
}
