// Hero「消防員之死」分鏡，原為 fire-story POC 的 C 版（paced），設計見 architecture/archive/2026-10-22-fire-story-paced-design.md。
// C1～C3 是整張不透明的直式插畫，以幻燈片交叉淡化串接（只有 2-1 有 zoom）；
// 3-6 換成橫式靜態圖、後接橫式影片 3-6v（設計師測試中，2026-11-10 版）：兩者都 cover: 'stage'（三載具同高、Pad/Mob 左右裁），
// 3-5 → 3-6 淡入、3-6 → 3-6v 硬切（注意：3-6 與影片首格構圖不同，硬切會跳）、3-6v 綁捲動 scrub、3-6v 播完硬切成全黑（「然而最後…」原地淡入淡出）、再硬切 4-1；
// C4 是動畫師交的影片：捲到觸發點自動原速播放、播完接下一段，由 sequence 控制，影片之間硬切；三載具各一組檔（heroScene(device)）。
// 文字在 Hero.vue 的 DOM overlay，與幻燈片同一條進度軸。設計師回饋（FEEDBACK_1 hero-2）：文字動態只有兩種——
// 向上滾動（HERO_SCROLL：從畫面底下進來、往上滑走）與原地淡入淡出（HERO_TEXT）。
//
// 時間軸一律寫「捲到第幾 vh」（捲動距離 = 跑道 − 一個畫面），再換成引擎用的進度 p。
import { clamp01, EASE } from '../paper-scroll/keyframes';
import type { Device } from '../get-device';
import type { SequenceState } from '../paper-scroll/sequence';
import type {
  ElementConfig,
  Keyframe,
  PlaybackConfig,
  SceneConfig,
  SequenceConfig,
  SpriteConfig,
} from '../paper-scroll/types';

const DIR = '/img/hero';

/** 首屏的第一張窗戶圖：Hero.vue 用它加 <link rel="preload">，場景也標成 priority，載完就開始畫 */
export const HERO_FIRST_IMAGE = `${DIR}/1-1.webp`;
const W = 1080;
const H = 1920;
const CENTER: [number, number] = [0.5, 0.5];

/** 跑道長度（vh）；捲動距離 = 跑道 − 一個畫面（舞台 100lvh） */
export const HERO_TRACK_VH = 2490;
const DIST = HERO_TRACK_VH - 100;

/** 捲動位置（vh）→ 進度 p */
const at = (vh: number) => vh / DIST;
const range = (a: number, b: number): [number, number] => [at(a), at(b)];

/** 硬切、隱藏用的極小進度差 */
const EPS = 0.0001;

const image = (name: string, cellW = W, cellH = H, priority = false): SpriteConfig => ({
  src: `${DIR}/${name}.webp`,
  priority: priority || undefined,
  frames: 1,
  cellW,
  cellH,
  anchor: CENTER,
});
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
/** 3-6v 的 scrub 長度：3.6 秒 36 格（10fps），約每 4vh 一格 */
const V_LEN = 150;
/** 3-6v 到最後一格、硬切成全黑 */
const V1 = V0 + V_LEN;
/** 全黑空檔長度：「然而最後，他沒能再走出來。」在這段原地淡入淡出（設計稿 3-6 → 4-1 之間的黑底格） */
const BLACK_LEN = 140;
/** 黑底結束、硬切 4-1 並觸發播放（3 秒）；C4 的段落都以這裡為起點排 */
const T1 = V1 + BLACK_LEN;
/** 觸發 4-3（3 秒），硬切蓋掉 4-2 loop。區 0 拉到 400vh，參考紐時 6 秒影片配約 360vh */
const T3 = T1 + 400;

type TextRange = { in: [number, number]; out: [number, number] };

/** 原地淡入淡出的文字（進度 p） */
export const HERO_TEXT = {
  /** 3-6v 播完後的黑底（設計稿 4-1 黑底格標註「原地淡入淡出」） */
  lastWords: { in: range(V1 + 20, V1 + 45), out: range(V1 + 95, V1 + 120) },
  /** 進場實際靠時間（4-3 播完後原地淡入），in 只是名目值；T3 後 200vh 才退場 */
  lesson: { in: range(T3 + 40, T3 + 60), out: range(T3 + 200, T3 + 220) },
  /** 標題影片：in 段淡入（停在第一格），淡入完成到 out 結束綁捲動播完（字粉末化消失）；見 HERO_TITLE_SCRUB */
  title: { in: range(T3 + 240, T3 + 260), out: range(T3 + 350, T3 + 415) },
} satisfies Record<string, TextRange>;

export type HeroCue = keyof typeof HERO_TEXT;

/**
 * 向上滾動的文字（設計稿標註「向上滾動」）：區間起點時元素頂端貼齊畫面底、終點時底端離開畫面頂，中間線性跟著捲動。
 * 區間由設計稿各格的文字位置反推（文字欄 414×736，位置以該格幻燈片淡入完成時為準）。
 */
export const HERO_SCROLL = {
  /** 事件文字：1-3 時頂端在 556px（底距 48px）、2-1 時在 45px，2-2 蓋滿前已離開 */
  incident: range(126, 455),
  /** 氧氣面罩字幕：3-1 時頂端在 578px、3-2 在 283px、3-3 在 29px */
  mask: range(642, 938),
  /** 4-1 說明文字＋27 名＋殉職名單，片尾字幕式一起往上；可見與否另由 c4Mid 決定（4-1 播完才出現後面的文字） */
  roll: range(T1 + 80, T3),
} satisfies Record<string, [number, number]>;

export type HeroScrollCue = keyof typeof HERO_SCROLL;

