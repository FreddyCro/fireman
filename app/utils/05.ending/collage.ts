// 05 ending：大圖＋照片拼貼的版面（中英文共用），alt 在 locales/{zh,en}/section-ending.json 以 id 對應。
// 三個斷點各一份（mob 414 稿、pad 768 稿、pc 1280 稿），座標是該稿上的 px；元件換算成拼貼框的百分比等比縮放。

/** 頂部滿版大圖（1280×519），隨捲動 zoom out */
export const HERO = { id: 'hero', src: '/img/ending/hero.png', w: 1280, h: 519 };

/** 支持區塊上方的火焰圖（207×206） */
export const FIRE_SRC = '/img/ending/fire.png';

export interface CollagePhoto {
  id: string;
  src: string;
  /** 隨捲動在框內慢慢放大（zoom in） */
  zoom?: boolean;
}

export const PHOTOS: CollagePhoto[] = [
  { id: 'xufu', src: '/img/ending/photo-xufu.png' },
  { id: 'ladder', src: '/img/ending/photo-chengzhong-ladder.png' },
  { id: 'meifu', src: '/img/ending/photo-meifu.png' },
  { id: 'rest', src: '/img/ending/photo-jingpeng-rest.png', zoom: true },
  { id: 'funeral', src: '/img/ending/photo-taichung-funeral.png' },
  { id: 'rescue', src: '/img/ending/photo-chengzhong-rescue.png' },
  { id: 'masks', src: '/img/ending/photo-chengzhong-masks.png' },
  { id: 'mingyang', src: '/img/ending/photo-mingyang.png' },
  { id: 'feili', src: '/img/ending/photo-feili.png' },
  { id: 'gear', src: '/img/ending/photo-jingpeng-gear.png' },
];

export interface CollageRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollageLayout {
  /**
   * 拼貼框在該稿上的範圍（px）。overlap＝框上緣疊進大圖的高度（負數＝與大圖之間留空）。
   * maxW：框的最大寬度（px）；不給＝跟著螢幕寬等比縮放。
   */
  frame: { x: number; y: number; w: number; h: number; overlap: number; maxW?: number };
  /** 陣列順序＝疊放順序（後面的在上）；沒列到的照片在這個斷點不顯示 */
  stack: CollageRect[];
}

export type Breakpoint = 'mob' | 'pad' | 'pc';

export const LAYOUTS: Record<Breakpoint, CollageLayout> = {
  // mob 稿（414 寬）：滿版、照片由上往下交錯，公祭照貼左緣
  mob: {
    frame: { x: 0, y: 0, w: 414, h: 1424, overlap: 0 },
    stack: [
      { id: 'xufu', x: 57, y: 0, w: 197, h: 122 },
      { id: 'meifu', x: 188, y: 150, w: 200, h: 289 },
      { id: 'ladder', x: 13, y: 245, w: 203, h: 144 },
      { id: 'rest', x: 63, y: 481, w: 256, h: 184 },
      { id: 'rescue', x: 104, y: 633, w: 268, h: 249 },
      { id: 'mingyang', x: 22, y: 758, w: 134, h: 85 },
      { id: 'funeral', x: 0, y: 957, w: 172, h: 115 },
      { id: 'feili', x: 241, y: 895, w: 173, h: 118 },
      { id: 'masks', x: 169, y: 1022, w: 144, h: 166 },
      { id: 'gear', x: 120, y: 1205, w: 172, h: 218 },
    ],
  },
  // pad 稿（768 寬）：7 張、彼此不重疊，大圖下方留 16px；框維持 768 寬置中
  pad: {
    frame: { x: 0, y: 327, w: 768, h: 706, overlap: -16, maxW: 768 },
    stack: [
      { id: 'ladder', x: 79, y: 368, w: 180, h: 128 },
      { id: 'meifu', x: 270, y: 406, w: 154, h: 223 },
      { id: 'rescue', x: 434, y: 327, w: 261, h: 242 },
      { id: 'rest', x: 84, y: 617, w: 266, h: 191 },
      { id: 'masks', x: 463, y: 583, w: 178, h: 205 },
      { id: 'feili', x: 432, y: 800, w: 239, h: 163 },
      { id: 'gear', x: 270, y: 836, w: 154, h: 195 },
    ],
  },
  // pc 稿（1280 寬）：框 x 113–1167（以 640 為中心），上緣疊進大圖 519 − 457 = 62px
  pc: {
    frame: { x: 113, y: 457, w: 1054, h: 1056, overlap: 62, maxW: 1054 },
    stack: [
      { id: 'xufu', x: 337, y: 457, w: 196, h: 122 },
      { id: 'ladder', x: 137, y: 605, w: 200, h: 142 },
      { id: 'meifu', x: 409, y: 646, w: 199, h: 288 },
      { id: 'rest', x: 197, y: 881, w: 297, h: 214 },
      { id: 'funeral', x: 728, y: 717, w: 439, h: 293 },
      { id: 'rescue', x: 681, y: 499, w: 267, h: 248 },
      { id: 'masks', x: 617, y: 843, w: 199, h: 230 },
      { id: 'mingyang', x: 462, y: 1101, w: 132, h: 84 },
      { id: 'feili', x: 728, y: 1095, w: 264, h: 180 },
      { id: 'gear', x: 555, y: 1295, w: 172, h: 218 },
    ],
  },
};
