// 格數邏輯。內部一律用「無上限的 raw index」，顯示時才做 loop 對應，
// 所以 repeat 的往回捲、pingpong 的折返都不需要特殊處理。
import { clamp01 } from './keyframes';
import type { LoopMode } from './types';

export function loopIndex(raw: number, frames: number, loop: LoopMode): number {
  if (frames <= 1) return 0;
  if (loop === 'clamp') return Math.min(frames - 1, Math.max(0, raw));
  if (loop === 'repeat') return ((raw % frames) + frames) % frames;
  const period = (frames - 1) * 2;
  const m = ((raw % period) + period) % period;
  return m < frames ? m : period - m;
}

/** time 模式：累加格數（浮點），fps 可以隨時改而不跳格 */
export function advanceTime(acc: number, dtMs: number, fps: number): number {
  return acc + (dtMs / 1000) * fps;
}

export interface ScrollTargetOpts {
  progress: number;
  scrollPx: number;
  frames: number;
  pxPerFrame?: number;
  range?: [number, number];
}

/** scroll 模式的目標 raw index */
export function scrollTargetRaw(o: ScrollTargetOpts): number {
  if (o.range) {
    const [from, to] = o.range;
    const t = to > from ? clamp01((o.progress - from) / (to - from)) : 1;
    return Math.min(o.frames - 1, Math.floor(t * o.frames));
  }
  return Math.floor(o.scrollPx / (o.pxPerFrame ?? 60));
}

/** 每 tick 朝目標最多走 maxStep 格（0 = 不限），避免快速捲動時的車輪效應 */
export function stepToward(current: number, target: number, maxStep: number): number {
  const d = target - current;
  if (maxStep <= 0 || Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}
