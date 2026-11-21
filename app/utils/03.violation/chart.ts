// 03 工安違法事實：pin 住的圖表（ui/PinChart.vue）的版面。工廠／倉庫火災件數 2004–2025，
// 先講前 10 年（2004–2013，遮右邊），再換近 10 年（2014–2025，遮左邊）；設計師回饋 FEEDBACK_1 section 3-9；遮罩蓋住不是在講的那段。
// 文案在 locales 的 chart.slides 以 id 對應。
// ⚠️ 圖表 SVG 內含中文軸標；之後英文正式稿若另出一張，再把 svg 改成依語系。
import type { PinChartLayout } from '~/utils/pin-chart';

export const CHART: PinChartLayout = {
  svg: '/img/violation/diagram.svg',
  legend: [
    { id: 'factory', shape: 'bar', color: '#ed7223' },
    { id: 'warehouse', shape: 'bar', color: '#c1a165' },
  ],
  slides: [
    // 遮罩只蓋到 x 軸（圖高 393，軸在 346 → 離底 12%），年份標籤不遮
    // 前 10 年：遮住 2014 之後（圖寬 620，2014 的長條從 50% 起到右緣）
    { id: 'before', mask: { left: 50.3, width: 49.7, bottom: 12 } },
    // 近 10 年：遮住 2004–2013（y 軸刻度之後起算）
    { id: 'after', mask: { left: 7.5, width: 42.5, bottom: 12 } },
  ],
  trackVh: 200,
  switchAt: 0.5,
};
