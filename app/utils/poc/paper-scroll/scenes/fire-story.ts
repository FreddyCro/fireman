// 「消防員之死」分鏡：C1～C3 是整張不透明的直式插畫，以幻燈片交叉淡化串接（只有 2-1 有 zoom）；
// C4 是動畫師交的影片，有兩個版本：
//   scrub（A 版 /poc/fire-story）：4-1、4-3 跟著捲動 scrub，4-2 loop。
//   trigger（B 版 /poc/fire-story-auto）：捲到定點自動原速播放、播完接下一段，由 sequence 控制。
// 文字在頁面的 DOM overlay。分鏡進度見 architecture/2026-10-19-fire-story-design.md 與 2026-10-19-fire-story-auto-design.md。
import type { SequenceState } from '../sequence';
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
  /** 一開始隱藏，顯示與否交給 sequence */
  hidden?: boolean;
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
  if (o.hidden) push({ p: 0, opacity: 0 });
  else if (o.fadeIn) {
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
  /** 3-1 字幕：氧氣面罩（設計師 2026-10-19 補充），落在 3-1 可見區間 0.37～0.47 內 */
  mask: { in: [0.385, 0.4], out: [0.45, 0.465] },
  lastWords: { in: [0.6, 0.62], out: [0.665, 0.68] },
  victim: { in: [0.755, 0.77], out: [0.8, 0.81] },
  lesson: { in: [0.915, 0.93], out: [0.945, 0.955] },
  /** 標題：out 段是粉末化消失（佔位效果，等動畫師交件） */
  title: { in: [0.96, 0.97], out: [0.985, 0.998] },
} satisfies Record<string, { in: [number, number]; out: [number, number] }>;

/** A 版 4-2 殉職名單片尾式捲動的進度區間 = 4-2 的可見區間；名單從畫面底部一路捲到頂部消失 */
export const FIRE_STORY_ROLL: [number, number] = [0.8, 0.87];

export type FireStoryVariant = 'scrub' | 'trigger';

/** B 版：區 0（4-1 → 4-2）與區 1（4-3）的觸發點。區 0 約 200vh，讓一般速度捲動的人在 4-1 播完後才到區 1 */
const AUTO_T1 = 0.75;
const AUTO_T3 = 0.86;
/** B 版名單捲動的位置區間；可見與否另由 c4Mid 決定（4-2 顯示後才看得到） */
export const FIRE_STORY_AUTO_ROLL: [number, number] = [0.78, AUTO_T3];

// 設計師回饋（2026-10-19）：只有 2-1 保留滾動放大，其他幻燈片原尺寸交叉淡化切換
const C1_TO_C3: ElementConfig[] = [
  // C1 窗內小火 → 越燒越旺
  slide('1-1', image('1-1'), { layer: 1, hideAt: 0.08 }),
  slide('1-2', image('1-2'), { layer: 2, fadeIn: [0.035, 0.07], hideAt: 0.13 }),
  slide('1-3', image('1-3'), { layer: 3, fadeIn: [0.08, 0.115], hideAt: 0.25 }),
  // C2 火焰延燒出窗外、佔滿畫面：2-1 從原尺寸 zoom in 到 1.6，2-2 原尺寸淡入（兩張比例會差一截，設計師要先看效果）
  slide('2-1', image('2-1'), { layer: 4, fadeIn: [0.19, 0.23], hideAt: 0.31, zoom: [[0.19, 1], [0.31, 1.6]] }),
  slide('2-2', image('2-2'), { layer: 5, fadeIn: [0.27, 0.31], hideAt: 0.42 }),
  // C3 人物剪影往畫面中心走，被前景火焰遮住
  slide('3-1', image('3-1'), { layer: 6, fadeIn: [0.37, 0.41], hideAt: 0.47 }),
  slide('3-2', image('3-2'), { layer: 7, fadeIn: [0.43, 0.47], hideAt: 0.52 }),
  slide('3-3', image('3-3'), { layer: 8, fadeIn: [0.48, 0.52], hideAt: 0.57 }),
  slide('3-4', image('3-4'), { layer: 9, fadeIn: [0.53, 0.57], hideAt: 0.62 }),
  slide('3-5', image('3-5'), { layer: 10, fadeIn: [0.58, 0.62], hideAt: 0.71 }),
  // 3-6 與 2-2 是同一張圖
  slide('3-6', image('2-2'), { layer: 11, fadeIn: [0.67, 0.71], hideAt: 0.75 }),
];

function c4(variant: FireStoryVariant): Pick<SceneConfig, 'elements' | 'sequence'> {
  if (variant === 'scrub') {
    // 4-1 滿版火收成一團（scrub）→ 4-2 火團 loop → 4-3 熄滅（scrub）
    return {
      elements: [
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
  }
  // 4-1 用關鍵幀從 3-6 淡入，越過 T1 後交給序列；4-2、4-3 完全由序列控制
  return {
    elements: [
      slide('4-1', video('4-1'), { layer: 12, fadeIn: [0.72, AUTO_T1], playback: { mode: 'trigger' } }),
      slide('4-2', video('4-2'), { layer: 13, hidden: true, playback: { mode: 'loop' } }),
      slide('4-3', video('4-3'), { layer: 14, hidden: true, playback: { mode: 'trigger' } }),
    ],
    sequence: {
      steps: [
        { trigger: AUTO_T1, play: '4-1', then: '4-2' },
        { trigger: AUTO_T3, play: '4-3' },
      ],
      fade: 400,
    },
  };
}

export function buildFireStoryScene(variant: FireStoryVariant): SceneConfig {
  const { elements, sequence } = c4(variant);
  return {
    design: { w: W, h: H },
    fit: 'smart',
    anchor: { x: 0.5, y: 0.5 },
    background: [{ p: 0, color: '#000000' }],
    elements: [...C1_TO_C3, ...elements],
    sequence,
  };
}

export const fireStoryScene = buildFireStoryScene('scrub');
export const fireStoryAutoScene = buildFireStoryScene('trigger');

/** B 版：4-2 已顯示（區 0 播完或已進區 1），名單才可見。沒有序列的 A 版永遠 true */
export function c4Mid(seq: SequenceState | null, scene: SceneConfig): boolean {
  if (!scene.sequence) return true;
  return !!seq && (seq.step > 0 || (seq.step === 0 && seq.phase === 'ended'));
}

/** B 版：最後一區播完，C4 之後的文字才出現。沒有序列的 A 版永遠 true */
export function c4Done(seq: SequenceState | null, scene: SceneConfig): boolean {
  if (!scene.sequence) return true;
  return !!seq && seq.step === scene.sequence.steps.length - 1 && seq.phase === 'ended';
}
