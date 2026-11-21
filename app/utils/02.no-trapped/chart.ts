// ⚠️ 圖表 SVG 內含中文軸標；英文版若另出一張，svg 要改成依語系。
import type { PinChartLayout } from '~/utils/pin-chart';

export const CHART: PinChartLayout = {
  svg: '/img/no-trapped/diagram.svg',
  legend: [
    { id: 'fires', shape: 'line', color: '#c1a165' },
    { id: 'deaths', shape: 'bar', color: '#ed7223' },
  ],
  slides: [
    { id: 'before', mask: { left: 50.5, width: 45, bottom: 10 } },
    { id: 'after', mask: { left: 4.5, width: 45.5, bottom: 10 } },
  ],
  trackVh: 200,
  switchAt: 0.5,
};
