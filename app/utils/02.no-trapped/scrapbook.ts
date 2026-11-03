// 02 無人受困的火場：scrapbook（可拖曳的剪報／照片／影片）的資料型別與放大框計算。

/** 素材在 board 上的位置：x / y / w 為 board 寬高的百分比，r 為旋轉角度（deg） */
export interface ScrapbookPlace {
  x: number;
  y: number;
  w: number;
  r: number;
}

/** 素材版面（中英文共用），id 對應文案裡的 alt */
export interface ScrapbookLayout {
  id: string;
  type: 'image' | 'video';
  src: string;
  /** CSS aspect-ratio，如 "746/762"；先佔好高度，影片載入前不會跳版 */
  ratio: string;
  mob: ScrapbookPlace;
  pc: ScrapbookPlace;
}

export interface ScrapbookItem extends ScrapbookLayout {
  alt: string;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 平板以上：放大後寬度 ＝ 原寬 ＋ 100px（設計稿規格） */
export const ZOOM_EXTRA = 100;
/** 放大框與視窗邊緣的最小距離（留給右上角關閉鈕） */
export const ZOOM_MARGIN = 24;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * 放大框位置。origin 是原素材「未旋轉」的尺寸與中心點（中心點不受旋轉影響）。
 * 寬螢幕：寬度加 ZOOM_EXTRA、原地放大，超出視窗就推回來；手機：滿版寬、置中視窗。
 * 兩者都會以視窗高度為上限等比縮回。
 */
export function zoomRect(
  origin: { cx: number; cy: number; w: number; h: number },
  viewport: { w: number; h: number },
  wide: boolean,
): Rect {
  const maxW = viewport.w - ZOOM_MARGIN * 2;
  const maxH = viewport.h - ZOOM_MARGIN * 2;
  const targetW = wide ? origin.w + ZOOM_EXTRA : maxW;
  const scale = Math.min(targetW / origin.w, maxW / origin.w, maxH / origin.h);
  const width = origin.w * scale;
  const height = origin.h * scale;

  const cx = wide ? origin.cx : viewport.w / 2;
  const cy = wide ? origin.cy : viewport.h / 2;
  return {
    left: clamp(cx - width / 2, ZOOM_MARGIN, viewport.w - ZOOM_MARGIN - width),
    top: clamp(cy - height / 2, ZOOM_MARGIN, viewport.h - ZOOM_MARGIN - height),
    width,
    height,
  };
}
