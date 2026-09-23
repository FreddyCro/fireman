import { describe, expect, it } from 'vitest';
import { sampleColor, sampleNumber, sampleStep } from '../app/utils/poc/paper-scroll/keyframes';
import type { Keyframe } from '../app/utils/poc/paper-scroll/types';

describe('sampleNumber', () => {
  it('線性插值', () => {
    const k: Keyframe[] = [{ p: 0, x: 0 }, { p: 1, x: 1 }];
    expect(sampleNumber(k, 'x', 0.25, 9)).toBeCloseTo(0.25);
  });

  it('第一幀之前取第一幀、最後一幀之後取最後一幀', () => {
    const k: Keyframe[] = [{ p: 0.2, x: 2 }, { p: 0.6, x: 6 }];
    expect(sampleNumber(k, 'x', 0, 9)).toBe(2);
    expect(sampleNumber(k, 'x', 1, 9)).toBe(6);
  });

  it('各屬性獨立取樣：缺某屬性的幀不影響該屬性', () => {
    const k: Keyframe[] = [{ p: 0, x: 0, y: 0 }, { p: 0.5, x: 1 }, { p: 1, y: 1 }];
    expect(sampleNumber(k, 'x', 0.75, 9)).toBe(1);
    expect(sampleNumber(k, 'y', 0.75, 9)).toBeCloseTo(0.75);
  });

  it('用後一幀的 ease', () => {
    const k: Keyframe[] = [{ p: 0, x: 0 }, { p: 1, x: 1, ease: 'in' }];
    expect(sampleNumber(k, 'x', 0.5, 9)).toBeCloseTo(0.25);
  });

  it('沒有任何幀定義該屬性時回傳 fallback', () => {
    expect(sampleNumber([{ p: 0, x: 1 }], 'y', 0.5, 7)).toBe(7);
  });
});

describe('sampleStep', () => {
  const k: Keyframe[] = [{ p: 0, layer: 2 }, { p: 0.31, layer: 0 }];
  it('取最後一個 p <= 進度 的值', () => {
    expect(sampleStep(k, 'layer', 0.3, 9)).toBe(2);
    expect(sampleStep(k, 'layer', 0.31, 9)).toBe(0);
    expect(sampleStep(k, 'layer', 0.9, 9)).toBe(0);
  });
  it('第一幀之前取第一幀；沒定義回 fallback', () => {
    expect(sampleStep([{ p: 0.5, layer: 3 }], 'layer', 0.1, 9)).toBe(3);
    expect(sampleStep([{ p: 0.5, x: 1 }], 'layer', 0.1, 9)).toBe(9);
  });
});

describe('sampleColor', () => {
  it('RGB 線性插值並輸出 hex', () => {
    const stops = [{ p: 0, color: '#000000' }, { p: 1, color: '#ffffff' }];
    expect(sampleColor(stops, 0.5)).toBe('#808080');
    expect(sampleColor(stops, -1)).toBe('#000000');
    expect(sampleColor(stops, 2)).toBe('#ffffff');
  });
});
