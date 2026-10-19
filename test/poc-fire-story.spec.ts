import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import str from '../app/locales/poc/fire-story.json';
import { FIRE_STORY_ROLL, FIRE_STORY_TEXT, fireStoryScene } from '../app/utils/poc/paper-scroll/scenes/fire-story';
import { scrubTime } from '../app/utils/poc/paper-scroll/video';
import { fitTransform, visibleDesignRect } from '../app/utils/poc/paper-scroll/viewport';

const design = { w: 1080, h: 1920 };

describe('fitTransform smart', () => {
  it('手機直式（裁得少）用 cover', () => {
    const stage = { w: 390, h: 844 };
    const t = fitTransform(design, stage, 'smart', { x: 0.5, y: 0.5 });
    expect(t.scale).toBeCloseTo(844 / 1920);
    expect(t.offsetY).toBeCloseTo(0);
    expect(t.offsetX).toBeLessThan(0);
  });

  it('桌機橫式（cover 會裁掉大半）改用 contain，置中直欄', () => {
    const stage = { w: 1440, h: 900 };
    const t = fitTransform(design, stage, 'smart', { x: 0.5, y: 0.5 });
    expect(t.scale).toBeCloseTo(900 / 1920);
    expect(t.offsetX).toBeCloseTo((1440 - 1080 * t.scale) / 2);
    const r = visibleDesignRect(t, design, stage);
    expect(r.h).toBeCloseTo(900);
    expect(r.w).toBeCloseTo(1080 * t.scale);
  });

  it('cover 時可見矩形就是整個舞台', () => {
    const stage = { w: 390, h: 844 };
    const t = fitTransform(design, stage, 'cover', { x: 0.5, y: 0.5 });
    expect(visibleDesignRect(t, design, stage)).toEqual({ x: 0, y: 0, w: 390, h: 844 });
  });
});

describe('scrubTime', () => {
  it('區間外夾住，且不 seek 到 duration', () => {
    expect(scrubTime([0.2, 0.4], 0, 3)).toBe(0);
    expect(scrubTime([0.2, 0.4], 0.3, 3)).toBeCloseTo((3 - 1 / 30) / 2);
    expect(scrubTime([0.2, 0.4], 1, 3)).toBeCloseTo(3 - 1 / 30);
  });
});

describe('fire-story 設定', () => {
  it.each(fireStoryScene.elements)('$id 的素材存在', (el) => {
    expect(existsSync(resolve(__dirname, '../public', `.${el.sprite.src}`))).toBe(true);
  });

  it.each(fireStoryScene.elements)('$id 的關鍵幀依 p 排序且在 0～1', (el) => {
    const ps = el.keyframes.map((k) => k.p);
    expect(ps).toEqual([...ps].sort((a, b) => a - b));
    ps.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
    ps.forEach((p) => expect(p).toBeLessThanOrEqual(1));
  });

  it('影片元素都有 playback，圖片沒有', () => {
    for (const el of fireStoryScene.elements) expect(!!el.playback).toBe(el.sprite.kind === 'video');
  });

  it('文字進出場區間合法', () => {
    for (const { in: [a, b], out: [c, d] } of Object.values(FIRE_STORY_TEXT)) {
      expect(a < b && b <= c && c < d).toBe(true);
    }
  });

  // 設計師回饋（2026-10-19）：只有 2-1 保留滾動放大，其他原尺寸切換
  it('只有 2-1 有縮放', () => {
    for (const el of fireStoryScene.elements) {
      const scales = el.keyframes.map((k) => k.scale).filter((s): s is number => s !== undefined);
      const zooms = scales.some((s) => s !== 1);
      expect(zooms, el.id).toBe(el.id === '2-1');
    }
  });

  it('3-1 字幕的進出場落在 3-1 可見區間內', () => {
    const el = fireStoryScene.elements.find((e) => e.id === '3-1')!;
    const show = el.keyframes.find((k) => k.opacity === 0)!.p;
    const hide = el.keyframes.filter((k) => k.opacity === 0).at(-1)!.p;
    const { in: [a], out: [, d] } = FIRE_STORY_TEXT.mask;
    expect(a).toBeGreaterThanOrEqual(show);
    expect(d).toBeLessThanOrEqual(hide);
  });

  it('名單捲動區間就是 4-2 可見區間', () => {
    const el = fireStoryScene.elements.find((e) => e.id === '4-2')!;
    const show = el.keyframes.find((k) => k.opacity === 0)!.p;
    const hide = el.keyframes.filter((k) => k.opacity === 0).at(-1)!.p;
    expect(FIRE_STORY_ROLL).toEqual([show, hide]);
  });
});

describe('fire-story 文案', () => {
  it('殉職名單佔位筆數與「27名」一致', () => {
    expect(str.roll.names).toHaveLength(Number.parseInt(str.count.number));
  });
});
