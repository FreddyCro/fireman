// 02「超哥故事」捲動動畫：無人受困的工廠裡死裡逃生。設計見 architecture/archive/2026-11-16-no-trapped-escape-design.md，
// 轉場規則與時間點見 architecture/no-trapped-escape-transitions.md（改時間軸時一併更新）。
// 分鏡來自 Figma「定版1106 (CH)」的「PC插畫編排」；Pad／Mob 沒有分鏡，依素材尺寸排。
// 素材是逐格分開的插畫（SpriteConfig.srcs）：「輪播」用 time loop，「播一次」綁捲動（scroll + range）。
// 文字在 NoTrappedEscape.vue 的 DOM overlay，與畫面同一條進度軸。
import { deviceOfWidth, type Device } from '../get-device';
import { STAIR_EDGE, type EdgeMaskConfig } from '../paper-scroll/edge-mask';
import { EPS, presenceOf, timeline } from '../paper-scroll/timeline';
import type { ElementConfig, Keyframe, SceneConfig, SpriteConfig } from '../paper-scroll/types';

/**
 * 邊緣模糊遮罩（設計師回饋 FEEDBACK_1 超哥-4「有色差的邊緣寫遮罩，參考樓梯的效果」）：
 * 圖的邊緣亮度不是 0（火燒工廠 8～9、走廊 7～20），黑底上會看到方框，所以四邊淡出成透明。
 * 比例與顆粒仿樓梯圖畫在圖裡的暗角；樓梯本身已經有、不重複套；白底的逃跑段（6-1～6-3）不套（往黑淡出會變黑框）。
 */
export const ESCAPE_EDGE = STAIR_EDGE;

/** 走廊圖（story4-*_walk）自帶硬邊黑帶：實測內容框外的比例，遮罩從內容的邊開始淡出 */
const WALK_INSET: Record<EscapeDevice, NonNullable<EdgeMaskConfig['inset']>> = {
  pc: { bottom: 0.108 },
  pad: { bottom: 0.135 },
  mob: { top: 0.12, bottom: 0.319 },
};

export type EscapeDevice = Device;

export const escapeDeviceOf = deviceOfWidth;

const DIR = '/img/no-trapped/escape';

/** 跑道長度（vh） */
export const ESCAPE_TRACK_VH = 2390;
const { at, range, cue } = timeline(ESCAPE_TRACK_VH);

/** 輪播（火、水簾）的 fps；輪播格之間維持硬切（淡化會讓火光、雨水糊成一片） */
const LOOP_FPS = 6;

/**
 * 設計師回饋（FEEDBACK_1 超哥-2）：圖片全部用淡入淡出切換。
 * 段落之間交叉淡化 60vh；同一段「播一次」的逐格交叉淡化 24vh（以格與格的交界為中心，各 12vh）
 */
const FRAME_XF = 24;

// ── 段落位置（vh）──
/** 1 火燒 → 2 水簾洞（交叉淡化） */
const STAIR_IN: [number, number] = [170, 230];
/** 樓梯長圖由上往下看 */
const STAIR_PAN: [number, number] = [260, 520];
/** 3 腳踩水：淡入後綁捲動播一次 */
const FEET_IN: [number, number] = [500, 540];
const FEET_PLAY: [number, number] = [540, 700];
/** 4 走廊：直接淡入蓋掉樓梯＋腳（交叉淡化，不經過黑畫面）；樓梯與腳在淡入完成時才消失 */
const WALK_IN: [number, number] = [720, 780];
const WALK_PLAY: [number, number] = [840, 1000];
/** 5 開關門（淡入蓋掉走廊） */
const DOOR_IN: [number, number] = [1020, 1080];
const DOOR_PLAY: [number, number] = [1080, 1380];
const DOOR_OUT: [number, number] = [1400, 1440];
/**
 * 7 畫面變白、逃跑 6-1 → 6-2；6-2（兩個人）播完直接切黑底。
 * 設計師回饋（FEEDBACK_1 超哥-3）：不用 zoom，所以原本接在後面放大到全黑的 6-3 剪影特寫整段拿掉（素材仍留在 public）
 */
