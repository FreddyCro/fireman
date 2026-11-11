// 04 人力吃緊：分隊駐點的四縣市地圖輪播（中英文共用），名稱、說明以 id 對應 locales 的 deploy.maps.regions
// 設計稿：pc 2423:5616、pad 2423:26609、mob 2423:16372；設計註記 2443:2029：用地圖 JSON 灌資料，只做屏東、新北、桃園、台中

export type RegionId = 'pingtung' | 'newTaipei' | 'taoyuan' | 'taichung';

export const REGIONS: { id: RegionId; county: string }[] = [
  { id: 'pingtung', county: '10013' },
  { id: 'newTaipei', county: '65000' },
  { id: 'taoyuan', county: '68000' },
  { id: 'taichung', county: '66000' },
];

/** 一開始置中的縣市（設計稿停在新北） */
export const REGION_START = 1;

export const MAP_ARROW = '/img/manpower/arrow-prev.svg';

/** 色階：0 → 淺、FIRE_MAX 以上 → 橘（圖例「0～160件火災通報案」） */
export const FIRE_MAX = 160;
export const FIRE_COLORS: [string, string] = ['#f5f5f5', '#ed7223'];

/**
 * TODO 資料確定後替換（POC 先留空，地圖全部顯示最淺色）：
 * FIRE_COUNTS：各鄉鎮火災通報數，key 是 TOWNCODE。來源「火災熱點縣市函數統計.xlsx」2024 年（設計註記 2443:2030）
 */
export const FIRE_COUNTS: Record<string, number> = {};

/**
 * 消防分隊據點：app/assets/data/manpower-stations.json，由「各縣市消防分隊分布.xlsx」
 * （屏東縣、新北市、桃園市、臺中市四個分頁）轉出：經緯度取 6 位小數，同一座標（大隊部與中隊同棟）只留一筆。
 * 共 216 筆：屏東 38、新北 82、桃園 42、台中 54。
 */
export { default as FIRE_STATIONS } from '~/assets/data/manpower-stations.json';
export type FireStation = { county: string; name: string; lon: number; lat: number };

/** 依通報數取顏色（線性內插） */
export function fireColor(count: number | undefined): string {
  const t = Math.min(Math.max((count ?? 0) / FIRE_MAX, 0), 1);
  const [a, b] = FIRE_COLORS.map((c) => [1, 3, 5].map((i) => Number.parseInt(c.slice(i, i + 2), 16)));
  const mix = a!.map((v, i) => Math.round(v + (b![i]! - v) * t));
  return `rgb(${mix.join(',')})`;
}
