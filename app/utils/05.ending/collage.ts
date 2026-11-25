// 座標是各斷點設計稿上的 px，以大圖上緣為 y=0。

/** 縮小後的位置是各斷點 stack 裡的 'hero' */
export const HERO = { id: 'hero', src: '/img/ending/hero.png', w: 1280, h: 519 };

/** 導購動態火：24fps，播完從第 31 格重播 */
export const FIRE_LOOP = { src: '/img/ending/fire-loop', w: 302, h: 406, loopFrom: 31 / 24 };

export interface CollagePhoto {
  id: string;
  src: string;
  /** mob 裁切不同時另給一張 */
  srcMob?: string;
  /** 框內隨捲動放大 */
  zoom?: boolean;
}

export const PHOTOS: CollagePhoto[] = [
  { id: 'rest', src: '/img/ending/photo-jingpeng-rest.jpg', zoom: true },
  { id: 'search', src: '/img/ending/photo-chengzhong-search.jpg' },
  { id: 'sleep', src: '/img/ending/photo-chengzhong-sleep.jpg', zoom: true },
  { id: 'funeral', src: '/img/ending/photo-taichung-funeral.jpg' },
  { id: 'meifu', src: '/img/ending/photo-meifu.jpg' },
  { id: 'luzhou', src: '/img/ending/photo-luzhou.jpg', srcMob: '/img/ending/photo-luzhou-mob.jpg' },
  { id: 'quanzhou', src: '/img/ending/photo-quanzhou.jpg' },
  { id: 'search2', src: '/img/ending/photo-chengzhong-search2.jpg' },
  { id: 'feili', src: '/img/ending/photo-feili.jpg' },
  { id: 'sleep2', src: '/img/ending/photo-chengzhong-sleep2.jpg', zoom: true },
];

/** 最後一幕：照片 pin 在中央，捲動中與導購交叉淡入淡出 */
export const FINALE = {
  id: 'gear',
  src: '/img/ending/photo-jingpeng-gear.jpg',
  /** 一開始接在拼貼下方的位置與寬度（mob 寬度 null＝滿版） */
  start: {
    mob: { top: 20, w: null },
    pad: { top: 37, w: 103 },
    pc: { top: 62, w: 171 },
  },
  /** 移到畫面中央後的寬度 */
  w: { mob: 260, pad: 171, pc: 171 },
  /** 高 / 寬 */
  ratio: 436 / 342,
  /** 從起點移到畫面中央的捲動距離 */
  moveVh: 60,
  /** 在中央停多久才開始淡出 */
  holdVh: 100,
  /** 淡出到導購的捲動距離 */
  fadeVh: 60,
  /** 導購出現後再停多久才鬆開 */
  afterVh: 40,
};

export interface CollageRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollageLayout {
  /** overlap：框上緣疊進大圖的高度；maxW 不給＝隨螢幕寬縮放 */
  frame: { x: number; y: number; w: number; h: number; overlap: number; maxW?: number };
  /** 陣列順序＝疊放順序；沒列到＝不顯示 */
  stack: CollageRect[];
}

export type Breakpoint = 'mob' | 'pad' | 'pc';

export const LAYOUTS: Record<Breakpoint, CollageLayout> = {
  // mob 大圖不縮，照片滿版往下排
  mob: {
    frame: { x: 0, y: 0, w: 414, h: 3301, overlap: 500 },
    stack: [
      { id: 'hero', x: 0, y: 0, w: 414, h: 500 },
      { id: 'rest', x: 0, y: 520, w: 414, h: 472 },
      { id: 'search', x: 0, y: 1012, w: 414, h: 384 },
      { id: 'funeral', x: 0, y: 1416, w: 414, h: 304 },
      { id: 'sleep', x: 0, y: 1740, w: 414, h: 445 },
      { id: 'luzhou', x: 0, y: 2205, w: 414, h: 466 },
      { id: 'sleep2', x: 0, y: 2691, w: 414, h: 276 },
      { id: 'feili', x: 0, y: 2987, w: 414, h: 314 },
    ],
  },
  // pad 沒有大圖縮小的稿，hero 照 pc 等比
  pad: {
    frame: { x: 0, y: 55, w: 768, h: 866, overlap: 256, maxW: 768 },
    stack: [
      { id: 'sleep', x: 39, y: 359, w: 119, h: 128 },
      { id: 'sleep2', x: 176, y: 772, w: 224, h: 149 },
      { id: 'luzhou', x: 0, y: 518, w: 244, h: 191 },
      { id: 'quanzhou', x: 333, y: 607, w: 179, h: 147 },
      { id: 'hero', x: 478, y: 55, w: 290, h: 118 },
      { id: 'funeral', x: 478, y: 434, w: 239, h: 175 },
      { id: 'meifu', x: 230, y: 448, w: 119, h: 173 },
      { id: 'search', x: 371, y: 289, w: 188, h: 175 },
      { id: 'search2', x: 649, y: 656, w: 119, h: 137 },
      { id: 'rest', x: 148, y: 248, w: 153, h: 175 },
      { id: 'feili', x: 455, y: 717, w: 202, h: 154 },
    ],
  },
  pc: {
    frame: { x: 0, y: 92, w: 1280, h: 1444, overlap: 426, maxW: 1280 },
    stack: [
      { id: 'sleep', x: 65, y: 598, w: 198, h: 213 },
      { id: 'sleep2', x: 293, y: 1287, w: 374, h: 249 },
      { id: 'luzhou', x: 0, y: 864, w: 406, h: 318 },
      { id: 'quanzhou', x: 555, y: 1012, w: 298, h: 245 },
      { id: 'hero', x: 797, y: 92, w: 483, h: 196 },
      { id: 'funeral', x: 797, y: 723, w: 398, h: 292 },
      { id: 'meifu', x: 383, y: 747, w: 198, h: 288 },
      { id: 'search', x: 619, y: 482, w: 314, h: 291 },
      { id: 'search2', x: 1082, y: 1094, w: 198, h: 229 },
      { id: 'rest', x: 246, y: 414, w: 255, h: 291 },
      { id: 'feili', x: 759, y: 1195, w: 337, h: 256 },
    ],
  },
};