const WHITE: [number, number] = [1640, 1680];
/** 白底淡入完成後，6-1 再淡入 */
const RUN_IN: [number, number] = [1680, 1720];
const RUN_PLAY: [number, number] = [1700, 1900];
const BLACK = RUN_PLAY[1];
/** 8 工廠大火 */
const BURN_IN: [number, number] = [1940, 2000];

/** 文字 overlay 的進出場（進度 p） */
export const ESCAPE_TEXT = {
  fire: cue(20, 60, 140, 170),
  stair: cue(270, 300, 440, 470),
  acid: cue(560, 590, 690, 720),
  corridor: cue(860, 890, 990, 1020),
  labels: cue(1100, 1130, 1210, 1240),
  closeDoor: cue(1260, 1290, 1370, 1400),
  explosion: cue(1470, 1500, 1600, 1630),
  run: cue(1720, 1750, 1880, 1900),
  // 最後一段不退場，跟著舞台捲走
  burn: cue(2020, 2050, ESCAPE_TRACK_VH, ESCAPE_TRACK_VH + 50),
};

export type EscapeCue = keyof typeof ESCAPE_TEXT;
export const ESCAPE_CUES = Object.keys(ESCAPE_TEXT) as EscapeCue[];

export const escapePresence = (c: EscapeCue, p: number) => presenceOf(ESCAPE_TEXT[c], p);

/** 白底段的字用深色 */
export const ESCAPE_DARK_CUES: EscapeCue[] = ['run'];

/**
 * PC 字幕位置（設計畫布 1280×720 的 px：左、上、寬），照分鏡；Pad／Mob 沒有稿，用 CSS 預設（上方置中）。
 */
export const ESCAPE_CAPTION_PC: Record<EscapeCue, [number, number, number]> = {
  fire: [432, 40, 441],
  stair: [337, 120, 303],
  acid: [135, 382, 441],
  corridor: [519, 165, 283],
  labels: [156, 209, 387],
  closeDoor: [185, 350, 387],
  explosion: [447, 300, 387],
  run: [447, 473, 387],
  burn: [447, 140, 387],
};

// ── 素材 ──

interface Cell {
  w: number;
  h: number;
}

interface DeviceSpec {
  design: Cell;
  maxScale?: number;
  /** 一般插畫格（火、腳、走廊、門、逃跑 6-1～2、大火） */
  fire: Cell;
  stair: Cell;
  /** 腳、走廊、門 */
  scene: Cell;
  run: Cell;
  burn: Cell;
  /** 樓梯與腳的放大倍率（分鏡上樓梯比插畫框大） */
  stairScale: number;
  /** 開關門張數：PC 缺 story5-6 */
  doorFrames: number;
}

const SPEC: Record<EscapeDevice, DeviceSpec> = {
  // 「1920 尺寸插畫文字位置不變也不放大，螢幕自己將黑背景左右延伸」
  pc: {
    design: { w: 1280, h: 720 },
    maxScale: 1,
    fire: { w: 810, h: 550 },
    stair: { w: 810, h: 1337 },
    scene: { w: 810, h: 550 },
    run: { w: 810, h: 550 },
    burn: { w: 810, h: 550 },
    stairScale: 1.4,
    doorFrames: 5,
  },
  pad: {
    design: { w: 768, h: 1024 },
    fire: { w: 620, h: 478 },
    stair: { w: 620, h: 1024 },
    scene: { w: 620, h: 478 },
    run: { w: 620, h: 478 },
    burn: { w: 620, h: 478 },
    stairScale: 1.2,
    doorFrames: 6,
  },
  mob: {
    design: { w: 414, h: 736 },
    fire: { w: 414, h: 478 },
    stair: { w: 414, h: 1305 },
    scene: { w: 414, h: 736 },
    run: { w: 414, h: 720 },
    burn: { w: 414, h: 500 },
    stairScale: 1,
    doorFrames: 6,
  },
};

