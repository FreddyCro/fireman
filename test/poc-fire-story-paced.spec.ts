// C 版（/poc/fire-story-paced）：B 版的觸發播放 + 紐時式節奏（觸發點沒有文字、區段比影片長）。
// 設計見 architecture/2026-10-22-fire-story-paced-design.md
import { describe, expect, it } from 'vitest';
import {
  FIRE_STORY_TEXT,
  FIRE_STORY_TRACK_VH,
  exitPresence,
  fireStoryAutoScene,
  fireStoryPacedScene,
  fireStoryRoll,
  fireStoryText,
} from '../app/utils/poc/paper-scroll/scenes/fire-story';

/** 捲動距離（vh）= 跑道 − 一個畫面 */
const dist = (trackVh: number) => trackVh - 100;
const baseDist = dist(FIRE_STORY_TRACK_VH.trigger);
const pacedDist = dist(FIRE_STORY_TRACK_VH.paced);
/** p → vh，取到 0.001vh 免得浮點誤差讓 ≥ 比較失敗 */
const vh = (p: number) => Math.round(p * pacedDist * 1000) / 1000;

const seq = fireStoryPacedScene.sequence!;
const [t1, t3] = seq.steps.map((s) => s.trigger) as [number, number];
const text = fireStoryText('paced');
const roll = fireStoryRoll('paced');

describe('C 版：C1～C3 的捲動距離與 B 版相同', () => {
  const c1c3 = (scene: typeof fireStoryPacedScene) => scene.elements.filter((e) => !e.id.startsWith('4-'));

  it('跑道比 B 版長', () => {
    expect(FIRE_STORY_TRACK_VH.paced).toBeGreaterThan(FIRE_STORY_TRACK_VH.trigger);
  });

  it('每張幻燈片的關鍵幀換算成 vh 與 B 版一致', () => {
    const base = c1c3(fireStoryAutoScene);
    const paced = c1c3(fireStoryPacedScene);
    expect(paced.map((e) => e.id)).toEqual(base.map((e) => e.id));
    paced.forEach((el, i) => {
      el.keyframes.forEach((k, j) => {
        expect(k.p * pacedDist, `${el.id}#${j}`).toBeCloseTo(base[i]!.keyframes[j]!.p * baseDist, 6);
      });
    });
  });

  it('C1～C3 的文字換算成 vh 與 B 版一致', () => {
    for (const cue of ['incident', 'mask', 'lastWords'] as const) {
      for (const edge of ['in', 'out'] as const) {
        text[cue][edge].forEach((p, i) => expect(p * pacedDist, cue).toBeCloseTo(FIRE_STORY_TEXT[cue][edge][i]! * baseDist, 6));
      }
    }
  });

  it('第一個觸發點換算成 vh 與 B 版一致（4-1 淡入完成處）', () => {
    expect(vh(t1)).toBeCloseTo(fireStoryAutoScene.sequence!.steps[0]!.trigger * baseDist, 6);
  });
});

describe('C 版：觸發點落在沒有文字的空檔', () => {
  const visibleAt = (p: number) =>
    Object.entries(text).filter(([, { in: [a], out: [, d] }]) => p > a && p < d).map(([cue]) => cue);

  it.each([
    ['T1', t1],
    ['T3', t3],
  ])('%s 時沒有文字在畫面上', (_n, t) => {
    expect(visibleAt(t)).toEqual([]);
    expect(t > roll[0] && t < roll[1]).toBe(false);
  });

  it('說明文字在 4-1 開始播後至少 80vh 才進場', () => {
    expect(vh(text.victim.in[0]) - vh(t1)).toBeGreaterThanOrEqual(80);
  });
});

describe('C 版：區段比影片長', () => {
  it('區 0（4-1 → 4-2 → 名單）至少 360vh，參考紐時 6 秒影片配約 3.6 個畫面高', () => {
    expect(vh(t3) - vh(t1)).toBeGreaterThanOrEqual(360);
  });

  it('名單在說明文字退場後才開始，結束於第二個觸發點', () => {
    expect(roll[0]).toBeGreaterThanOrEqual(text.victim.out[1]);
    expect(roll[1]).toBe(t3);
  });

  it('4-3 觸發後至少 200vh 教訓文字才開始退場（4-3 播 3 秒 + 原地淡入 + 閱讀）', () => {
    expect(vh(text.lesson.out[0]) - vh(t3)).toBeGreaterThanOrEqual(200);
  });

  it('標題在跑道結束前退場完畢', () => {
    expect(text.title.out[1]).toBeLessThanOrEqual(1);
  });
});

describe('C 版：沿用 B 版的序列', () => {
  it('影片之間硬切、steps 結構相同', () => {
    expect(seq.fade).toBe(0);
    expect(seq.steps.map(({ play, then }) => ({ play, then }))).toEqual(
      fireStoryAutoScene.sequence!.steps.map(({ play, then }) => ({ play, then })),
    );
  });

  it('4-1 淡入完成處就是第一個觸發點', () => {
    const el = fireStoryPacedScene.elements.find((e) => e.id === '4-1')!;
    expect(el.keyframes.find((k) => k.opacity === 1)!.p).toBe(t1);
  });

  it('exitPresence 用 C 版自己的文字區間', () => {
    const [c, d] = text.lesson.out;
    expect(exitPresence('lesson', c, text)).toBe(1);
    expect(exitPresence('lesson', d, text)).toBe(0);
  });
});
