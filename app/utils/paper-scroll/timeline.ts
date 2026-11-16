// 場景時間軸一律寫「捲到第幾 vh」，再換成引擎用的進度 p（捲動距離 = 跑道 − 一個畫面，舞台 100lvh）。
import { clamp01, EASE } from './keyframes';

/** 硬切、隱藏用的極小進度差 */
export const EPS = 0.0001;

export type TextRange = { in: [number, number]; out: [number, number] };

export function timeline(trackVh: number) {
  const dist = trackVh - 100;
  const at = (vh: number) => vh / dist;
  const range = (a: number, b: number): [number, number] => [at(a), at(b)];
  /** 文字進出場：[淡入起, 淡入完]、[淡出起, 淡出完]（vh） */
  const cue = (a: number, b: number, c: number, d: number): TextRange => ({ in: range(a, b), out: range(c, d) });
  return { dist, at, range, cue };
}

/** 0 → 1 → 0：進場淡入、退場淡出 */
export function presenceOf({ in: [a, b], out: [c, d] }: TextRange, p: number): number {
  if (p < c) return EASE.out(clamp01((p - a) / (b - a)));
  return 1 - EASE.in(clamp01((p - c) / (d - c)));
}
