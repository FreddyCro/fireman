// Hero「消防員之死」（來自 POC C 版 /poc/fire-story-paced）。設計見 architecture/2026-10-22-fire-story-paced-design.md
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import str from '../app/locales/section-hero.json';
import { HERO_ROLL, HERO_TEXT, HERO_TRACK_VH, exitPresence, heroScene } from '../app/utils/01.hero/scene';

/** p → vh，取到 0.001vh 免得浮點誤差讓 ≥ 比較失敗 */
const vh = (p: number) => Math.round(p * (HERO_TRACK_VH - 100) * 1000) / 1000;

const seq = heroScene.sequence!;
const [t1, t3] = seq.steps.map((s) => s.trigger) as [number, number];

describe('hero 場景設定', () => {
  it.each(heroScene.elements)('$id 的素材存在', (el) => {
    expect(existsSync(resolve(__dirname, '../public', `.${el.sprite.src}`))).toBe(true);
  });

  it.each(heroScene.elements)('$id 的關鍵幀依 p 排序且在 0～1', (el) => {
    const ps = el.keyframes.map((k) => k.p);
    expect(ps).toEqual([...ps].sort((a, b) => a - b));
    ps.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
    ps.forEach((p) => expect(p).toBeLessThanOrEqual(1));
  });

  it('影片元素都有 playback，圖片沒有', () => {
    for (const el of heroScene.elements) expect(!!el.playback).toBe(el.sprite.kind === 'video');
  });

  // 設計師回饋（2026-10-19）：只有 2-1 保留滾動放大，其他原尺寸切換
  it('只有 2-1 有縮放', () => {
    for (const el of heroScene.elements) {
      const zooms = el.keyframes.some((k) => k.scale !== undefined && k.scale !== 1);
      expect(zooms, el.id).toBe(el.id === '2-1');
    }
  });
});

describe('hero 觸發點落在沒有文字的空檔', () => {
  const visibleAt = (p: number) =>
    Object.entries(HERO_TEXT).filter(([, { in: [a], out: [, d] }]) => p > a && p < d).map(([cue]) => cue);

  it.each([
    ['T1', t1],
    ['T3', t3],
  ])('%s 時沒有文字在畫面上', (_n, t) => {
    expect(visibleAt(t)).toEqual([]);
    expect(t > HERO_ROLL[0] && t < HERO_ROLL[1]).toBe(false);
  });

  it('說明文字在 4-1 開始播後至少 80vh 才進場', () => {
    expect(vh(HERO_TEXT.victim.in[0]) - vh(t1)).toBeGreaterThanOrEqual(80);
  });
});

describe('hero 區段比影片長', () => {
  it('區 0（4-1 → 4-2 → 名單）至少 360vh，參考紐時 6 秒影片配約 3.6 個畫面高', () => {
    expect(vh(t3) - vh(t1)).toBeGreaterThanOrEqual(360);
  });

  it('名單在說明文字退場後才開始，結束於第二個觸發點', () => {
    expect(HERO_ROLL[0]).toBeGreaterThanOrEqual(HERO_TEXT.victim.out[1]);
    expect(HERO_ROLL[1]).toBe(t3);
  });

  it('4-3 觸發後至少 200vh 教訓文字才開始退場（4-3 播 3 秒 + 原地淡入 + 閱讀）', () => {
    expect(vh(HERO_TEXT.lesson.out[0]) - vh(t3)).toBeGreaterThanOrEqual(200);
  });

  it('標題在跑道結束前退場完畢', () => {
    expect(HERO_TEXT.title.out[1]).toBeLessThanOrEqual(1);
  });
});

describe('hero 序列', () => {
  it('影片之間硬切：4-1 播完接 4-2，再觸發 4-3', () => {
    expect(seq.fade).toBe(0);
    expect(seq.steps.map(({ play, then }) => ({ play, then }))).toEqual([
      { play: '4-1', then: '4-2' },
      { play: '4-3', then: undefined },
    ]);
  });

  it('4-1 淡入完成處就是第一個觸發點', () => {
    const el = heroScene.elements.find((e) => e.id === '4-1')!;
    expect(el.keyframes.find((k) => k.opacity === 1)!.p).toBe(t1);
  });

  it('exitPresence 在退場區間頭尾是 1 → 0', () => {
    const [c, d] = HERO_TEXT.lesson.out;
    expect(exitPresence('lesson', c)).toBe(1);
    expect(exitPresence('lesson', d)).toBe(0);
  });
});

describe('hero 文案', () => {
  it('殉職名單佔位筆數與「27名」一致', () => {
    expect(str.roll.names).toHaveLength(Number.parseInt(str.count.number));
  });
});

describe('hero 3-6v 捲動影片（設計師測試）', () => {
  const el = heroScene.elements.find((e) => e.id === '3-6v')!;

  it('綁捲動 scrub，播到最後一格就是第一個觸發點（硬切 4-1）', () => {
    expect(el.cover).toBe('stage');
    expect(el.playback?.mode).toBe('scroll');
    const range = el.playback!.mode === 'scroll' ? el.playback!.range : [0, 0];
    expect(range[1]).toBe(t1);
    expect(vh(range[1]) - vh(range[0])).toBe(400);
  });

  it('scrub 區間內沒有文字', () => {
    const [a, b] = el.playback!.mode === 'scroll' ? el.playback!.range : [0, 0];
    for (const { in: [i], out: [, o] } of Object.values(HERO_TEXT)) expect(o <= a || i >= b).toBe(true);
  });
});
