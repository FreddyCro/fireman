// Hero「消防員之死」分鏡，來自 POC C 版（/poc/fire-story-paced，設計見 architecture/2026-10-22-fire-story-paced-design.md）。
// C1～C3 是整張不透明的直式插畫，以幻燈片交叉淡化串接（只有 2-1 有 zoom）；
// 3-6 之後插一支橫式影片（3-6v，設計師測試中）：綁捲動 scrub、所有載具都 cover 滿版，前後硬切；
// C4 是動畫師交的影片：捲到觸發點自動原速播放、播完接下一段，由 sequence 控制，影片之間硬切。
// 文字在 Hero.vue 的 DOM overlay，與幻燈片同一條進度軸。
//
// 時間軸一律寫「捲到第幾 vh」（捲動距離 = 跑道 − 一個畫面），再換成引擎用的進度 p。
import { clamp01, EASE } from '../paper-scroll/keyframes';
import type { SequenceState } from '../paper-scroll/sequence';
import type { ElementConfig, Keyframe, PlaybackConfig, SceneConfig, SpriteConfig } from '../paper-scroll/types';

const DIR = '/img/hero';
const W = 1080;
const H = 1920;
const CENTER: [number, number] = [0.5, 0.5];

/** 跑道長度（vh）；捲動距離 = 跑道 − 一個畫面（舞台 100lvh） */
export const HERO_TRACK_VH = 2600;
const DIST = HERO_TRACK_VH - 100;

/** 捲動位置（vh）→ 進度 p */
const at = (vh: number) => vh / DIST;
const range = (a: number, b: number): [number, number] => [at(a), at(b)];

/** 硬切、隱藏用的極小進度差 */
const EPS = 0.0001;

const image = (name: string): SpriteConfig => ({ src: `${DIR}/${name}.webp`, frames: 1, cellW: W, cellH: H, anchor: CENTER });
const video = (name: string, cellW = W, cellH = H): SpriteConfig => ({
  src: `${DIR}/${name}.mp4`,
  kind: 'video',
  frames: 1,
  cellW,
  cellH,
  anchor: CENTER,
});

/** 以下位置都是 vh */
interface SlideOpts {
  /** 淡入區間；沒有就是一開始就在 */
  fadeIn?: [number, number];
  /** 在這個位置硬切出現（之前隱藏） */
  cutIn?: number;
  /** 一開始隱藏，顯示與否交給 sequence */
  hidden?: boolean;
  /** 下一張完全蓋住後就不畫（opacity 0），省繪製 */
  hideAt?: number;
  /** zoom：[vh, scale] 依序 */
  zoom?: [number, number][];
  layer: number;
  playback?: PlaybackConfig;
  cover?: ElementConfig['cover'];
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
  else if (o.cutIn !== undefined) {
    push({ p: 0, opacity: 0 });
    push({ p: at(o.cutIn) - EPS, opacity: 0 });
    push({ p: at(o.cutIn), opacity: 1 });
  } else if (o.fadeIn) {
    push({ p: at(o.fadeIn[0]), opacity: 0 });
    push({ p: at(o.fadeIn[1]), opacity: 1, ease: 'inOut' });
  } else push({ p: 0, opacity: 1 });
  if (o.hideAt !== undefined) {
    push({ p: at(o.hideAt) - EPS, opacity: 1 });
    push({ p: at(o.hideAt), opacity: 0 });
  }
  for (const [vh, scale] of o.zoom ?? []) push({ p: at(vh), scale, ease: 'inOut' });
  kfs.sort((a, b) => a.p - b.p);
  kfs[0] = { ...kfs[0]!, x: 0.5, y: 0.5, layer: o.layer };
  return { id, sprite, frameMode: 'hold', holdFrame: 0, playback: o.playback, cover: o.cover, keyframes: kfs };
}

/** 3-6v 硬切出現、開始 scrub 的位置 */
const V0 = 1275;
/** 3-6v 的 scrub 長度：8.5 秒 205 格，約每 2vh 一格 */
const V_LEN = 400;
/** 3-6v 到最後一格、硬切 4-1 並觸發播放（3 秒）；C4 的段落都以這裡為起點排 */
const T1 = V0 + V_LEN;
/** 觸發 4-3（3 秒），硬切蓋掉 4-2 loop。區 0 拉到 400vh，參考紐時 6 秒影片配約 360vh */
const T3 = T1 + 400;

type TextRange = { in: [number, number]; out: [number, number] };

