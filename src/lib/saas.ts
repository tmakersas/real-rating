import tp from "@/data/trustpilot.json";

export type SaasRow = {
  domain: string;
  name: string;
  category: string;
  trustScore: number;
  reviews: number;
  stars: Record<"1" | "2" | "3" | "4" | "5", number>;
  real: number;
  pct: number;
  peers: number;
  mine: boolean;
};

const PRIOR = 50;
const NAMES: Record<string, string> = { "descript.com": "Descript", "invideo.io": "InVideo" };

export const TP_DATE = tp.scrapedAt as string;

type Raw = Omit<SaasRow, "real" | "pct" | "peers" | "mine">;
const raw = (tp.items as unknown as Raw[]).map((r) => ({ ...r, name: NAMES[r.domain] ?? r.name }));

function rank(set: Raw[], row: Raw) {
  const mu = set.reduce((s, r) => s + r.trustScore, 0) / set.length;
  const adj = (r: Raw) => (r.reviews * r.trustScore + PRIOR * mu) / (r.reviews + PRIOR);
  const all = set.map(adj).sort((a, b) => a - b);
  const a = adj(row);
  const lo = all.filter((x) => x < a).length;
  const hi = all.filter((x) => x <= a).length;
  const p = (lo + hi) / 2 / all.length;
  return { real: Math.round((1 + 4 * p) * 10) / 10, pct: Math.round(p * 100), peers: all.length };
}

// Revid is an AI video tool, so it is ranked against the AI video tools.
// Outrank and PostSyncer have no sampled peers yet, so they are ranked against every SaaS in the sample.
const video = raw.filter((r) => r.category === "ai-video" || r.domain === "revid.ai");

export const SAAS: SaasRow[] = raw.map((r) => {
  const set = r.category === "ai-video" || r.domain === "revid.ai" ? video : raw;
  return { ...r, ...rank(set, r), mine: r.category === "tmaker" };
});

export const VIDEO_BOARD = SAAS.filter((r) => r.category === "ai-video" || r.domain === "revid.ai").sort(
  (a, b) => b.real - a.real || b.trustScore - a.trustScore,
);
export const MINE = SAAS.filter((r) => r.mine);