/**
 * C4 火球（1116 交件 fireball_{PC,Pad,Mob}，原為一支 9 秒影片，依標示的 loop 點 00:01:07～00:04:12 切成三段）：
 * 4-1 進場（0～1.29 秒）、4-2 loop（1.29～4.5 秒）、4-3 退場（4.5 秒～結束）。
 * Mob 是 9:16 直式，和設計畫布同比例；Pad（1024×1366）、PC（1920×1080 橫式）不跟場景的 smart，蓋滿舞台。
 */
function c4(name: string, d: Device): { sprite: SpriteConfig; cover?: ElementConfig['cover'] } {
  if (d === 'pc') return { sprite: video(`${name}_pc`, 1920, 1080), cover: 'stage' };
  if (d === 'pad') return { sprite: video(`${name}_pad`, 1024, 1366), cover: 'stage' };
  return { sprite: video(`${name}_mob`) };
}

/** 標題影片綁捲動播放的區間：淡入完成 → 原本文字標題退場結束 */
export const HERO_TITLE_SCRUB: [number, number] = [HERO_TEXT.title.in[1], HERO_TEXT.title.out[1]];

export type HeroLocale = 'zh' | 'en';

/**
 * 標題影片（1116 交件 Title 動畫，已轉成逐格 keyframe）：Pad 與 Mob 共用 pad 版（2026-11-17 確認）。
 * PC（1920×1080）、Pad（1024×1364）蓋滿舞台；Mob 依設計稿「手機版 影片頂裝置寬」放進設計畫布、寬度頂滿（直式畫布在手機上是 cover）。
 * 4-3 播完才出現（afterSequence，同原本文字標題的 c4Done）。
 */
function title(d: Device, locale: HeroLocale): ElementConfig {
  const name = `title${locale === 'en' ? '_en' : ''}_${d === 'pc' ? 'pc' : 'pad'}`;
  const sprite = d === 'pc' ? video(name, 1920, 1080) : d === 'pad' ? video(name, 1024, 1364) : video(name, W, (W * 1364) / 1024);
  const [a, b] = HERO_TEXT.title.in;
  return {
    id: 'title',
    sprite,
    frameMode: 'hold',
    holdFrame: 0,
    cover: d === 'mob' ? undefined : 'stage',
    playback: { mode: 'scroll', range: HERO_TITLE_SCRUB },
    afterSequence: true,
    keyframes: [
      { p: 0, x: 0.5, y: 0.5, opacity: 0, layer: 16 },
      { p: a, opacity: 0 },
      { p: b, opacity: 1, ease: 'inOut' },
    ],
  };
}

/** 影片序列（三載具相同） */
export const HERO_SEQUENCE: SequenceConfig = {
  steps: [
    { trigger: at(T1), play: '4-1', then: '4-2' },
    { trigger: at(T3), play: '4-3' },
  ],
  // 設計師回饋（2026-10-20）：影片之間直接切，不淡入淡出
  fade: 0,
};

export const heroScene = (d: Device, locale: HeroLocale = 'zh'): SceneConfig => ({
  design: { w: W, h: H },
  fit: 'smart',
  anchor: { x: 0.5, y: 0.5 },
  background: [{ p: 0, color: '#000000' }],
  elements: [
    // C1 窗內小火 → 越燒越旺
    slide('1-1', image('1-1', W, H, true), { layer: 1, hideAt: 136 }),
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
    // 3-6 橫式靜態圖（1116 交件 C03-6）：從 3-5 淡入，在 V0 硬切成影片；和 3-6v 一樣不跟場景的 smart
    slide('3-6', image('3-6', 1920, 1080), { layer: 11, fadeIn: [1139, 1207], hideAt: V0, cover: 'stage' }),
    // 3-6v 橫式影片（1116 交件 C03 轉場火焰 firewave，重新編碼成逐格 keyframe 才能順暢 scrub）：
    // 前後硬切、捲動 scrub，播完切成全黑（背景）；不跟場景的 smart，桌機滿版、平板手機高度頂滿左右裁
    slide('3-6v', video('3-6', 1920, 1080), {
      layer: 12,
      cutIn: V0,
      hideAt: V1,
      cover: 'stage',
      playback: { mode: 'scroll', range: range(V0, V1) },
    }),
    // C4：4-1 在 T1 從黑底硬切出現，越過 T1 後交給序列；4-2、4-3 完全由序列控制
    slide('4-1', c4('4-1', d).sprite, { layer: 13, cutIn: T1, playback: { mode: 'trigger' }, cover: c4('4-1', d).cover }),
    slide('4-2', c4('4-2', d).sprite, { layer: 14, hidden: true, playback: { mode: 'loop' }, cover: c4('4-2', d).cover }),
    slide('4-3', c4('4-3', d).sprite, { layer: 15, hidden: true, playback: { mode: 'trigger' }, cover: c4('4-3', d).cover }),
    title(d, locale),
  ],
  sequence: HERO_SEQUENCE,
});

/** 0 → 1 → 0：進場淡入、退場淡出 */
export function presence(cue: HeroCue, p: number): number {
  const { in: [a, b], out: [c, d] } = HERO_TEXT[cue];
  if (p < c) return EASE.out(clamp01((p - a) / (b - a)));
  return 1 - EASE.in(clamp01((p - c) / (d - c)));
}

/** 向上滾動的進度 0 → 1（區間外夾住） */
export function scrollT(cue: HeroScrollCue, p: number): number {
  const [a, b] = HERO_SCROLL[cue];
  return clamp01((p - a) / (b - a));
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
  return !!seq && seq.step === HERO_SEQUENCE.steps.length - 1 && seq.phase === 'ended';
}