/** 文字 overlay 的進出場（進度 p） */
export const HERO_TEXT = {
  incident: { in: range(178.5, 212.5), out: range(297.5, 323) },
  /** 3-1 字幕：氧氣面罩，落在 3-1 可見區間內 */
  mask: { in: range(654.5, 680), out: range(765, 790.5) },
  lastWords: { in: range(1020, 1054), out: range(1130.5, 1156) },
  /** 4-1 先在沒有字的畫面播 80vh，說明文字才進場；退場後才輪到名單 */
  victim: { in: range(T1 + 80, T1 + 100), out: range(T1 + 180, T1 + 200) },
  /** 進場實際靠時間（4-3 播完後原地淡入），in 只是名目值；T3 後 200vh 才退場 */
  lesson: { in: range(T3 + 40, T3 + 60), out: range(T3 + 200, T3 + 220) },
  /** 標題：out 段是粉末化消失（佔位效果，等動畫師交件） */
  title: { in: range(T3 + 240, T3 + 260), out: range(T3 + 350, T3 + 415) },
} satisfies Record<string, TextRange>;

export type HeroCue = keyof typeof HERO_TEXT;

/** 4-2 殉職名單片尾式捲動的位置區間；可見與否另由 c4Mid 決定（4-2 顯示後才看得到） */
export const HERO_ROLL = range(T1 + 200, T3);

export const heroScene: SceneConfig = {
  design: { w: W, h: H },
  fit: 'smart',
  anchor: { x: 0.5, y: 0.5 },
  background: [{ p: 0, color: '#000000' }],
  elements: [
    // C1 窗內小火 → 越燒越旺
    slide('1-1', image('1-1'), { layer: 1, hideAt: 136 }),
    slide('1-2', image('1-2'), { layer: 2, fadeIn: [59.5, 119], hideAt: 221 }),
    slide('1-3', image('1-3'), { layer: 3, fadeIn: [136, 195.5], hideAt: 425 }),
    // C2 火焰延燒出窗外、佔滿畫面：2-1 從原尺寸 zoom in 到 1.6，2-2 原尺寸淡入
    slide('2-1', image('2-1'), { layer: 4, fadeIn: [323, 391], hideAt: 527, zoom: [[323, 1], [527, 1.6]] }),
    slide('2-2', image('2-2'), { layer: 5, fadeIn: [459, 527], hideAt: 714 }),
    // C3 人物剪影往畫面中心走，被前景火焰遮住
    slide('3-1', image('3-1'), { layer: 6, fadeIn: [629, 697], hideAt: 799 }),
    slide('3-2', image('3-2'), { layer: 7, fadeIn: [731, 799], hideAt: 884 }),
    slide('3-3', image('3-3'), { layer: 8, fadeIn: [816, 884], hideAt: 969 }),
    slide('3-4', image('3-4'), { layer: 9, fadeIn: [901, 969], hideAt: 1054 }),
    slide('3-5', image('3-5'), { layer: 10, fadeIn: [986, 1054], hideAt: 1207 }),
    // 3-6 與 2-2 是同一張圖
    slide('3-6', image('2-2'), { layer: 11, fadeIn: [1139, 1207], hideAt: V0 }),
    // 3-6v 橫式影片（測試）：前後硬切、捲動 scrub；不跟場景的 smart，桌機滿版、平板手機高度頂滿左右裁
    slide('3-6v', video('3-6-test', 1920, 1080), {
      layer: 12,
      cutIn: V0,
      hideAt: T1,
      cover: 'stage',
      playback: { mode: 'scroll', range: range(V0, T1) },
    }),
    // C4：4-1 在 T1 硬切蓋掉 3-6v，越過 T1 後交給序列；4-2、4-3 完全由序列控制
    slide('4-1', video('4-1'), { layer: 13, cutIn: T1, playback: { mode: 'trigger' } }),
    slide('4-2', video('4-2'), { layer: 14, hidden: true, playback: { mode: 'loop' } }),
    slide('4-3', video('4-3'), { layer: 15, hidden: true, playback: { mode: 'trigger' } }),
  ],
  sequence: {
    steps: [
      { trigger: at(T1), play: '4-1', then: '4-2' },
      { trigger: at(T3), play: '4-3' },
    ],
    // 設計師回饋（2026-10-20）：影片之間直接切，不淡入淡出
    fade: 0,
  },
};

/** 0 → 1 → 0：進場淡入、退場淡出 */
export function presence(cue: HeroCue, p: number): number {
  const { in: [a, b], out: [c, d] } = HERO_TEXT[cue];
  if (p < c) return EASE.out(clamp01((p - a) / (b - a)));
  return 1 - EASE.in(clamp01((p - c) / (d - c)));
}

/** 只看退場的存在感（1 → 0）：教訓文字在 4-3 播完後靠時間在原地淡入，進度只決定它何時退場 */
export function exitPresence(cue: HeroCue, p: number): number {
  const [c, d] = HERO_TEXT[cue].out;
  return 1 - EASE.in(clamp01((p - c) / (d - c)));
}

/** 4-2 已顯示（區 0 播完或已進區 1），名單才可見 */
export function c4Mid(seq: SequenceState | null): boolean {
  return !!seq && (seq.step > 0 || (seq.step === 0 && seq.phase === 'ended'));
}

/** 最後一區播完，C4 之後的文字才出現 */
export function c4Done(seq: SequenceState | null): boolean {
  return !!seq && seq.step === heroScene.sequence!.steps.length - 1 && seq.phase === 'ended';
}
