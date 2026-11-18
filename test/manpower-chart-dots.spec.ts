// 04 各國消防員服務比：圓點版面（chartDots.ts）
import { describe, expect, it } from 'vitest';
import { barCount, buildLayout } from '../app/utils/04.manpower/chartDots';
import { COUNTRIES } from '../app/utils/04.manpower/staffing';

const layout = buildLayout({ w: 720, h: 720, wide: true, titleBottom: 90, introX: 360, introY: 400 });

/** stage 3 看得見的點，依長條（x 中心）分組 */
function visibleBars() {
  const s = layout.stages[3]!;
  const dots: { x: number; y: number }[] = [];
  for (let k = 0; k < layout.n; k++) if (s.r[k]! > 0.2 && s.a[k]! > 0.02) dots.push({ x: s.x[k]!, y: s.y[k]! });
  // 五國長條由左到右，用標籤中心 x 歸屬（每條寬遠小於間距）
  return COUNTRIES.map((c) => {
    const cx = layout.labelX[c.id][3]!;
    return { id: c.id, dots: dots.filter((d) => Math.abs(d.x - cx) < 40) };
  });
}

describe('barCount（長條四捨五入到整列）', () => {
  it.each([
    [724, 720],
    [766, 770],
    [926, 930],
    [933, 930],
    [1280, 1280],
  ])('%i → %i', (n, bar) => {
    expect(barCount(n)).toBe(bar);
  });
});

describe('stage 3 五國長條', () => {
  const bars = visibleBars();

  it.each(bars)('$id 的長條點數＝四捨五入後的整列', ({ id, dots }) => {
    const c = COUNTRIES.find((x) => x.id === id)!;
    expect(dots).toHaveLength(barCount(c.perFirefighter));
  });

  it.each(bars)('$id 的長條是矩形：每一列都是 10 點', ({ dots }) => {
    const rows = new Map<number, number>();
    for (const d of dots) rows.set(Math.round(d.y * 10), (rows.get(Math.round(d.y * 10)) ?? 0) + 1);
    for (const count of rows.values()) expect(count).toBe(10);
  });

  it('stage 1、2 的點數不變，補點只在 stage 3 出現', () => {
    const visible = (stage: number) => {
      const s = layout.stages[stage]!;
      let n = 0;
      for (let k = 0; k < layout.n; k++) if (s.r[k]! > 0.2 && s.a[k]! > 0.02) n++;
      return n;
    };
    // stage 1：日本 724，台灣的 724 顆白底疊在同一位置（stage 2 才滑開）
    expect(visible(1)).toBe(724 * 2);
    // stage 2：日本 724 + 台灣 1280
    expect(visible(2)).toBe(724 + 1280);
  });
});
