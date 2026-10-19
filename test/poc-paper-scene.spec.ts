import { describe, expect, it } from 'vitest';
import {
  cellRect,
  clipExpand,
  clipRect,
  drawStateOf,
  nextFrame,
  resolveConfig,
  PaperScene,
  sortByLayer,
  type ElementRuntime,
} from '../app/utils/poc/paper-scroll/scene';
import type { ElementConfig, SceneConfig } from '../app/utils/poc/paper-scroll/types';

const sprite = { src: 'a.svg', frames: 4, cellW: 240, cellH: 320 };

const walker: ElementConfig = {
  id: 'walker',
  sprite,
  frameMode: 'scroll',
  pxPerFrame: 60,
  loop: 'repeat',
  triggers: [{ p: 0.3, set: { frameMode: 'hold', holdFrame: 2 } }],
  keyframes: [{ p: 0, x: 0.1, y: 0.8, layer: 2 }, { p: 0.3, x: 0.5, layer: 0 }],
};

const rt = (over: Partial<ElementRuntime> = {}): ElementRuntime => ({
  config: walker,
  acc: 0,
  phase: 0,
  raw: 0,
  frame: 0,
  jitterRot: 0,
  jitterX: 0,
  jitterY: 0,
  ...over,
});

describe('resolveConfig', () => {
  it('trigger 是進度的函數：到達後套用、退回去就還原', () => {
    expect(resolveConfig(walker, 0.2).frameMode).toBe('scroll');
    expect(resolveConfig(walker, 0.3).frameMode).toBe('hold');
    expect(resolveConfig(walker, 0.5).holdFrame).toBe(2);
    expect(resolveConfig(walker, 0.2).frameMode).toBe('scroll');
  });
  it('全域覆寫改 frameMode，但 hold 不受影響', () => {
    expect(resolveConfig(walker, 0.2, 'time').frameMode).toBe('time');
    expect(resolveConfig(walker, 0.5, 'time').frameMode).toBe('hold');
  });
});

describe('nextFrame', () => {
  it('scroll 模式：每 tick 最多走一格，追上後停在目標', () => {
    const r = rt();
    const cfg = resolveConfig(walker, 0.1);
    const input = { progress: 0.1, scrollPx: 190, dtMs: 16 }; // 目標 raw 3
    expect(nextFrame(r, cfg, input)).toBe(1);
    expect(nextFrame(r, cfg, input)).toBe(2);
    expect(nextFrame(r, cfg, input)).toBe(3);
    expect(nextFrame(r, cfg, input)).toBe(3);
  });
  it('hold 模式回固定格', () => {
    expect(nextFrame(rt(), resolveConfig(walker, 0.5), { progress: 0.5, scrollPx: 999, dtMs: 16 })).toBe(2);
  });
  it('time 模式：fps 關鍵幀生效；reduceMotion 時固定第 0 格', () => {
    const cfg: ElementConfig = {
      ...walker,
      frameMode: 'time',
      fps: 10,
      triggers: [],
      keyframes: [{ p: 0, fps: 10 }, { p: 1, fps: 0 }],
    };
    const r = rt({ config: cfg });
    expect(nextFrame(r, cfg, { progress: 0, scrollPx: 0, dtMs: 100 })).toBe(1); // 10fps × 0.1s
    expect(nextFrame(r, cfg, { progress: 0.5, scrollPx: 0, dtMs: 200 })).toBe(2); // 5fps × 0.2s
    expect(nextFrame(rt({ config: cfg, acc: 2.5 }), cfg, { progress: 0, scrollPx: 0, dtMs: 100 }, true)).toBe(0);
  });
});

describe('drawStateOf', () => {
  it('從關鍵幀取出繪製狀態，缺的用預設', () => {
    const s = drawStateOf(walker, 0.15);
    expect(s.x).toBeCloseTo(0.3);
    expect(s).toMatchObject({ y: 0.8, scale: 1, rot: 0, opacity: 1, layer: 2 });
  });
});

