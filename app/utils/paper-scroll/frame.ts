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

export interface FrameBlend {
  /** 底下那格（完整顯示時就是目前格） */
  frame: number;
  /** 淡入中的下一格；mix = 0 時與 frame 相同 */
  next: number;
  /** 下一格的權重 0～1 */
  mix: number;
}

/**
 * scroll + range 的逐格交叉淡化：區間平均分給各格（同 scrollTargetRaw），
 * 每個格與格的交界前後各 fade/2 進度內，前一格淡出、下一格淡入（smoothstep），其餘時間單格完整顯示。
 * fade 會被夾在一格的長度以內。
 */
export function scrollBlend(progress: number, range: [number, number], frames: number, fade: number): FrameBlend {
  const [from, to] = range;
  const len = to - from;
  if (frames <= 1 || len <= 0) {
    const f = frames <= 1 || progress < from ? 0 : frames - 1;
    return { frame: f, next: f, mix: 0 };
  }
  const slot = len / frames;
  const half = Math.min(fade, slot) / 2;
  const pos = Math.min(len, Math.max(0, progress - from));
  // 最近的交界 k（1～frames−1），位於 from + k·slot
  const k = Math.min(frames - 1, Math.max(1, Math.round(pos / slot)));
  const d = pos - k * slot;
  if (half > 0 && Math.abs(d) < half) {
    const t = (d + half) / (2 * half);
    return { frame: k - 1, next: k, mix: t * t * (3 - 2 * t) };
  }
  const f = Math.min(frames - 1, Math.floor(pos / slot));
  return { frame: f, next: f, mix: 0 };
}

/** 每 tick 朝目標最多走 maxStep 格（0 = 不限），避免快速捲動時的車輪效應 */
export function stepToward(current: number, target: number, maxStep: number): number {
  const d = target - current;
  if (maxStep <= 0 || Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}
