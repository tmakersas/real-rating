import genresData from "@/data/genres.json";

type Genre = {
  name: string;
  n: number;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  adj: number[];
};

export const SNAPSHOT_DATE = genresData.fetchedAt as string;
export const PRIOR = genresData.prior as number;
export const MIN_COUNT = genresData.minCount as number;
export const GENRES = genresData.genres as unknown as Record<string, Genre>;

function bisect(arr: number[], x: number, right: boolean) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (right ? arr[mid] <= x : arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export type Scored = {
  stars: number;
  count: number;
  real: number;
  percentile: number;
  category: string;
  categorySize: number;
  categoryMedian: number;
  verdict: string;
  lowSample: boolean;
};

export function verdictFor(real: number) {
  if (real >= 4.6) return "Actually great";
  if (real >= 3.8) return "Good";
  if (real >= 2.6) return "Painfully average";
  if (real >= 1.8) return "Below average";
  return "Bottom of the pile";
}

/** Re-score a public star rating against the real spread of its category. */
export function scoreApp(stars: number, count: number, genre: string): Scored {
  const g = GENRES[genre] ?? GENRES["All apps"];
  const adjusted = (count * stars + PRIOR * g.mean) / (count + PRIOR); // g.mean holds the category median
  const lo = bisect(g.adj, adjusted, false);
  const hi = bisect(g.adj, adjusted, true);
  const p = (lo + hi) / 2 / g.adj.length;
  const real = Math.round((1 + 4 * p) * 10) / 10;
  return {
    stars,
    count,
    real,
    percentile: Math.round(p * 100),
    category: g.name,
    categorySize: g.n,
    categoryMedian: g.median,
    verdict: verdictFor(real),
    lowSample: count < MIN_COUNT,
  };
}

export function inflationBoard() {
  return Object.values(GENRES)
    .filter((g) => g.name !== "All apps")
    .map((g) => ({
      name: g.name,
      n: g.n,
      median: g.median,
      p10: g.p10,
      p90: g.p90,
    }))
    .sort((a, b) => b.median - a.median);
}
