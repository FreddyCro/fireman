// C4 的「捲到定點自動播放、播完接下一段」：以捲動進度分區、區內以時間分段。
// 規則：正向進區從頭播；反向退回直接顯示播完狀態、不淡化；退到第一個觸發點以下全部重置。
// 全部是純函式，影片的 play／reset 以 events 交給 PaperScene 套用。
import { clamp01 } from './keyframes';
import type { SequenceConfig, SequenceStep } from './types';

export type SequencePhase = 'playing' | 'ended';

export interface SequenceState {
  /** 所在區（steps 的 index），-1 = 尚未進入 */
  step: number;
  phase: SequencePhase;
  /** 進入目前 phase 的時刻（ms），算交叉淡化用；-Infinity = 不淡化 */
  since: number;
}

export interface SequenceEvent {
  type: 'play' | 'reset';
  id: string;
}

export interface SequenceInput {
  p: number;
  now: number;
  /** 該影片是否已播完；找不到影片時請回 true，序列才不會卡住 */
  ended: (id: string) => boolean;
  reduceMotion?: boolean;
}

export const INITIAL_SEQUENCE: SequenceState = { step: -1, phase: 'ended', since: -Infinity };

export function stepFor(steps: SequenceStep[], p: number): number {
  let s = -1;
  steps.forEach((st, i) => {
    if (p >= st.trigger) s = i;
  });
  return s;
}

export function advanceSequence(
  prev: SequenceState,
  cfg: SequenceConfig,
  input: SequenceInput,
): { state: SequenceState; events: SequenceEvent[] } {
  const s = stepFor(cfg.steps, input.p);
  if (s > prev.step) {
    const step = cfg.steps[s]!;
    if (input.reduceMotion) {
      return { state: { step: s, phase: 'ended', since: -Infinity }, events: [{ type: 'reset', id: step.play }] };
    }
    return { state: { step: s, phase: 'playing', since: input.now }, events: [{ type: 'play', id: step.play }] };
  }
  if (s < prev.step) {
    const events: SequenceEvent[] = [];
    for (let i = s + 1; i <= prev.step; i++) events.push({ type: 'reset', id: cfg.steps[i]!.play });
    return { state: { step: s, phase: 'ended', since: -Infinity }, events };
  }
  if (s >= 0 && prev.phase === 'playing' && input.ended(cfg.steps[s]!.play)) {
    return { state: { step: s, phase: 'ended', since: input.now }, events: [] };
  }
  return { state: prev, events: [] };
}

/** 成員元素的 opacity 覆寫。尚未進區回空 Map（成員走自己的關鍵幀，例如 4-1 從上一張淡入） */
export function sequenceOpacities(cfg: SequenceConfig, state: SequenceState, now: number): Map<string, number> {
  const out = new Map<string, number>();
  if (state.step < 0) return out;
  const fade = cfg.fade ?? 400;
  const t = fade > 0 ? clamp01((now - state.since) / fade) : 1;
  for (const st of cfg.steps) {
    out.set(st.play, 0);
    if (st.then) out.set(st.then, 0);
  }
  const cur = cfg.steps[state.step]!;
  if (state.phase === 'playing') {
    out.set(cur.play, 1);
    const prevThen = cfg.steps[state.step - 1]?.then;
    if (prevThen) out.set(prevThen, 1 - t);
  } else {
    out.set(cur.play, 1 - t);
    if (cur.then) out.set(cur.then, t);
  }
  return out;
}
