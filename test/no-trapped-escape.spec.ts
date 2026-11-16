// 02「超哥故事」捲動動畫。設計見 architecture/2026-11-16-no-trapped-escape-design.md
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import zh from '../app/locales/zh/section-no-trapped.json';
import {
  ESCAPE_CUES,
  ESCAPE_TEXT,
  escapeDeviceOf,
  escapeScene,
  type EscapeDevice,
} from '../app/utils/02.no-trapped/escape';
import { fitTransform } from '../app/utils/paper-scroll/viewport';

const devices: EscapeDevice[] = ['pc', 'pad', 'mob'];

describe.each(devices)('escape 場景（%s）', (d) => {
  const scene = escapeScene(d);

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
