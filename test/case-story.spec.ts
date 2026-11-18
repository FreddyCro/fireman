import { describe, expect, it } from 'vitest';
import { CASES as NO_TRAPPED } from '../app/utils/02.no-trapped/cases';
import { CASES as VIOLATION } from '../app/utils/03.violation/cases';
import { isMedia, stepAt } from '../app/utils/case-story';
import zhNoTrapped from '../app/locales/zh/section-no-trapped.json';
import zhViolation from '../app/locales/zh/section-violation.json';

describe('stepAt', () => {
  it('中線還沒到圖上緣（負進度）停在第一張', () => {
    expect(stepAt(-0.5, 3)).toBe(0);
  });

  it('依進度平均切成幾段', () => {
    expect(stepAt(0, 3)).toBe(0);
    expect(stepAt(0.34, 3)).toBe(1);
    expect(stepAt(0.67, 3)).toBe(2);
  });

  it('走過圖下緣停在最後一張', () => {
    expect(stepAt(1, 3)).toBe(2);
    expect(stepAt(2, 2)).toBe(1);
  });
});

describe('案例版面與文案對應', () => {
  const sections = [
    { name: 'no-trapped', cases: NO_TRAPPED, copy: zhNoTrapped.cases as Record<string, { items: Record<string, unknown> }> },
    { name: 'violation', cases: VIOLATION, copy: zhViolation.cases as Record<string, { items: Record<string, unknown> }> },
  ];

  for (const { name, cases, copy } of sections) {
    for (const c of cases) {
      it(`${name}/${c.id}：每個 item 在中文文案都有對應`, () => {
        const items = copy[c.id]?.items ?? {};
        expect(Object.keys(items).sort()).toEqual(c.items.map((it) => it.id).sort());
      });

      it(`${name}/${c.id}：至少一個會 active 的素材`, () => {
        expect(c.items.some(isMedia)).toBe(true);
      });
    }
  }
});
