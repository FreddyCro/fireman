import { describe, expect, it } from 'vitest';
import { coverTransform, needsRelayout, type ViewportInfo } from '../app/utils/paper-scroll/viewport';

const base: ViewportInfo = { width: 390, stageHeight: 844, safeHeight: 740, dpr: 2 };

describe('needsRelayout', () => {
  it('完全相同不重排', () => {
    expect(needsRelayout(base, { ...base }, true)).toBe(false);
  });
  it('寬度或 dpr 變一定重排', () => {
    expect(needsRelayout(base, { ...base, width: 844 }, true)).toBe(true);
    expect(needsRelayout(base, { ...base, dpr: 3 }, true)).toBe(true);
  });
  it('觸控裝置上只有高度變（網址列、鍵盤）忽略；桌機則重排', () => {
    const next = { ...base, stageHeight: 780, safeHeight: 700 };
    expect(needsRelayout(base, next, true)).toBe(false);
    expect(needsRelayout(base, next, false)).toBe(true);
  });
});

describe('coverTransform', () => {
  const design = { w: 1920, h: 1080 };
  it('同比例時 scale 1、無位移', () => {
    expect(coverTransform(design, { w: 1920, h: 1080 })).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });
  it('直式手機：以高度為準、水平置中（左右被裁）', () => {
    const t = coverTransform(design, { w: 390, h: 844 });
    expect(t.scale).toBeCloseTo(844 / 1080);
    expect(t.offsetY).toBeCloseTo(0);
    expect(t.offsetX).toBeCloseTo((390 - 1920 * (844 / 1080)) / 2);
  });
  it('超寬螢幕：以寬度為準、靠上對齊（底部被裁）', () => {
    const t = coverTransform(design, { w: 2560, h: 1080 });
    expect(t.scale).toBeCloseTo(2560 / 1920);
    expect(t.offsetX).toBeCloseTo(0); // 可能是 -0，不能用 toBe
    expect(t.offsetY).toBeCloseTo(0);
  });
});
