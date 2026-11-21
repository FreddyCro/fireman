// ⚠️ 圖表 SVG 內含中文軸標；英文版若另出一張，svg 要改成依語系。
import type { PinChartLayout } from '~/utils/pin-chart';

export const CHART: PinChartLayout = {
  svg: '/img/violation/diagram.svg',
  legend: [
    { id: 'factory', shape: 'bar', color: '#ed7223' },
    { id: 'warehouse', shape: 'bar', color: '#c1a165' },
  ],
  slides: [
    { id: 'before', mask: { left: 50.3, width: 49.7, bottom: 12 } },
    { id: 'after', mask: { left: 7.5, width: 42.5, bottom: 12 } },
  ],
  trackVh: 200,
  switchAt: 0.5,
};
