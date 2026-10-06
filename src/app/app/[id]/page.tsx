import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lookupApp } from "@/lib/itunes";
import { realColor, rgb } from "@/lib/color";
import { GENRES, SNAPSHOT_DATE } from "@/lib/score";
import Ticker from "@/components/Ticker";
import ShareButton from "@/components/ShareButton";

export const revalidate = 86400;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const app = await lookupApp(id);
  if (!app) return { title: "Real Rating" };
  const title = `${app.name} real rating: ${app.real.toFixed(1)} (not ${app.stars.toFixed(1)}★)`;
  const description = `${app.name} has ${app.stars.toFixed(2)} stars from ${app.count.toLocaleString("en-US")} ratings. Against the other top ${app.category} apps, that is a real ${app.real.toFixed(1)} out of 5.`;
  return {
    title,
    description,
    alternates: { canonical: `/app/${id}` },
    openGraph: { title, description, images: [{ url: `/api/og?id=${id}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [`/api/og?id=${id}`], creator: "@tibo_maker" },
  };
}

export default async function AppPage({ params }: Props) {
  const { id } = await params;
  const app = await lookupApp(id);
  if (!app) notFound();
  const c = rgb(realColor(app.real));
  const g = GENRES[app.category];
  const better = 100 - app.percentile;
  const shareText = `${app.name} has ${app.stars.toFixed(1)}★ on the App Store.\n\nreal rating: ${app.real.toFixed(1)}\n\nevery app is 4.7 stars now, so I checked`;

  return (
    <main className="min-h-[100svh] bg-[#09090b] px-5 pb-16 pt-6 text-white sm:px-10 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 sm:text-[11px]">
          <Link href="/" className="hover:text-white">← Real Rating</Link>
          <span>{app.category} · {app.categorySize} apps</span>
        </div>

        <div className="mt-12 flex items-center gap-5">
          {app.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.icon} alt="" width={88} height={88} className="h-16 w-16 rounded-[22%] sm:h-22 sm:w-22" />
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-4xl leading-none sm:text-6xl">{app.name}</h1>
            <p className="mt-2 truncate font-mono text-[11px] text-white/45">
              {app.seller} · {app.count.toLocaleString("en-US")} ratings
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/[0.08] p-5 sm:p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">App Store</div>
            <div className="mt-3 font-mono text-5xl text-[#FFC83D]/80 line-through decoration-white/30 sm:text-7xl">
              {app.stars.toFixed(1)}★
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border p-5 sm:p-8" style={{ borderColor: c, boxShadow: `0 0 80px -30px ${c}` }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Real rating</div>
            <div className="mt-3 font-mono text-6xl tabular-nums sm:text-8xl" style={{ color: c }}>
              <Ticker value={app.real} from={app.stars} decimals={1} duration={1.6} />
            </div>
          </div>
        </div>

        <p className="mt-8 font-serif text-3xl leading-tight sm:text-4xl">
          <em style={{ color: c }}>{app.verdict}.</em>{" "}
          {better > 50
            ? `${better}% of the top ${app.category} apps are rated higher.`
            : `Rated higher than ${app.percentile}% of the top ${app.category} apps.`}
        </p>
        {g && (
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            In {app.category}, the middle app has {g.median.toFixed(2)}★ and the bottom 10% still has {g.p10.toFixed(2)}★ or
            more. So {app.stars.toFixed(2)}★ lands at the {ordinal(app.percentile)} percentile, which is a {app.real.toFixed(1)}{" "}
            on a scale where 3.0 is the middle.
          </p>
        )}
        {app.lowSample && (
          <p className="mt-3 font-mono text-[11px] text-white/45">
            Only {app.count} ratings, so this one is pulled hard toward the category average.
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <ShareButton text={shareText} path={`/app/${app.id}`} />
          <Link href="/#" className="rounded-full border border-white/15 px-5 py-3 font-mono text-xs text-white/70 hover:border-white/40 hover:text-white">
            deflate another app
          </Link>
        </div>

        <p className="mt-16 font-mono text-[11px] leading-relaxed text-white/35">
          Live App Store rating, ranked against {g ? g.n : "the"} top {app.category} apps read on {SNAPSHOT_DATE}. Public
          numbers and simple math, not a verdict on whether any review is real. Made by{" "}
          <a className="text-white/60 hover:text-white" href="https://x.com/tibo_maker">@tibo_maker</a>.
        </p>
      </div>
    </main>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
