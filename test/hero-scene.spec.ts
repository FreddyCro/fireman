// Hero「消防員之死」，原為 fire-story POC 的 C 版（paced）。設計見 architecture/archive/2026-10-22-fire-story-paced-design.md
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import str from '../app/locales/zh/section-hero.json';
import {
  HERO_FIRST_IMAGE,
  HERO_SCROLL,
  HERO_SEQUENCE,
  HERO_TEXT,
  HERO_TRACK_VH,
  exitPresence,
  heroScene,
  scrollT,
} from '../app/utils/01.hero/scene';
import type { Device } from '../app/utils/get-device';

const devices: Device[] = ['pc', 'pad', 'mob'];
/** 只有 C4 依載具不同，其餘測試用 mob 版即可 */
const scene = heroScene('mob');

/** p → vh，取到 0.001vh 免得浮點誤差讓 ≥ 比較失敗 */
const vh = (p: number) => Math.round(p * (HERO_TRACK_VH - 100) * 1000) / 1000;

const seq = HERO_SEQUENCE;
const [t1, t3] = seq.steps.map((s) => s.trigger) as [number, number];

/** 所有文字（淡入淡出＋向上滾動）在畫面上的區間 */
const textRanges: [string, number, number][] = [
  ...Object.entries(HERO_TEXT).map(([cue, r]) => [cue, r.in[0], r.out[1]] as [string, number, number]),
  ...Object.entries(HERO_SCROLL).map(([cue, [a, b]]) => [cue, a, b] as [string, number, number]),
];

describe('hero 場景設定', () => {
  it.each(scene.elements)('$id 的素材存在', (el) => {
    expect(existsSync(resolve(__dirname, '../public', `.${el.sprite.src}`))).toBe(true);
  });

  it('第一張窗戶圖是唯一的 priority 素材（先載完就開始畫），且就是 preload 的那張', () => {
    const first = scene.elements.filter((e) => e.sprite.priority);
    expect(first.map((e) => e.id)).toEqual(['1-1']);
    expect(first[0]!.sprite.src).toBe(HERO_FIRST_IMAGE);
  });

  it.each(scene.elements)('$id 的關鍵幀依 p 排序且在 0～1', (el) => {
    const ps = el.keyframes.map((k) => k.p);
    expect(ps).toEqual([...ps].sort((a, b) => a - b));
    ps.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
    ps.forEach((p) => expect(p).toBeLessThanOrEqual(1));
  });

  it('影片元素都有 playback，圖片沒有', () => {
    for (const el of scene.elements) expect(!!el.playback).toBe(el.sprite.kind === 'video');
  });

  // 設計師回饋（2026-10-19）：只有 2-1 保留滾動放大，其他原尺寸切換
  it('只有 2-1 有縮放', () => {
    for (const el of scene.elements) {
      const zooms = el.keyframes.some((k) => k.scale !== undefined && k.scale !== 1);
      expect(zooms, el.id).toBe(el.id === '2-1');
    }
  });
});

describe('hero 觸發點落在沒有文字的空檔', () => {
  const visibleAt = (p: number) => textRanges.filter(([, a, b]) => p > a && p < b).map(([cue]) => cue);

  it.each([
    ['T1', t1],
    ['T3', t3],
  ])('%s 時沒有文字在畫面上', (_n, t) => {
    expect(visibleAt(t)).toEqual([]);
  });

  it('說明文字（名單開頭）在 4-1 開始播後至少 80vh 才進場', () => {
    expect(vh(HERO_SCROLL.roll[0]) - vh(t1)).toBeGreaterThanOrEqual(80);
  });
});

describe('hero 區段比影片長', () => {
  it('區 0（4-1 → 4-2 → 名單）至少 360vh，參考紐時 6 秒影片配約 3.6 個畫面高', () => {
    expect(vh(t3) - vh(t1)).toBeGreaterThanOrEqual(360);
  });

  it('名單（說明文字 + 27 名 + 人名）結束於第二個觸發點', () => {
    expect(HERO_SCROLL.roll[1]).toBe(t3);
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
    const el = scene.elements.find((e) => e.id === '4-1')!;
    expect(el.keyframes.find((k) => k.opacity === 1)!.p).toBe(t1);
  });

  it('exitPresence 在退場區間頭尾是 1 → 0', () => {
    const [c, d] = HERO_TEXT.lesson.out;
    expect(exitPresence('lesson', c)).toBe(1);
    expect(exitPresence('lesson', d)).toBe(0);
  });
});

describe('hero 文案', () => {
  it('殉職名單筆數與「27名」一致', () => {
    expect(str.roll.names).toHaveLength(Number.parseInt(str.count[0]!));
  });
});