/** story{n}-{i}_{name}_{device}.{ext}；ext 可依格數不同（Mob 的 story4-2 是 png） */
function files(n: number, name: string, count: number, d: EscapeDevice, ext: string | ((i: number) => string)) {
  return Array.from({ length: count }, (_, k) => {
    const i = k + 1;
    return `${DIR}/story${n}-${i}_${name}_${d}.${typeof ext === 'string' ? ext : ext(i)}`;
  });
}

/** 依索引重排播放順序（交件檔名順序和實際動作不一致時用） */
const reorder = <T>(list: T[], order: number[]): T[] => order.map((i) => list[i]!);

function sprite(key: string, srcs: string[], cell: Cell, anchor: [number, number] = [0.5, 0.5]): SpriteConfig {
  return { src: `${DIR}#${key}`, srcs, frames: srcs.length, cellW: cell.w, cellH: cell.h, anchor };
}

/** 依 p 合併關鍵幀（同 p 的屬性合在一起）並排序 */
function keys(...lists: Keyframe[][]): Keyframe[] {
  const out: Keyframe[] = [];
  for (const k of lists.flat()) {
    const same = out.find((x) => x.p === k.p);
    if (same) Object.assign(same, k);
    else out.push({ ...k });
  }
  return out.sort((a, b) => a.p - b.p);
}

/** 透明度：淡入區間（或 cut = 硬切）→ 淡出區間（或 hide = 硬切消失） */
function opacity(o: { fadeIn?: [number, number]; cutIn?: number; fadeOut?: [number, number]; hideAt?: number }) {
  const k: Keyframe[] = [];
  if (o.fadeIn) k.push({ p: 0, opacity: 0 }, { p: at(o.fadeIn[0]), opacity: 0 }, { p: at(o.fadeIn[1]), opacity: 1, ease: 'inOut' });
  else if (o.cutIn !== undefined) k.push({ p: 0, opacity: 0 }, { p: at(o.cutIn) - EPS, opacity: 0 }, { p: at(o.cutIn), opacity: 1 });
  else k.push({ p: 0, opacity: 1 });
  if (o.fadeOut) k.push({ p: at(o.fadeOut[0]), opacity: 1 }, { p: at(o.fadeOut[1]), opacity: 0, ease: 'inOut' });
  else if (o.hideAt !== undefined) k.push({ p: at(o.hideAt) - EPS, opacity: 1 }, { p: at(o.hideAt), opacity: 0 });
  return k;
}

