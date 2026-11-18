// 02 無人受困的火場：pin 住的圖表（ui/PinChart.vue）的版面。一張 20 年的圖，黑色半透明遮罩蓋住
// 「不是在講的那 10 年」，捲動過半時遮罩換到另一半、文字跟著換。文案在 locales 的 chart.slides 以 id 對應。
// ⚠️ 圖表 SVG 內含中文軸標；之後英文正式稿若另出一張，再把 svg 改成依語系（如 titleSvg 的做法）。
import type { PinChartLayout } from '~/utils/pin-chart';

export const CHART: PinChartLayout = {
  svg: '/img/no-trapped/diagram.svg',
  legend: [
    { id: 'fires', shape: 'line', color: '#c1a165' },
    { id: 'deaths', shape: 'bar', color: '#ed7223' },
  ],
  slides: [
    // 前 10 年：遮住右半（近 10 年）。設計稿 620 寬的圖，遮罩 280 寬
    { id: 'before', mask: { left: 50.5, width: 45 } },
    // 近 10 年：遮住左半（前 10 年）
    { id: 'after', mask: { left: 4.5, width: 45.5 } },
  ],
  trackVh: 200,
  switchAt: 0.5,
};
