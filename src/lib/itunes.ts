import { scoreApp, type Scored } from "./score";

export type AppResult = Scored & {
  id: number;
  name: string;
  seller: string;
  genre: string;
  icon: string;
  url: string;
};

type ITunesApp = {
  trackId: number;
  trackName: string;
  sellerName?: string;
  primaryGenreName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  artworkUrl100?: string;
  artworkUrl512?: string;
  trackViewUrl?: string;
  wrapperType?: string;
  kind?: string;
};

const DAY = 60 * 60 * 24;

function toResult(a: ITunesApp): AppResult | null {
  if (!a.trackId || !a.trackName) return null;
  const stars = a.averageUserRating ?? 0;
  const count = a.userRatingCount ?? 0;
  if (!stars || !count) return null;
  const genre = a.primaryGenreName ?? "All apps";
  return {
    id: a.trackId,
    name: a.trackName,
    seller: a.sellerName ?? "",
    genre,
    icon: (a.artworkUrl512 || a.artworkUrl100 || "").replace("http://", "https://"),
    url: (a.trackViewUrl ?? "").split("?")[0],
    ...scoreApp(stars, count, genre),
  };
}

export async function searchApps(q: string): Promise<AppResult[]> {
  const url = `https://itunes.apple.com/search?country=us&entity=software&limit=8&term=${encodeURIComponent(q)}`;
  const res = await fetch(url, { next: { revalidate: DAY } });
  if (!res.ok) throw new Error(`App Store search failed (${res.status})`);
  const data = (await res.json()) as { results: ITunesApp[] };
  return data.results.map(toResult).filter((x): x is AppResult => x !== null).slice(0, 6);
}

export async function lookupApp(id: string): Promise<AppResult | null> {
  if (!/^\d{5,12}$/.test(id)) return null;
  const res = await fetch(`https://itunes.apple.com/lookup?country=us&id=${id}`, {
    next: { revalidate: DAY },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { results: ITunesApp[] };
  const a = data.results.find((r) => r.wrapperType === "software" || r.kind === "software");
  return a ? toResult(a) : null;
}
