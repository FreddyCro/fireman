// pin 住的圖表（ui/PinChart.vue）的版面型別。中英文共用的版面（SVG、遮罩位置、圖例樣式）放各 section 的
// utils（如 utils/02.no-trapped/chart.ts），文案（標題、圖例文字）在 locales 以 slide id／legend id 對應。

export interface PinChartLegend {
  /** 對應文案 slides.<slide>.legend.<id> */
  id: string;
  /** 圖例色塊樣式：折線（短橫線）或長條（方塊） */
  shape: 'line' | 'bar';
  color: string;
}

export interface PinChartSlide {
  id: string;
  /** 黑色半透明遮罩（佔圖寬的 %）：left 起點、width 寬度，蓋住「不是在講的那段」 */
  mask: { left: number; width: number };
}

export interface PinChartLayout {
  svg: string;
  slides: PinChartSlide[];
  legend: PinChartLegend[];
  /** 跑道高度（vh）：pin 住的時間長度 */
  trackVh: number;
  /** 捲到跑道的這個比例時切到第二組 */
  switchAt: number;
}

/** 文案（locales）這側的形狀 */
export interface PinChartCopy {
  slides: Record<string, { title: string; legend: Record<string, string> }>;
  alt: string;
  note: string;
  source: string;
}
