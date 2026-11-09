// 05 ending：大圖＋照片拼貼的版面（中英文共用），alt 在 locales/{zh,en}/section-ending.json 以 id 對應。
// 座標是 1280 寬設計稿上的 px，元件換算成拼貼框的百分比，所以各寬度等比縮放。

/** 頂部滿版大圖（1280×519），隨捲動 zoom out */
export const HERO = { id: 'hero', src: '/img/ending/hero.png', w: 1280, h: 519 };

/** 拼貼框：設計稿 x 113–1167（以 640 為中心）、y 457–1513；上緣疊進大圖 519 − 457 = 62px */
export const COLLAGE = { x: 113, y: 457, w: 1054, h: 1056, overlap: 62 };

export interface CollagePhoto {
  id: string;
  src: string;
  /** 設計稿 1280 寬上的位置與尺寸（px） */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 隨捲動在框內慢慢放大（zoom in） */
  zoom?: boolean;
}

/** 陣列順序＝疊放順序（後面的在上）；淡入是各張進入視窗時各自出現，所以由上往下依序 */
export const PHOTOS: CollagePhoto[] = [
  { id: 'xufu', src: '/img/ending/photo-xufu.png', x: 337, y: 457, w: 196, h: 122 },
  { id: 'ladder', src: '/img/ending/photo-chengzhong-ladder.png', x: 137, y: 605, w: 200, h: 142 },
  { id: 'meifu', src: '/img/ending/photo-meifu.png', x: 409, y: 646, w: 199, h: 288 },
  { id: 'rest', src: '/img/ending/photo-jingpeng-rest.png', x: 197, y: 881, w: 297, h: 214, zoom: true },
  { id: 'funeral', src: '/img/ending/photo-taichung-funeral.png', x: 728, y: 717, w: 439, h: 293 },
  { id: 'rescue', src: '/img/ending/photo-chengzhong-rescue.png', x: 681, y: 499, w: 267, h: 248 },
  { id: 'masks', src: '/img/ending/photo-chengzhong-masks.png', x: 617, y: 843, w: 199, h: 230 },
  { id: 'mingyang', src: '/img/ending/photo-mingyang.png', x: 462, y: 1101, w: 132, h: 84 },
  { id: 'feili', src: '/img/ending/photo-feili.png', x: 728, y: 1095, w: 264, h: 180 },
  { id: 'gear', src: '/img/ending/photo-jingpeng-gear.png', x: 555, y: 1295, w: 172, h: 218 },
];

/** 支持區塊上方的火焰圖（207×206） */
export const FIRE_SRC = '/img/ending/fire.png';
