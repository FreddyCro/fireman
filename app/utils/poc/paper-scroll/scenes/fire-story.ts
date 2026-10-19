// 「消防員之死」分鏡：C1～C3 是整張不透明的直式插畫，以幻燈片交叉淡化 + zoom 串接；
// C4 是動畫師交的影片（4-1、4-3 跟著捲動 scrub，4-2 loop）。文字在頁面的 DOM overlay。
// 分鏡進度見 architecture/2026-10-19-fire-story-design.md。
import type { ElementConfig, Keyframe, PlaybackConfig, SceneConfig, SpriteConfig } from '../types';

const DIR = '/poc/fire-story';
const W = 1080;
const H = 1920;
const CENTER: [number, number] = [0.5, 0.5];

const image = (name: string): SpriteConfig => ({ src: `${DIR}/${name}.webp`, frames: 1, cellW: W, cellH: H, anchor: CENTER });
const video = (name: string): SpriteConfig => ({
  src: `${DIR}/${name}.mp4`,
  kind: 'video',
  frames: 1,
  cellW: W,
  cellH: H,
  anchor: CENTER,
});

interface SlideOpts {
  /** 淡入區間；沒有就是一開始就在 */
  fadeIn?: [number, number];
  /** 下一張完全蓋住後就不畫（opacity 0），省繪製 */
  hideAt?: number;
  /** zoom：[p, scale] 依序 */
  zoom?: [number, number][];
  layer: number;
  playback?: PlaybackConfig;
}

/** 一張滿版的幻燈片：疊在上一張上面淡入，被下一張蓋滿後隱藏 */
function slide(id: string, sprite: SpriteConfig, o: SlideOpts): ElementConfig {
  const kfs: Keyframe[] = [];
  const push = (k: Keyframe) => {
    const same = kfs.find((x) => x.p === k.p);
    if (same) Object.assign(same, k);
    else kfs.push(k);
  };
  if (o.fadeIn) {
    push({ p: o.fadeIn[0], opacity: 0 });
    push({ p: o.fadeIn[1], opacity: 1, ease: 'inOut' });
  } else push({ p: 0, opacity: 1 });
  if (o.hideAt !== undefined) {
    push({ p: o.hideAt - 0.0001, opacity: 1 });
    push({ p: o.hideAt, opacity: 0 });
  }
  for (const [p, scale] of o.zoom ?? []) push({ p, scale, ease: 'inOut' });
  kfs.sort((a, b) => a.p - b.p);
  kfs[0] = { ...kfs[0]!, x: 0.5, y: 0.5, layer: o.layer };
  return { id, sprite, frameMode: 'hold', holdFrame: 0, playback: o.playback, keyframes: kfs };
}

/** 文字 overlay 的進出場（頁面用），與上面的幻燈片同一條進度軸 */
export const FIRE_STORY_TEXT = {
  incident: { in: [0.105, 0.125], out: [0.175, 0.19] },
  lastWords: { in: [0.6, 0.62], out: [0.665, 0.68] },
  victim: { in: [0.755, 0.77], out: [0.8, 0.81] },
  count: { in: [0.825, 0.835], out: [0.855, 0.865] },
  lesson: { in: [0.915, 0.93], out: [0.945, 0.955] },
  /** 標題：out 段是粉末化消失（佔位效果，等動畫師交件） */
  title: { in: [0.96, 0.97], out: [0.985, 0.998] },
} satisfies Record<string, { in: [number, number]; out: [number, number] }>;

export const fireStoryScene: SceneConfig = {
  design: { w: W, h: H },
  fit: 'smart',
  anchor: { x: 0.5, y: 0.5 },
  background: [{ p: 0, color: '#000000' }],
  elements: [
    // C1 窗內小火 → 越燒越旺（鏡頭極緩慢推近）
    slide('1-1', image('1-1'), { layer: 1, hideAt: 0.08, zoom: [[0, 1], [0.2, 1.06]] }),
    slide('1-2', image('1-2'), { layer: 2, fadeIn: [0.035, 0.07], hideAt: 0.13, zoom: [[0, 1], [0.2, 1.06]] }),
    slide('1-3', image('1-3'), { layer: 3, fadeIn: [0.08, 0.115], hideAt: 0.25, zoom: [[0, 1], [0.2, 1.06]] }),
    // C2 火焰延燒出窗外、佔滿畫面，同時 zoom in
    slide('2-1', image('2-1'), { layer: 4, fadeIn: [0.19, 0.23], hideAt: 0.31, zoom: [[0.19, 1.06], [0.31, 1.6]] }),
    slide('2-2', image('2-2'), { layer: 5, fadeIn: [0.27, 0.31], hideAt: 0.42, zoom: [[0.27, 1], [0.42, 1.18]] }),
    // C3 人物剪影往畫面中心走、逐漸縮小，被前景火焰遮住
    slide('3-1', image('3-1'), { layer: 6, fadeIn: [0.37, 0.41], hideAt: 0.47, zoom: [[0.37, 1.08], [0.47, 1]] }),
    slide('3-2', image('3-2'), { layer: 7, fadeIn: [0.43, 0.47], hideAt: 0.52, zoom: [[0.43, 1.04], [0.52, 1]] }),
    slide('3-3', image('3-3'), { layer: 8, fadeIn: [0.48, 0.52], hideAt: 0.57, zoom: [[0.48, 1.04], [0.57, 1]] }),
    slide('3-4', image('3-4'), { layer: 9, fadeIn: [0.53, 0.57], hideAt: 0.62, zoom: [[0.53, 1.04], [0.62, 1]] }),
    slide('3-5', image('3-5'), { layer: 10, fadeIn: [0.58, 0.62], hideAt: 0.71, zoom: [[0.58, 1], [0.71, 1.05]] }),
    // 3-6 與 2-2 是同一張圖
    slide('3-6', image('2-2'), { layer: 11, fadeIn: [0.67, 0.71], hideAt: 0.75, zoom: [[0.67, 1.05], [0.75, 1.1]] }),
    // C4 影片：4-1 滿版火收成一團（scrub）→ 4-2 火團 loop → 4-3 熄滅（scrub）
    slide('4-1', video('4-1'), {
      layer: 12,
      fadeIn: [0.72, 0.75],
      hideAt: 0.81,
      playback: { mode: 'scroll', range: [0.73, 0.8] },
    }),
    slide('4-2', video('4-2'), { layer: 13, fadeIn: [0.8, 0.81], hideAt: 0.87, playback: { mode: 'loop' } }),
    slide('4-3', video('4-3'), {
      layer: 14,
      fadeIn: [0.86, 0.87],
      hideAt: 0.95,
      playback: { mode: 'scroll', range: [0.865, 0.91] },
    }),
  ],
};
