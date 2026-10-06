import { searchApps } from "@/lib/itunes";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const results = await searchApps(q);
    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return Response.json({ error: "The App Store didn't answer. Try again in a minute." }, { status: 502 });
  }
}