describe('hero 3-6v 捲動影片（設計師測試）', () => {
  const el = scene.elements.find((e) => e.id === '3-6v')!;

  it('綁捲動 scrub，播到最後一格就硬切消失（之後是黑底，再到第一個觸發點）', () => {
    expect(el.cover).toBe('stage');
    expect(el.playback?.mode).toBe('scroll');
    const range = el.playback!.mode === 'scroll' ? el.playback!.range : [0, 0];
    expect(vh(range[1]) - vh(range[0])).toBe(150);
    expect(el.keyframes.find((k) => k.p >= range[1] && k.opacity === 0)?.p).toBe(range[1]);
    expect(range[1]).toBeLessThan(t1);
  });

  it('3-6 靜態圖同樣 cover 舞台，在 3-6v 出現的同一點硬切消失', () => {
    const still = scene.elements.find((e) => e.id === '3-6')!;
    expect(still.cover).toBe('stage');
    const range = el.playback!.mode === 'scroll' ? el.playback!.range : [0, 0];
    const gone = still.keyframes.find((k) => k.p >= range[0] && k.opacity === 0);
    const shown = el.keyframes.find((k) => k.p === range[0]);
    expect(gone?.p).toBe(range[0]);
    expect(shown?.opacity).toBe(1);
  });

  it('scrub 區間內沒有文字', () => {
    const [a, b] = el.playback!.mode === 'scroll' ? el.playback!.range : [0, 0];
    for (const [cue, i, o] of textRanges) expect(o <= a || i >= b, cue).toBe(true);
  });
});

describe('hero 文字動態只有兩種（設計師回饋 FEEDBACK_1 hero-2）', () => {
  it('「然而最後…」在 3-6v 播完後、4-1 之前的黑底原地淡入淡出（此時沒有任何影片或圖片可見）', () => {
    const v36 = scene.elements.find((e) => e.id === '3-6v')!;
    const v1 = v36.playback!.mode === 'scroll' ? v36.playback!.range[1] : 0;
    const { in: [a], out: [, d] } = HERO_TEXT.lastWords;
    expect(a).toBeGreaterThanOrEqual(v1);
    expect(d).toBeLessThanOrEqual(t1);
    // 黑底：這段期間每個元素最後一個生效的 opacity 關鍵幀都是 0（4-1 之後的影片由序列控制，此時還沒觸發）
    for (const el of scene.elements) {
      const last = el.keyframes.filter((k) => k.opacity !== undefined && k.p <= a).at(-1);
      expect(last?.opacity ?? 0, el.id).toBe(0);
    }
  });

  it('向上滾動的文字之間不重疊', () => {
    const rs = Object.values(HERO_SCROLL).sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < rs.length; i++) expect(rs[i]![0]).toBeGreaterThanOrEqual(rs[i - 1]![1]);
  });

  it('scrollT 在區間頭尾是 0 → 1，區間外夾住', () => {
    const [a, b] = HERO_SCROLL.incident;
    expect(scrollT('incident', a)).toBe(0);
    expect(scrollT('incident', b)).toBe(1);
    expect(scrollT('incident', 0)).toBe(0);
    expect(scrollT('incident', 1)).toBe(1);
  });
});

describe('hero 標題影片（Pad／Mob 共用 pad 版）', () => {
  const files = {
    pc: { zh: '/img/hero/title_pc.mp4', en: '/img/hero/title_en_pc.mp4' },
    pad: { zh: '/img/hero/title_pad.mp4', en: '/img/hero/title_en_pad.mp4' },
    mob: { zh: '/img/hero/title_pad.mp4', en: '/img/hero/title_en_pad.mp4' },
  } as const;

  it.each(devices.flatMap((d) => (['zh', 'en'] as const).map((l) => [d, l] as const)))('%s／%s 用對的檔', (d, l) => {
    const el = heroScene(d, l).elements.find((e) => e.id === 'title')!;
    expect(el.sprite.src).toBe(files[d][l]);
    expect(existsSync(resolve(__dirname, '../public', `.${el.sprite.src}`))).toBe(true);
    // Mob「頂裝置寬」：放進設計畫布、寬度等於畫布寬；PC／Pad 蓋滿舞台
    expect(el.cover).toBe(d === 'mob' ? undefined : 'stage');
    if (d === 'mob') expect(el.sprite.cellW).toBe(1080);
  });

  it('淡入完成後綁捲動播放到原本標題退場結束，且等 4-3 播完才出現', () => {
    const el = scene.elements.find((e) => e.id === 'title')!;
    expect(el.afterSequence).toBe(true);
    expect(el.playback).toEqual({ mode: 'scroll', range: [HERO_TEXT.title.in[1], HERO_TEXT.title.out[1]] });
    expect(el.keyframes.find((k) => k.opacity === 1)!.p).toBe(HERO_TEXT.title.in[1]);
  });
});
