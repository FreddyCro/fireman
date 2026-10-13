import { describe, expect, it } from 'vitest';
import { coverTransform, fitCanvas, needsRelayout, type ViewportInfo } from '../app/utils/poc/paper-scroll/viewport';

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

describe('fitCanvas', () => {
  // node 沒有 canvas，用最小假物件；fitCanvas 只碰 width/height/style/getContext().setTransform
  const fakeCanvas = (w: number, h: number, cssW: string, cssH: string) => {
    const calls: number[][] = [];
    const c = {
      width: w,
      height: h,
      style: { width: cssW, height: cssH },
      getContext: () => ({ setTransform: (...a: number[]) => calls.push(a) }),
    };
    return { c: c as unknown as HTMLCanvasElement, calls };
  };

  it('尺寸完全沒變就不動', () => {
    const { c, calls } = fakeCanvas(780, 1688, '390px', '844px');
    expect(fitCanvas(c, base)).toBe(false);
    expect(calls).toEqual([]);
  });

  it('瀏覽器縮放：裝置像素數相同但 CSS 尺寸與 dpr 變了，仍要更新 style 與 transform', () => {
    // 100% → 150%：1920×1080@1 與 1280×720@1.5 的 canvas.width/height 都是 1920×1080
    const { c, calls } = fakeCanvas(1920, 1080, '1920px', '1080px');
    const zoomed: ViewportInfo = { width: 1280, stageHeight: 720, safeHeight: 720, dpr: 1.5 };
    expect(fitCanvas(c, zoomed)).toBe(true);
    expect(c.style.width).toBe('1280px');
    expect(c.style.height).toBe('720px');
    expect(calls).toEqual([[1.5, 0, 0, 1.5, 0, 0]]);
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
