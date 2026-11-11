// 04 人力吃緊：載入台灣鄉鎮市區界 TopoJSON，轉成投影後的 SVG path。
// 圖資：app/assets/data/tw-towns-full.json（取自 livable-city sources/tw-towns-full.json，內政部國土測繪中心鄉鎮市區界線簡化版）。
// POC 階段先放完整台灣；資料確定後改成 build 時只留屏東、新北、桃園、台中並預先投影（temp/manpower-map-data-plan.md）。
// 只在瀏覽器載入（onMounted），動態 import 讓 500 KB 的圖資獨立成一包、不進主程式；SSR 時地圖是空的。
import type { Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';
import { bboxOf, pathOf } from '~/utils/04.manpower/geo';
import type { Bbox } from '~/utils/04.manpower/geo';

export interface TownShape {
  code: string;
  county: string;
  name: string;
  nameEn: string;
  d: string;
  bbox: Bbox;
  geometry: Geometry;
}

let cache: Promise<TownShape[]> | null = null;

async function load(): Promise<TownShape[]> {
  const [{ feature }, mod] = await Promise.all([
    import('topojson-client'),
    import('~/assets/data/tw-towns-full.json'),
  ]);
  const topo = mod.default as unknown as Topology;
  const fc = feature(topo, topo.objects.towns!) as unknown as GeoJSON.FeatureCollection<Geometry>;
  return fc.features.map((f) => {
    const p = f.properties as Record<string, string>;
    return {
      code: p.TOWNCODE!,
      county: p.COUNTYCODE!,
      name: p.TOWNNAME!,
      nameEn: p.TOWNENG!,
      d: pathOf(f.geometry),
      bbox: bboxOf([f.geometry]),
      geometry: f.geometry,
    };
  });
}

/** 取指定縣市的鄉鎮（掛載後才有值） */
export function useTaiwanTowns(countyCodes: string[]) {
  const towns = shallowRef<TownShape[]>([]);
  onMounted(async () => {
    cache ??= load();
    const all = await cache;
    towns.value = all.filter((t) => countyCodes.includes(t.county));
  });
  return towns;
}

/** 多個鄉鎮合起來的 bbox */
export function townsBbox(towns: TownShape[]): Bbox {
  return towns.reduce<Bbox>(
    (b, t) => [Math.min(b[0], t.bbox[0]), Math.min(b[1], t.bbox[1]), Math.max(b[2], t.bbox[2]), Math.max(b[3], t.bbox[3])],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
}
