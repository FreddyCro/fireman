// 02「超哥故事」捲動動畫。設計見 architecture/archive/2026-11-16-no-trapped-escape-design.md，轉場見 architecture/no-trapped-escape-transitions.md
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import zh from '../app/locales/zh/section-no-trapped.json';
import {
  ESCAPE_CUES,
  ESCAPE_TEXT,
  ESCAPE_TRACK_VH,
  escapeDeviceOf,
  escapeScene,
  type EscapeDevice,
} from '../app/utils/02.no-trapped/escape';
import { fitTransform } from '../app/utils/paper-scroll/viewport';

const devices: EscapeDevice[] = ['pc', 'pad', 'mob'];

describe.each(devices)('escape 場景（%s）', (d) => {
  const scene = escapeScene(d);

  // 設計師回饋（FEEDBACK_1 超哥-4）：邊緣遮罩參考樓梯；樓梯本身已有、白底逃跑段不套
  it('除了樓梯與白底逃跑段，每張圖都有邊緣遮罩', () => {
    const masked = scene.elements.filter((e) => e.edgeMask).map((e) => e.id);
    expect(masked).toEqual(['fire', 'feet', 'walk', 'door', 'burn']);
    for (const e of scene.elements) if (e.edgeMask) expect(e.cover).toBeUndefined();
  });

  // 設計師回饋（FEEDBACK_1 超哥-2）：圖片全部淡入淡出切換，規則見 architecture/no-trapped-escape-transitions.md
  it('「播一次」的段落逐格交叉淡化 24vh，輪播段維持硬切', () => {
    const vh = (p: number) => Math.round(p * (ESCAPE_TRACK_VH - 100));
    for (const e of scene.elements) {
      if (e.frameMode === 'scroll') expect(vh(e.crossfade ?? 0), e.id).toBe(24);
      else expect(e.crossfade, e.id).toBeUndefined();
    }
  });

  it('樓梯＋腳 → 走廊直接交叉淡化：樓梯與腳在走廊淡入完成的同一點才消失', () => {
    const walk = scene.elements.find((e) => e.id === 'walk')!;
    const full = walk.keyframes.find((k) => k.opacity === 1)!.p;
    const start = walk.keyframes.filter((k) => k.opacity === 0 && k.p < full).at(-1)!.p;
    for (const id of ['stair', 'feet']) {
      const el = scene.elements.find((e) => e.id === id)!;
      // 走廊淡入期間仍完整顯示，淡入完成時消失
      const before = el.keyframes.filter((k) => k.opacity !== undefined && k.p <= start).at(-1)!;
      expect(before.opacity, id).toBe(1);
      expect(el.keyframes.find((k) => k.p >= full && k.opacity === 0)?.p, id).toBe(full);
    }
  });

  it('逃跑 6-1 淡入（不硬切）', () => {
    const run = scene.elements.find((e) => e.id === 'run')!;
    const zeroAt = run.keyframes.filter((k) => k.opacity === 0)[1]!.p;
    const oneAt = run.keyframes.find((k) => k.opacity === 1)!.p;
    expect(oneAt - zeroAt).toBeGreaterThan(0.001);
  });

  // 設計師回饋（FEEDBACK_1 超哥-3）：最後兩個人不用 zoom，直接切黑底
  it('6-2（兩個人）播完的同一點背景硬切成黑，沒有 6-3 放大特寫', () => {
    expect(scene.elements.some((e) => e.sprite.srcs?.some((s) => s.includes('story6-3')))).toBe(false);
    const run = scene.elements.find((e) => e.id === 'run')!;
    for (const k of run.keyframes) if (k.scale !== undefined) expect(k.scale).toBe(1);
    const gone = run.keyframes.filter((k) => k.opacity === 0).at(-1)!.p;
    const black = scene.background!.find((b) => b.p >= gone && b.color === '#000000');
    expect(black?.p).toBe(gone);
  });

  // 設計師回饋（FEEDBACK_1 超哥-5）：交件檔名的第 2、3 張順序反了
  // 設計師回饋（FEEDBACK_1 超哥-6）：最後的火 pin 住原地淡出到黑，再往下走
  it('工廠大火在捲動結束前淡到 0，字幕跟著淡出', () => {
    const burn = scene.elements.find((e) => e.id === 'burn')!;
    const ks = burn.keyframes.filter((k) => k.opacity !== undefined);
    const last = ks.at(-1)!;
    expect(last.opacity).toBe(0);
    expect(last.p).toBeLessThan(1);
    expect(last.p).toBeGreaterThan(0.9);
    // 淡出是漸變（不是硬切）
    const prev = ks.at(-2)!;
    expect(prev.opacity).toBe(1);
    expect(last.p - prev.p).toBeGreaterThan(0.01);
    // 字幕的退場區間＝火的淡出區間
    expect(ESCAPE_TEXT.burn.out).toEqual([prev.p, last.p]);
  });

  it('腳踩水依 3-1 → 3-3 → 3-2 播放', () => {
    const feet = scene.elements.find((e) => e.id === 'feet')!;
    expect(feet.sprite.srcs!.map((s) => s.match(/story3-(\d)/)![1])).toEqual(['1', '3', '2']);
  });

  it.each(scene.elements)('$id 的每一格素材都存在、格數一致', (el) => {
    const srcs = el.sprite.srcs!;
    expect(srcs.length).toBe(el.sprite.frames);
    for (const src of srcs) expect(existsSync(resolve(__dirname, '../public', `.${src}`)), src).toBe(true);
  });

  it.each(scene.elements)('$id 的關鍵幀依 p 排序且在 0～1', (el) => {
    const ps = el.keyframes.map((k) => k.p);
    expect(ps).toEqual([...ps].sort((a, b) => a - b));
    ps.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
    ps.forEach((p) => expect(p).toBeLessThanOrEqual(1));
  });

  it('快取 key 不重複', () => {
    const keys = scene.elements.map((e) => e.sprite.src);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('escape 字幕', () => {
  it('每個 cue 都有中文字幕', () => {
    for (const c of ESCAPE_CUES) expect(zh.escape[c], c).toBeTruthy();
  });

  it('字幕依序出現、不重疊', () => {
    for (let i = 1; i < ESCAPE_CUES.length; i++) {
      const prev = ESCAPE_TEXT[ESCAPE_CUES[i - 1]!];
      const cur = ESCAPE_TEXT[ESCAPE_CUES[i]!];
      expect(cur.in[0]).toBeGreaterThanOrEqual(prev.out[1]);
    }
  });
});

describe('escape 載具與縮放', () => {
  it('依斷點選場景', () => {
    expect(escapeDeviceOf(390)).toBe('mob');
    expect(escapeDeviceOf(768)).toBe('pad');
    expect(escapeDeviceOf(1280)).toBe('pc');
  });

  it('PC 大螢幕不放大插畫（maxScale 1），兩側露出背景', () => {
    const { design, fit, anchor, maxCrop, maxScale } = escapeScene('pc');
    const t = fitTransform(design, { w: 1920, h: 1080 }, fit, anchor, maxCrop, maxScale);
    expect(t.scale).toBe(1);
    expect(t.offsetX).toBe((1920 - 1280) / 2);
  });
});
