// 02 無人受困的火場：scrapbook 素材與放大框計算
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import str from '../app/locales/section-no-trapped.json';
import { ZOOM_EXTRA, ZOOM_MARGIN, zoomRect } from '../app/utils/02.no-trapped/scrapbook';

const media = str.cases.flatMap((c) => c.media);

describe('scrapbook 素材', () => {
  it.each(media)('$src 存在', (m) => {
    expect(existsSync(resolve(__dirname, '../public', `.${m.src}`))).toBe(true);
  });
});

describe('zoomRect', () => {
  const vp = { w: 1440, h: 900 };

  it('寬螢幕：寬度加 ZOOM_EXTRA、等比放大、以原圖中心為中心', () => {
    const r = zoomRect({ cx: 500, cy: 400, w: 300, h: 200 }, vp, true);
    expect(r.width).toBe(300 + ZOOM_EXTRA);
    expect(r.height).toBeCloseTo(200 * (400 / 300));
    expect(r.left + r.width / 2).toBeCloseTo(500);
    expect(r.top + r.height / 2).toBeCloseTo(400);
  });

  it('寬螢幕：超出視窗時推回邊界內', () => {
    const r = zoomRect({ cx: 1400, cy: 880, w: 300, h: 200 }, vp, true);
    expect(r.left + r.width).toBeCloseTo(vp.w - ZOOM_MARGIN);
    expect(r.top + r.height).toBeCloseTo(vp.h - ZOOM_MARGIN);
  });

  it('寬螢幕：太高時改以視窗高度為上限', () => {
    const r = zoomRect({ cx: 700, cy: 450, w: 300, h: 1000 }, vp, true);
    expect(r.height).toBeCloseTo(vp.h - ZOOM_MARGIN * 2);
    expect(r.width / r.height).toBeCloseTo(300 / 1000);
  });

  it('手機：滿版寬（扣邊距）並置中視窗', () => {
    const mob = { w: 390, h: 844 };
    const r = zoomRect({ cx: 100, cy: 100, w: 200, h: 150 }, mob, false);
    expect(r.width).toBe(mob.w - ZOOM_MARGIN * 2);
    expect(r.left).toBe(ZOOM_MARGIN);
    expect(r.top + r.height / 2).toBeCloseTo(mob.h / 2);
  });
});
