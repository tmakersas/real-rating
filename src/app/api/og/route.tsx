import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { lookupApp } from "@/lib/itunes";
import { realColor, rgb } from "@/lib/color";
import { SNAPSHOT_DATE } from "@/lib/score";
import field from "@/data/field.json";

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginLeft: size * 0.08 }}>
      <path fill={color} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

const BINS = 48;
const hist = (() => {
  const a = new Array(BINS).fill(0);
  const b = new Array(BINS).fill(0);
  for (const r of field.apps as unknown as number[][]) {
    a[Math.min(BINS - 1, Math.floor(((r[0] - 1) / 4) * BINS))]++;
    b[Math.min(BINS - 1, Math.floor(((r[1] - 1) / 4) * BINS))]++;
  }
  const max = Math.max(...a);
  return { a: a.map((x) => x / max), b: b.map((x) => x / max) };
})();

const font = (f: string) => readFile(join(process.cwd(), "assets", f));

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const [serif, serifItalic, mono, monoBold] = await Promise.all([
    font("InstrumentSerif-Regular.ttf"),
    font("InstrumentSerif-Italic.ttf"),
    font("SpaceMono-Regular.ttf"),
    font("SpaceMono-Bold.ttf"),
  ]);
  const fonts = [
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Serif", data: serifItalic, weight: 400 as const, style: "italic" as const },
    { name: "Mono", data: mono, weight: 400 as const, style: "normal" as const },
    { name: "Mono", data: monoBold, weight: 700 as const, style: "normal" as const },
  ];
  const app = id ? await lookupApp(id) : null;
  const headers = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" };

  if (!app) {
    // Home card: a squished tower of real data next to a flat line.
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#09090b", color: "#fff", padding: 64, fontFamily: "Mono" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "rgba(255,255,255,0.5)", letterSpacing: 3 }}>
            <span>REAL RATING</span>
            <span>4,883 IPHONE APPS · {SNAPSHOT_DATE}</span>
          </div>
          <div style={{ display: "flex", marginTop: 50, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: 150, lineHeight: 0.9 }}>
              <span>4.7 stars is</span>
              <span style={{ fontStyle: "italic", color: "#FFC83D" }}>average.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", height: 250, gap: 2, borderBottom: "2px solid rgba(255,255,255,0.25)" }}>
              {hist.a.map((v, i) => (
                <div key={i} style={{ width: 6, height: Math.max(2, v * 246), background: "#FFC83D", opacity: 0.35 + v * 0.65 }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", marginTop: "auto", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,0.7)" }}>type any app, watch it deflate →</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <span style={{ display: "flex", alignItems: "center", fontSize: 44, color: "#FFC83D", textDecoration: "line-through" }}>4.68<Star size={36} color="#FFC83D" /></span>
              <span style={{ fontSize: 96, fontWeight: 700, color: rgb(realColor(3)) }}>3.0</span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts, headers },
    );
  }

  const c = rgb(realColor(app.real));
  const name = app.name.length > 34 ? app.name.slice(0, 32) + "…" : app.name;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#09090b", color: "#fff", padding: 64, fontFamily: "Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "rgba(255,255,255,0.5)", letterSpacing: 3 }}>
          <span>REAL RATING</span>
          <span>{app.category.toUpperCase()} · {app.categorySize} APPS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 56 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {app.icon ? <img alt="" src={app.icon} width={120} height={120} style={{ borderRadius: 28 }} /> : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Serif", fontSize: 72, lineHeight: 1 }}>{name}</span>
            <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 10 }}>
              {app.count.toLocaleString("en-US")} ratings on the App Store
            </span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, color: "rgba(255,255,255,0.5)" }}>as rated</span>
            <span style={{ display: "flex", alignItems: "center", fontSize: 110, color: "#FFC83D", textDecoration: "line-through", lineHeight: 1 }}>{app.stars.toFixed(1)}<Star size={84} color="#FFC83D" /></span>
          </div>
          <div style={{ display: "flex", fontSize: 60, color: "rgba(255,255,255,0.35)", paddingBottom: 30 }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 26, color: "rgba(255,255,255,0.5)" }}>real · {app.verdict.toLowerCase()}</span>
            <span style={{ fontSize: 190, fontWeight: 700, color: c, lineHeight: 0.9 }}>{app.real.toFixed(1)}</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts, headers },
  );
}
