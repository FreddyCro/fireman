// 02 無人受困的火場：pin 住的圖表。一張 20 年的圖，上面一塊黑色半透明遮罩蓋住「不是在講的那 10 年」，
// 捲動過半時遮罩滑到另一半、文字跟著換。版面資料中英文共用，文案在 locales 的 chart.slides 以 id 對應。
// ⚠️ 圖表 SVG 內含中文軸標；之後英文正式稿若另出一張，再把 svg 改成依語系（如 titleSvg 的做法）。
export const CHART_SVG = '/img/no-trapped/diagram.svg';

export interface ChartSlide {
  id: 'before' | 'after';
  /** 遮罩位置（佔圖寬的 %）：left 起點、width 寬度。設計稿 620 寬的圖，遮罩 280 寬 */
  mask: { left: number; width: number };
}

export const CHART_SLIDES: ChartSlide[] = [
  // 前 10 年：遮住右半（近 10 年）
  { id: 'before', mask: { left: 50.5, width: 45 } },
  // 近 10 年：遮住左半（前 10 年）
  { id: 'after', mask: { left: 4.5, width: 45.5 } },
];

/** 跑道高度（vh）：pin 住的時間長度 */
export const CHART_TRACK_VH = 200;
/** 捲到跑道的這個比例時切到第二組 */
export const CHART_SWITCH_AT = 0.5;