export function escapeScene(d: EscapeDevice): SceneConfig {
  const s = SPEC[d];
  const H = s.design.h;
  const stairH = s.stair.h * s.stairScale;
  /** 樓梯靠上對齊畫布頂 → 底對齊畫布底（長圖比畫布矮就不動） */
  const stairEndY = Math.min(0, (H - stairH) / H);

  const elements: ElementConfig[] = [
    // 1 火燒工廠：輪播；字幕在上方，圖稍微往下
    {
      id: 'fire',
      edgeMask: ESCAPE_EDGE,
      sprite: sprite('fire', files(1, 'loop', 3, d, 'jpg'), s.fire),
      frameMode: 'time',
      fps: LOOP_FPS,
      keyframes: keys([{ p: 0, x: 0.5, y: 0.56, layer: 1 }], opacity({ hideAt: STAIR_IN[1] })),
    },
    // 2 水簾洞：輪播＋長圖往下看
    {
      id: 'stair',
      sprite: sprite('stair', files(2, 'stairbackground', 3, d, 'jpg'), s.stair, [0.5, 0]),
      frameMode: 'time',
      fps: LOOP_FPS,
      keyframes: keys(
        [{ p: 0, x: 0.5, y: 0, scale: s.stairScale, layer: 2 }],
        [{ p: at(STAIR_PAN[0]), y: 0 }, { p: at(STAIR_PAN[1]), y: stairEndY, ease: 'inOut' }],
        opacity({ fadeIn: STAIR_IN, hideAt: WALK_IN[1] }),
      ),
    },
    // 3 腳踩水：PNG 疊在樓梯底上，捲動播一次（逐格交叉淡化），走廊淡入蓋滿後連底圖一起消失。
    // 設計師回饋（FEEDBACK_1 超哥-5）：交件檔名的第 2、3 張順序反了，播放順序是 3-1 → 3-3 → 3-2
    {
      id: 'feet',
      edgeMask: ESCAPE_EDGE,
      sprite: sprite('feet', reorder(files(3, 'foot', 3, d, 'png'), [0, 2, 1]), s.scene),
      frameMode: 'scroll',
      range: range(...FEET_PLAY),
      crossfade: at(FRAME_XF),
      loop: 'clamp',
      maxStepPerTick: 0,
      keyframes: keys(
        [{ p: 0, x: 0.5, y: 0.5, scale: d === 'mob' ? 1 : s.stairScale, layer: 3 }],
        opacity({ fadeIn: FEET_IN, hideAt: WALK_IN[1] }),
      ),
    },
    // 4 走廊
    {
      id: 'walk',
      edgeMask: { ...ESCAPE_EDGE, inset: WALK_INSET[d] },
      sprite: sprite('walk', files(4, 'walk', 3, d, (i) => (d === 'mob' && i === 2 ? 'png' : 'jpg')), s.scene),
      frameMode: 'scroll',
      range: range(...WALK_PLAY),
      crossfade: at(FRAME_XF),
      loop: 'clamp',
      maxStepPerTick: 0,
      keyframes: keys([{ p: 0, x: 0.5, y: 0.5, layer: 4 }], opacity({ fadeIn: WALK_IN, hideAt: DOOR_IN[1] })),
    },
    // 5 開關門
    {
      id: 'door',
      edgeMask: ESCAPE_EDGE,
      sprite: sprite('door', files(5, 'opendoor', s.doorFrames, d, 'jpg'), s.scene),
      frameMode: 'scroll',
      range: range(...DOOR_PLAY),
      crossfade: at(FRAME_XF),
      loop: 'clamp',
      maxStepPerTick: 0,
      keyframes: keys([{ p: 0, x: 0.5, y: 0.5, layer: 5 }], opacity({ fadeIn: DOOR_IN, fadeOut: DOOR_OUT })),
    },
    // 7 逃跑：白底上 6-1 淡入 → 6-2 交叉淡化，播完連同白底一起硬切成黑底
    {
      id: 'run',
      sprite: sprite('run', files(6, 'run', 2, d, 'jpg'), s.run),
      frameMode: 'scroll',
      range: range(...RUN_PLAY),
      crossfade: at(FRAME_XF),
      loop: 'clamp',
      maxStepPerTick: 0,
      keyframes: keys([{ p: 0, x: 0.5, y: 0.5, layer: 6 }], opacity({ fadeIn: RUN_IN, hideAt: RUN_PLAY[1] })),
    },
    // 8 工廠大火：輪播
    {
      id: 'burn',
      edgeMask: ESCAPE_EDGE,
      sprite: sprite('burn', files(7, 'fireloop', 3, d, 'png'), s.burn),
      frameMode: 'time',
      fps: LOOP_FPS,
      keyframes: keys([{ p: 0, x: 0.5, y: 0.56, layer: 8 }], opacity({ fadeIn: BURN_IN })),
    },
  ];

  return {
    design: s.design,
    fit: 'contain',
    maxScale: s.maxScale,
    anchor: { x: 0.5, y: 0.5 },
    background: [
      { p: 0, color: '#000000' },
      { p: at(WHITE[0]), color: '#000000' },
      { p: at(WHITE[1]), color: '#ffffff' },
      { p: at(BLACK) - EPS, color: '#ffffff' },
      { p: at(BLACK), color: '#000000' },
    ],
    elements,
  };
}
