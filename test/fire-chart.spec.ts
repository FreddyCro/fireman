// 02 重大火災 vs 殉職 pc 動畫：點數要和設計稿的數字一致
import { describe, expect, it } from 'vitest';
import { buildFireDots, DEATHS, FIRES, PERIODS, stateAt, YEARS } from '../app/utils/02.no-trapped/fireChart';

describe('fireChart', () => {
  const dots = buildFireDots();

  it('火災點：設計稿 1 有 35085 顆，減到設計稿 2 剩 14234 顆', () => {
    expect(dots.x.length).toBe(PERIODS[0].fires);
    expect(dots.removed).toBe(PERIODS[0].fires - PERIODS[1].fires);
    expect(dots.survivors).toBe(PERIODS[1].fires);
  });

  it('消失順序不重複、留到最後的那顆不會消失', () => {
    const shrink = [...dots.shrinkRank].filter((r) => r >= 0);
    expect(new Set(shrink).size).toBe(dots.removed);
    expect(dots.shrinkRank[dots.keep]).toBe(-1);
    expect(dots.collapseRank[dots.keep]).toBe(-1);
  });

  it('留到最後的那顆在剩下的點裡最左上', () => {
    let minY = Infinity;
    for (let i = 0; i < dots.x.length; i++) if (dots.shrinkRank[i]! < 0) minY = Math.min(minY, dots.y[i]!);
    expect(dots.y[dots.keep]).toBe(minY);
  });

  it('逐年資料：年份 23 根長條、折線 22 點；2015–2025 火災加總等於設計稿 2', () => {
    expect(DEATHS).toHaveLength(YEARS.length);
    expect(FIRES).toHaveLength(YEARS.length - 1);
    expect(FIRES.slice(11).reduce((a, b) => a + b)).toBe(PERIODS[1].fires);
    expect(DEATHS.slice(0, 11).reduce((a, b) => a + b)).toBe(PERIODS[0].deaths);
  });

  it('時間軸頭尾：起點是設計稿 1，終點圖表全長出來', () => {
    expect(stateAt(0)).toMatchObject({ shrink: 0, collapse: 0, align: 0, grow: 0, compareOpacity: 1 });
    expect(stateAt(1)).toMatchObject({ shrink: 1, collapse: 1, align: 1, grow: YEARS.length, chartOpacity: 1 });
  });
});
