import type { BackgroundStop, EaseName, Keyframe, NumericProp } from './types';

export const EASE: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 只取有定義該屬性的幀（假設 kfs 已依 p 排序） */
function framesWith<K extends NumericProp | 'layer'>(kfs: Keyframe[], prop: K) {
  return kfs.filter((k) => k[prop] !== undefined) as (Keyframe & Record<K, number>)[];
}

/** 數值屬性：各屬性獨立插值，用後一幀的 ease；頭尾之外取端點值 */
export function sampleNumber(kfs: Keyframe[], prop: NumericProp, p: number, fallback: number): number {
  const ks = framesWith(kfs, prop);
  if (ks.length === 0) return fallback;
  if (p <= ks[0]!.p) return ks[0]![prop];
  const last = ks[ks.length - 1]!;
  if (p >= last.p) return last[prop];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i]!;
    const b = ks[i + 1]!;
    if (p >= a.p && p < b.p) {
      const t = (p - a.p) / (b.p - a.p);
      return lerp(a[prop], b[prop], EASE[b.ease ?? 'linear'](t));
    }
  }
  return last[prop];
}

/** 階梯屬性：最後一個 p <= 進度 的值；第一幀之前取第一幀 */
export function sampleStep(kfs: Keyframe[], prop: 'layer', p: number, fallback: number): number {
  const ks = framesWith(kfs, prop);
  if (ks.length === 0) return fallback;
  let v = ks[0]![prop];
  for (const k of ks) if (k.p <= p) v = k[prop];
  return v;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** 背景色：RGB 線性插值 */
export function sampleColor(stops: BackgroundStop[], p: number): string {
  if (stops.length === 0) return '#000000';
  if (p <= stops[0]!.p) return stops[0]!.color;
  const last = stops[stops.length - 1]!;
  if (p >= last.p) return last.color;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (p >= a.p && p < b.p) {
      const t = (p - a.p) / (b.p - a.p);
      const ca = hexToRgb(a.color);
      const cb = hexToRgb(b.color);
      return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
    }
  }
  return last.color;
}
