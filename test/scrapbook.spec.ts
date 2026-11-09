// scrapbook：02 / 03 兩個 section 的案例素材、版面與文案對應、放大框計算
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import enNoTrapped from '../app/locales/en/section-no-trapped.json';
import enViolation from '../app/locales/en/section-violation.json';
import zhNoTrapped from '../app/locales/zh/section-no-trapped.json';
import zhViolation from '../app/locales/zh/section-violation.json';
import { CASES as NO_TRAPPED } from '../app/utils/02.no-trapped/cases';
import { CASES as VIOLATION } from '../app/utils/03.violation/cases';
import { ZOOM_CLOSE_SPACE, ZOOM_EXTRA, ZOOM_MARGIN, zoomRect } from '../app/utils/scrapbook';

type CaseCopy = Record<string, { alt: Record<string, string> }>;

describe.each([
  ['02 no-trapped', NO_TRAPPED, zhNoTrapped.cases as CaseCopy, enNoTrapped.cases as CaseCopy],
  ['03 violation', VIOLATION, zhViolation.cases as CaseCopy, enViolation.cases as CaseCopy],
])('scrapbook 素材：%s', (_, cases, zh, en) => {
  it.each(cases.flatMap((c) => c.media))('$src 存在', (m) => {
    expect(existsSync(resolve(__dirname, '../public', `.${m.src}`))).toBe(true);
  });

  it.each([
    ['zh', zh],
    ['en', en],
  ] as const)('%s：每個案例都有文案，每個素材都有 alt', (_, copy) => {
    expect(Object.keys(copy).sort()).toEqual(cases.map((c) => c.id).sort());
    for (const c of cases) {
      expect(Object.keys(copy[c.id]!.alt).sort()).toEqual(c.media.map((m) => m.id).sort());
    }
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

  it('手機：撐滿裝置寬並置中視窗', () => {
    const mob = { w: 390, h: 844 };
    const r = zoomRect({ cx: 100, cy: 100, w: 200, h: 150 }, mob, false);
    expect(r.width).toBe(mob.w);
    expect(r.left).toBe(0);
    expect(r.top + r.height / 2).toBeCloseTo(mob.h / 2);
  });

  it('手機：太高時縮回，上下留出關閉鈕的位置', () => {
    const mob = { w: 390, h: 844 };
    const r = zoomRect({ cx: 100, cy: 100, w: 200, h: 600 }, mob, false);
    expect(r.top).toBeCloseTo(ZOOM_MARGIN + ZOOM_CLOSE_SPACE);
    expect(r.left + r.width / 2).toBeCloseTo(mob.w / 2);
    expect(r.width / r.height).toBeCloseTo(200 / 600);
  });
});
