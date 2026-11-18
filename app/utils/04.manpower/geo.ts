// 04 人力吃緊的地圖投影工具（屏東地圖 zoom in、四縣市地圖共用）。
// 投影：經度 × cos(23.7°) 的等距圓柱投影（同 livable-city 的 buildTownThumb），台灣範圍內與 Mercator 差異可忽略，
// 不需要 d3-geo。單位：1 度 ＝ 1000，Y 軸向下（SVG 座標）。
import type { Geometry, Position } from 'geojson';

const K = Math.cos((23.7 * Math.PI) / 180);
const UNIT = 1000;

/** [x0, y0, x1, y1]，投影後座標 */
export type Bbox = [number, number, number, number];
export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const project = (lon: number, lat: number): [number, number] => [lon * K * UNIT, -lat * UNIT];

/** Polygon / MultiPolygon 的所有環 */
export function rings(g: Geometry): Position[][] {
  if (g.type === 'Polygon') return g.coordinates;
  if (g.type === 'MultiPolygon') return g.coordinates.flat();
  return [];
}

/** 轉成 SVG path（座標取小數 1 位） */
export function pathOf(g: Geometry): string {
  return rings(g)
    .map(
      (ring) =>
        ring
          .map(([lon, lat], i) => {
            const [x, y] = project(lon!, lat!);
            return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join('') + 'Z',
    )
    .join('');
}

export function bboxOf(gs: Geometry[]): Bbox {
  const b: Bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const g of gs) {
    for (const ring of rings(g)) {
      for (const [lon, lat] of ring) {
        const [x, y] = project(lon!, lat!);
        if (x < b[0]) b[0] = x;
        if (y < b[1]) b[1] = y;
        if (x > b[2]) b[2] = x;
        if (y > b[3]) b[3] = y;
      }
    }
  }
  return b;
}

/** bbox 加邊距（pad＝較長邊的比例）；給 aspect（寬/高）時再撐成該比例，讓 viewBox 剛好填滿容器 */
export function fitBox(b: Bbox, pad = 0.05, aspect?: number): ViewBox {
  let w = b[2] - b[0];
  let h = b[3] - b[1];
  const m = Math.max(w, h) * pad;
  let x = b[0] - m;
  let y = b[1] - m;
  w += m * 2;
  h += m * 2;
  if (aspect) {
    if (w / h < aspect) {
      const nw = h * aspect;
      x -= (nw - w) / 2;
      w = nw;
    } else {
      const nh = w / aspect;
      y -= (nh - h) / 2;
      h = nh;
    }
  }
  return { x, y, w, h };
}

export const viewBoxStr = (v: ViewBox) => `${v.x} ${v.y} ${v.w} ${v.h}`;

/** 投影點在 viewBox 內的位置（%），給 HTML 標籤定位用 */
export const toPct = (v: ViewBox, [x, y]: [number, number]) => ({
  left: `${((x - v.x) / v.w) * 100}%`,
  top: `${((y - v.y) / v.h) * 100}%`,
});
