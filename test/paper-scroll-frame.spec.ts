import { describe, expect, it } from 'vitest';
import { advanceTime, loopIndex, scrollBlend, scrollTargetRaw, stepToward } from '../app/utils/paper-scroll/frame';

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

describe('scrollBlend（逐格交叉淡化）', () => {
  // 區間 0～0.3、3 格 → 每格 0.1，交界在 0.1、0.2；淡化 0.04 → 交界前後各 0.02
  const range: [number, number] = [0, 0.3];

  it('交界以外單格完整顯示，格數與 scrollTargetRaw 一致', () => {
    for (const p of [0, 0.05, 0.079, 0.121, 0.15, 0.179, 0.221, 0.3]) {
      const b = scrollBlend(p, range, 3, 0.04);
      expect(b.mix, String(p)).toBe(0);
      expect(b.frame).toBe(scrollTargetRaw({ progress: p, scrollPx: 0, frames: 3, range }));
    }
  });

  it('交界處前一格淡出、下一格淡入，正中間各半', () => {
    const mid = scrollBlend(0.2, range, 3, 0.04);
    expect(mid).toMatchObject({ frame: 1, next: 2 });
    expect(mid.mix).toBeCloseTo(0.5);
    const early = scrollBlend(0.09, range, 3, 0.04);
    expect(early).toMatchObject({ frame: 0, next: 1 });
    expect(early.mix).toBeGreaterThan(0);
    expect(early.mix).toBeLessThan(0.5);
  });

  it('區間外夾住在頭尾那格；fade 0 等於硬切', () => {
    expect(scrollBlend(-1, range, 3, 0.04)).toEqual({ frame: 0, next: 0, mix: 0 });
    expect(scrollBlend(2, range, 3, 0.04)).toEqual({ frame: 2, next: 2, mix: 0 });
    expect(scrollBlend(0.1, range, 3, 0).mix).toBe(0);
  });

  it('單格不淡化', () => {
    expect(scrollBlend(0.5, [0, 1], 1, 0.1)).toEqual({ frame: 0, next: 0, mix: 0 });
  });
});
