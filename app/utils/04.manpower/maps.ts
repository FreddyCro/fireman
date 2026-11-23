// 04 人力吃緊：分隊駐點的四縣市地圖輪播（中英文共用），名稱、說明以 id 對應 locales 的 deploy.maps.regions
// 設計稿：pc 2423:5616、pad 2423:26609、mob 2423:16372；設計註記 2443:2029：用地圖 JSON 灌資料，只做屏東、新北、桃園、台中
import FIRE_COUNTS_JSON from '~/assets/data/manpower-fire-counts.json';

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
 * 各鄉鎮 2024 年火災通報數，key 是 TOWNCODE：app/assets/data/manpower-fire-counts.json。
 * 由「火災熱點縣市函數統計.xlsx」（設計註記 2443:2030 的 Google 試算表）分頁「熱點縣市筆數位置」A、B 欄
 * （標註「2024年只要做這一年份」）轉出：「縣市 鄉鎮區」以 COUNTYCODE＋TOWNNAME 對應圖資（臺／台視為相同）。
 * 四縣市 104 個鄉鎮全數對上；各縣市加總與消防年報一致（屏東 1510、新北 1630、桃園 1206、臺中 1320）。
 * 只有桃園中壢區 167 件超過圖例上限 160，fireColor 會夾在最深色。
 */
export const FIRE_COUNTS: Record<string, number> = FIRE_COUNTS_JSON;

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
