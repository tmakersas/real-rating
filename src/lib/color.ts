export const GOLD: [number, number, number] = [255, 200, 61];

/** 1 = coral, 3 = gold, 5 = mint */
export function realColor(r: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (r - 1) / 4));
  const lo: [number, number, number] = [255, 77, 94];
  const hi: [number, number, number] = [61, 255, 180];
  const [a, b, k] = t < 0.5 ? [lo, GOLD, t / 0.5] : [GOLD, hi, (t - 0.5) / 0.5];
  return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * k)) as [number, number, number];
}

export const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
