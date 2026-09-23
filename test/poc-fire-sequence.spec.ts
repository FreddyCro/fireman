import { describe, expect, it } from 'vitest';
import {
  INITIAL_SEQUENCE,
  advanceSequence,
  sequenceOpacities,
  stepFor,
  type SequenceState,
} from '../app/utils/poc/paper-scroll/sequence';
import type { SequenceConfig } from '../app/utils/poc/paper-scroll/types';

const cfg: SequenceConfig = {
  steps: [
    { trigger: 0.75, play: '4-1', then: '4-2' },
    { trigger: 0.86, play: '4-3' },
  ],
  fade: 400,
};
const notEnded = () => false;
const allEnded = () => true;

describe('stepFor', () => {
  it('觸發點以下是 -1，之後取最後一個越過的區', () => {
    expect(stepFor(cfg.steps, 0.5)).toBe(-1);
    expect(stepFor(cfg.steps, 0.75)).toBe(0);
    expect(stepFor(cfg.steps, 0.9)).toBe(1);
  });
});

describe('advanceSequence', () => {
  it('正向進區：從頭播放該區影片', () => {
    const r = advanceSequence(INITIAL_SEQUENCE, cfg, { p: 0.8, now: 1000, ended: notEnded });
    expect(r.state).toEqual({ step: 0, phase: 'playing', since: 1000 });
    expect(r.events).toEqual([{ type: 'play', id: '4-1' }]);
  });

  it('播完後進入 ended，記下時刻', () => {
    const playing: SequenceState = { step: 0, phase: 'playing', since: 1000 };
    expect(advanceSequence(playing, cfg, { p: 0.8, now: 2000, ended: notEnded }).state).toBe(playing);
    const r = advanceSequence(playing, cfg, { p: 0.8, now: 4000, ended: allEnded });
    expect(r.state).toEqual({ step: 0, phase: 'ended', since: 4000 });
    expect(r.events).toEqual([]);
  });

  it('反向退回：顯示播完狀態、不淡化、離開的區影片重置', () => {
    const r = advanceSequence({ step: 1, phase: 'playing', since: 5000 }, cfg, { p: 0.8, now: 6000, ended: notEnded });
    expect(r.state).toEqual({ step: 0, phase: 'ended', since: -Infinity });
    expect(r.events).toEqual([{ type: 'reset', id: '4-3' }]);
  });

  it('退到第一個觸發點以下：全部重置', () => {
    const r = advanceSequence({ step: 1, phase: 'ended', since: 5000 }, cfg, { p: 0.5, now: 6000, ended: notEnded });
    expect(r.state.step).toBe(-1);
    expect(r.events).toEqual([
      { type: 'reset', id: '4-1' },
      { type: 'reset', id: '4-3' },
    ]);
  });

  it('直接跳進區 1：只播 4-3', () => {
    const r = advanceSequence(INITIAL_SEQUENCE, cfg, { p: 0.9, now: 1000, ended: notEnded });
    expect(r.state).toEqual({ step: 1, phase: 'playing', since: 1000 });
    expect(r.events).toEqual([{ type: 'play', id: '4-3' }]);
  });

  it('reduceMotion：進區直接顯示播完狀態、不播放', () => {
    const r = advanceSequence(INITIAL_SEQUENCE, cfg, { p: 0.8, now: 1000, ended: notEnded, reduceMotion: true });
    expect(r.state).toEqual({ step: 0, phase: 'ended', since: -Infinity });
    expect(r.events).toEqual([{ type: 'reset', id: '4-1' }]);
  });
});

// 評審發現：區與區之間要「上層淡入、下層撐著」才是交叉淡化；上層直接 1 會硬切，下層同時淡出會有亮度凹陷。
// from 記的是進區前畫面上的那個元素，淡入期間它保持 1。
describe('advanceSequence 的 from', () => {
  it('從區 0 播完（4-2 顯示中）進區 1：from 是 4-2', () => {
    const r = advanceSequence({ step: 0, phase: 'ended', since: 0 }, cfg, { p: 0.9, now: 1000, ended: notEnded });
    expect(r.state).toEqual({ step: 1, phase: 'playing', since: 1000, from: '4-2' });
  });

  it('4-1 還在播就越過 T3：from 是 4-1（它還在畫面上）', () => {
    const r = advanceSequence({ step: 0, phase: 'playing', since: 0 }, cfg, { p: 0.9, now: 1000, ended: notEnded });
    expect(r.state.from).toBe('4-1');
  });

  it('從區外直接進區：沒有 from', () => {
    expect(advanceSequence(INITIAL_SEQUENCE, cfg, { p: 0.9, now: 1000, ended: notEnded }).state.from).toBeUndefined();
  });
});

describe('sequenceOpacities', () => {
  it('尚未進區：不覆寫（走關鍵幀）', () => {
    expect(sequenceOpacities(cfg, INITIAL_SEQUENCE, 0).size).toBe(0);
  });

  it('從區外進區 0（4-1 已用關鍵幀淡入）：4-1 立刻是 1，不會閃黑', () => {
    const o = sequenceOpacities(cfg, { step: 0, phase: 'playing', since: 100 }, 100);
    expect([o.get('4-1'), o.get('4-2'), o.get('4-3')]).toEqual([1, 0, 0]);
  });

  it('區 0 播完：4-2（上層）400ms 淡入，4-1 撐到淡化結束才歸 0', () => {
    const mid = sequenceOpacities(cfg, { step: 0, phase: 'ended', since: 1000 }, 1200);
    expect(mid.get('4-2')).toBeCloseTo(0.5);
    expect(mid.get('4-1')).toBe(1);
    expect(mid.get('4-3')).toBe(0);
    const done = sequenceOpacities(cfg, { step: 0, phase: 'ended', since: 1000 }, 1400);
    expect([done.get('4-1'), done.get('4-2')]).toEqual([0, 1]);
  });

  it('區 1 播放中（從 4-2 進來）：4-3 淡入，4-2 撐到淡化結束', () => {
    const mid = sequenceOpacities(cfg, { step: 1, phase: 'playing', since: 1000, from: '4-2' }, 1100);
    expect(mid.get('4-3')).toBeCloseTo(0.25);
    expect(mid.get('4-2')).toBe(1);
    expect(mid.get('4-1')).toBe(0);
    const done = sequenceOpacities(cfg, { step: 1, phase: 'playing', since: 1000, from: '4-2' }, 1400);
    expect([done.get('4-2'), done.get('4-3')]).toEqual([0, 1]);
  });

  it('直接跳進區 1（沒有 from）：4-3 立刻是 1，4-2 從頭到尾都是 0', () => {
    const o = sequenceOpacities(cfg, { step: 1, phase: 'playing', since: 1000 }, 1000);
    expect([o.get('4-1'), o.get('4-2'), o.get('4-3')]).toEqual([0, 0, 1]);
  });

  it('區 1 播完（沒有 then）：4-3 淡到背景；since = -Infinity 時立即完成', () => {
    expect(sequenceOpacities(cfg, { step: 1, phase: 'ended', since: 1000 }, 1200).get('4-3')).toBeCloseTo(0.5);
    const o = sequenceOpacities(cfg, { step: 0, phase: 'ended', since: -Infinity }, 1000);
    expect([o.get('4-1'), o.get('4-2')]).toEqual([0, 1]);
  });
});
