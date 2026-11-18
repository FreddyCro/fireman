// 邊緣遮罩：仿 Figma 樓梯圖（2486:540）畫在圖裡的暗角
import { describe, expect, it } from 'vitest';
import { STAIR_EDGE, edgeAlpha, edgeMaskAlpha, edgeRamp } from '../app/utils/paper-scroll/edge-mask';

describe('edgeRamp', () => {
  it('0 → 1、單調遞增、區間外夾住', () => {
    expect(edgeRamp(0)).toBe(0);
    expect(edgeRamp(1)).toBe(1);
    expect(edgeRamp(-1)).toBe(0);
    expect(edgeRamp(2)).toBe(1);
    for (let t = 0; t < 1; t += 0.05) expect(edgeRamp(t + 0.05)).toBeGreaterThanOrEqual(edgeRamp(t));
  });

  it('前段平、後段陡（樓梯圖淡出帶中點只有約三成亮）', () => {
    expect(edgeRamp(0.5)).toBeGreaterThan(0.3);
    expect(edgeRamp(0.5)).toBeLessThan(0.45);
  });
});

describe('edgeAlpha（樓梯比例）', () => {
  it('邊上全透明、淡出帶以內全不透明', () => {
    expect(edgeAlpha(0, 0.5, STAIR_EDGE)).toBe(0);
    expect(edgeAlpha(1, 0.5, STAIR_EDGE)).toBe(0);
    expect(edgeAlpha(0.5, 0, STAIR_EDGE)).toBe(0);
    expect(edgeAlpha(0.5, 1, STAIR_EDGE)).toBe(0);
    expect(edgeAlpha(0.5, 0.5, STAIR_EDGE)).toBe(1);
    expect(edgeAlpha(0.16, 0.12, STAIR_EDGE)).toBe(1);
    expect(edgeAlpha(0.84, 0.92, STAIR_EDGE)).toBe(1);
  });

  it('inset：內容框外透明，淡出帶從內容的邊開始', () => {
    const m = { bottom: 0.1, inset: { bottom: 0.2 } };
    expect(edgeAlpha(0.5, 0.85, m)).toBe(0); // 黑帶內
    expect(edgeAlpha(0.5, 0.8, m)).toBe(0); // 內容的邊
    expect(edgeAlpha(0.5, 0.7, m)).toBe(1); // 淡出帶（內容框高的 10% ＝ 整張 8%）以內
    expect(edgeAlpha(0.5, 0.76, m)).toBeGreaterThan(0);
    expect(edgeAlpha(0.5, 0.76, m)).toBeLessThan(1);
  });

  it('沒設的邊不淡出', () => {
    expect(edgeAlpha(0, 0.5, { right: 0.2 })).toBe(1);
  });
});

describe('edgeMaskAlpha', () => {
  const w = 200;
  const h = 100;

  it('無顆粒時左右對稱、中央 255、角落 0', () => {
    const a = edgeMaskAlpha(w, h, { ...STAIR_EDGE, grain: 0 });
    expect(a[50 * w + 100]).toBe(255);
    expect(a[0]).toBe(0);
    for (const x of [0, 5, 10, 20, 30]) expect(a[50 * w + x]).toBe(a[50 * w + (w - 1 - x)]);
  });

  it('顆粒只出現在淡出帶，且同尺寸結果固定', () => {
    const plain = edgeMaskAlpha(w, h, { ...STAIR_EDGE, grain: 0 });
    const grainy = edgeMaskAlpha(w, h, STAIR_EDGE);
    expect(edgeMaskAlpha(w, h, STAIR_EDGE)).toEqual(grainy);
    // 中央不受影響
    expect(grainy[50 * w + 100]).toBe(255);
    // 淡出帶裡有擾動
    let diff = 0;
    for (let x = 5; x < 30; x++) diff += Math.abs(grainy[50 * w + x]! - plain[50 * w + x]!);
    expect(diff).toBeGreaterThan(0);
  });
});