describe('clipExpand', () => {
  const clip = { ref: 'door', rect: [0, 0, 1, 1] as [number, number, number, number], from: 0.3, until: 0.6, fade: 0.08 };
  it('區間外不裁切（null）', () => {
    expect(clipExpand(clip, 0.2)).toBeNull();
    expect(clipExpand(clip, 0.6)).toBeNull();
  });
  it('區間內倍率 1，fade 段從 1 平滑放大到 4', () => {
    expect(clipExpand(clip, 0.5)).toBe(1);
    expect(clipExpand(clip, 0.56)).toBeCloseTo(2.5);
    expect(clipExpand(clip, 0.5999)).toBeCloseTo(4, 2);
  });
});

describe('cellRect / clipRect', () => {
  it('cellRect 以錨點與 scale 算出設計畫布上的格子矩形', () => {
    const r = cellRect(
      { ...sprite, anchor: [0.5, 1] },
      { x: 0.5, y: 0.8, scale: 2, rot: 0, opacity: 1, layer: 0 },
      { w: 1920, h: 1080 },
    );
    expect(r.x).toBeCloseTo(960 - 240);
    expect(r.y).toBeCloseTo(864 - 640);
    expect(r.w).toBeCloseTo(480);
    expect(r.h).toBeCloseTo(640);
  });
  it('clipRect 取子矩形後以中心放大', () => {
    const ref = { x: 100, y: 100, w: 200, h: 400 };
    const clip = { ref: 'door', rect: [0.25, 0, 0.5, 1] as [number, number, number, number] };
    expect(clipRect(clip, ref, 1)).toEqual({ x: 150, y: 100, w: 100, h: 400 });
    expect(clipRect(clip, ref, 2)).toEqual({ x: 100, y: -100, w: 200, h: 800 });
  });
});

describe('sortByLayer', () => {
  it('依 layer 升冪、同層保持原順序', () => {
    const out = sortByLayer([
      { id: 'a', layer: 2 },
      { id: 'b', layer: 0 },
      { id: 'c', layer: 2 },
      { id: 'd', layer: 1 },
    ]).map((e) => e.id);
    expect(out).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('PaperScene + sequence', () => {
  const vid = (id: string): ElementConfig => ({
    id,
    sprite: { src: `${id}.mp4`, kind: 'video', frames: 1, cellW: 10, cellH: 10 },
    frameMode: 'hold',
    holdFrame: 0,
    playback: { mode: 'trigger' },
    keyframes: [{ p: 0, x: 0.5, y: 0.5, opacity: 0 }],
  });
  const base: SceneConfig = {
    design: { w: 100, h: 100 },
    background: [{ p: 0, color: '#000' }],
    elements: [vid('a'), vid('b')],
  };

  it('沒有 sequence 時 opacity 完全照關鍵幀', () => {
    const s = new PaperScene(base, new Map());
    s.update({ progress: 0.9, scrollPx: 0, dtMs: 16, nowMs: 0 });
    expect(s.stateOf('a')?.opacity).toBe(0);
    expect(s.sequence.step).toBe(-1);
  });

  it('有 sequence 時覆寫 opacity；影片不存在視為播完，序列不會卡住', () => {
    const cfg: SceneConfig = { ...base, sequence: { steps: [{ trigger: 0.5, play: 'a', then: 'b' }], fade: 100 } };
    const s = new PaperScene(cfg, new Map());
    s.update({ progress: 0.6, scrollPx: 0, dtMs: 16, nowMs: 0 }); // 進區，playing
    expect(s.stateOf('a')?.opacity).toBe(1);
    s.update({ progress: 0.6, scrollPx: 0, dtMs: 16, nowMs: 16 }); // 無影片 → ended
    expect(s.sequence.phase).toBe('ended');
    s.update({ progress: 0.6, scrollPx: 0, dtMs: 16, nowMs: 216 }); // 淡化完成
    expect(s.stateOf('a')?.opacity).toBe(0);
    expect(s.stateOf('b')?.opacity).toBe(1);
  });
});
