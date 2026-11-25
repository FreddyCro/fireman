// 04 屏東地圖：分隊之間移動的小圓點（ManpowerPingtung.vue）。座標為投影後 SVG 座標。

type Pt = [number, number];

/** 二次貝茲弧線上的點：控制點在 a→b 中點往法線偏 bend × 距離 */
export function arcPoint(a: Pt, b: Pt, bend: number, t: number): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const c: Pt = [(a[0] + b[0]) / 2 - dy * bend, (a[1] + b[1]) / 2 + dx * bend];
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

/**
 * 整體進度 p（0＝都在起點、1＝都到終點）換算第 i 顆的進度，前後錯開成一串。
 * 第 0 顆最先出發；p＝0、1 時全部在端點。
 */
export function dotProgress(p: number, i: number, n: number, stagger = 0.6): number {
  const lag = n > 1 ? (stagger * i) / (n - 1) : 0;
  return Math.min(Math.max(p * (1 + stagger) - lag, 0), 1);
}

/** 停在端點時隱藏（和分隊點重疊），離開端點一點點就完全顯示 */
export const dotOpacity = (t: number) => Math.min(1, t * 8, (1 - t) * 8);
