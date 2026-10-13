import { describe, expect, it } from 'vitest';
import { advanceTime, loopIndex, scrollTargetRaw, stepToward } from '../app/utils/poc/paper-scroll/frame';

describe('loopIndex', () => {
  it('repeat 取餘數，負數也要正確', () => {
    expect(loopIndex(5, 4, 'repeat')).toBe(1);
    expect(loopIndex(-1, 4, 'repeat')).toBe(3);
  });
  it('pingpong 來回：0 1 2 3 2 1 0', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((r) => loopIndex(r, 4, 'pingpong'))).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });
  it('clamp 停在兩端', () => {
    expect(loopIndex(9, 4, 'clamp')).toBe(3);
    expect(loopIndex(-2, 4, 'clamp')).toBe(0);
  });
  it('只有一格永遠是 0', () => {
    expect(loopIndex(7, 1, 'repeat')).toBe(0);
    expect(loopIndex(7, 1, 'pingpong')).toBe(0);
  });
});

describe('advanceTime', () => {
  it('依 dt 與 fps 累加格數（fps 中途改變不會跳格）', () => {
    let acc = advanceTime(0, 100, 10); // 0.1s × 10fps = 1 格
    expect(acc).toBeCloseTo(1);
    acc = advanceTime(acc, 100, 4); // 再 0.1s × 4fps = 0.4 格
    expect(acc).toBeCloseTo(1.4);
  });
});

describe('scrollTargetRaw', () => {
  it('pxPerFrame：每捲 N px 一格，無上限、可為負', () => {
    expect(scrollTargetRaw({ progress: 0, scrollPx: 125, frames: 4, pxPerFrame: 60 })).toBe(2);
    expect(scrollTargetRaw({ progress: 0, scrollPx: -10, frames: 4, pxPerFrame: 60 })).toBe(-1);
  });
  it('range：進度區間平均分給各格，兩端夾住', () => {
    const o = { scrollPx: 0, frames: 5, range: [0.2, 0.35] as [number, number] };
    expect(scrollTargetRaw({ ...o, progress: 0.1 })).toBe(0);
    expect(scrollTargetRaw({ ...o, progress: 0.275 })).toBe(2);
    expect(scrollTargetRaw({ ...o, progress: 0.35 })).toBe(4);
    expect(scrollTargetRaw({ ...o, progress: 0.9 })).toBe(4);
  });
  it('兩者都沒給時用預設 60px', () => {
    expect(scrollTargetRaw({ progress: 0, scrollPx: 120, frames: 4 })).toBe(2);
  });
});

describe('stepToward', () => {
  it('每 tick 最多走 maxStep 格，正反向都適用', () => {
    expect(stepToward(0, 5, 1)).toBe(1);
    expect(stepToward(5, 0, 1)).toBe(4);
    expect(stepToward(0, 1, 1)).toBe(1);
  });
  it('maxStep 為 0 表示不限制', () => {
    expect(stepToward(0, 5, 0)).toBe(5);
  });
});
