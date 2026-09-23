import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOOR_OPENING, doorFireScene } from '../app/utils/poc/paper-scroll/scenes/door-fire';
// 產生器只在直接執行時寫檔，import 不會有副作用
import { DOOR_OPENING_FRACTIONS } from '../scripts/poc/generate-sprites.mjs';

// 設計師交的素材格數／尺寸若與設定不符，畫面只會錯位，不會有錯誤訊號，所以在這裡對帳。
const sprites = new Map(doorFireScene.elements.map((e) => [e.sprite.src, e.sprite]));

describe('public/poc/paper-scroll 素材與 door-fire 設定一致', () => {
  it.each([...sprites.values()])('$src 的格數與 viewBox 相符', (sprite) => {
    const svg = readFileSync(resolve(__dirname, '../public', `.${sprite.src}`), 'utf8');
    const cells = svg.match(/<g class="cell"/g)?.length ?? 0;
    expect(cells).toBe(sprite.frames);
    expect(svg).toContain(`viewBox="0 0 ${sprite.cellW * sprite.frames} ${sprite.cellH}"`);
  });

  it('門開口比例與產生器一致', () => {
    DOOR_OPENING.forEach((v, i) => expect(v).toBeCloseTo(DOOR_OPENING_FRACTIONS[i], 3));
  });
});

describe('door-fire 關鍵幀合法', () => {
  it.each(doorFireScene.elements)('$id 的關鍵幀依 p 排序且在 0～1', (el) => {
    const ps = el.keyframes.map((k) => k.p);
    expect(ps).toEqual([...ps].sort((a, b) => a - b));
    ps.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
    ps.forEach((p) => expect(p).toBeLessThanOrEqual(1));
  });
  it('clip.ref 都指向存在的元素', () => {
    const ids = new Set(doorFireScene.elements.map((e) => e.id));
    for (const el of doorFireScene.elements) if (el.clip) expect(ids.has(el.clip.ref)).toBe(true);
  });
});
