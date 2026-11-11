// 04 人力吃緊：屏東地圖（中英文共用的版面資料），名稱以 id 對應 locales 的 pingtung.stations
// 設計稿：中文 2423:5543、2423:6234、2423:6247；英文 2464:2049、2464:3589、2464:3611
// 動畫註記：數字跳動，建國分隊從 0 跳到 18、屏東分隊從 37 減到 28、公館分隊從 20 減到 11；建國分隊字級從 23 放大到 35
// 順序照設計稿 frame 排列（第二段 28/11/18、第三段 37/20/18）

export type StationId = 'pingtung' | 'gongguan' | 'jianguo';

export const STATION_IDS: StationId[] = ['pingtung', 'gongguan', 'jianguo'];

/** 數字跳動的起點（第一段還沒顯示人數） */
export const STATION_BASE: Record<StationId, number> = { pingtung: 37, gongguan: 20, jianguo: 0 };

/** 與 locales pingtung.steps 同順序；null＝該段顯示縣市地圖、不顯示人數 */
export const STATION_STEPS: (Record<StationId, number> | null)[] = [
  null,
  { pingtung: 28, gongguan: 11, jianguo: 18 },
  { pingtung: 37, gongguan: 20, jianguo: 18 },
];

/** 縣市地圖（第一段）與屏東市分隊地圖（第二、三段），三載具共用 SVG 等比縮放 */
export const PINGTUNG_MAPS = {
  county: { src: '/img/manpower/pic0201.svg', width: 213, height: 355 },
  city: { src: '/img/manpower/pic0202.svg', width: 318, height: 355 },
};

/** 分隊標籤在 city 地圖上的位置（左上角，% of 318×355；設計稿標籤框 77×74） */
export const STATION_POS: Record<StationId, { left: number; top: number }> = {
  pingtung: { left: 54.4, top: 10.7 },
  gongguan: { left: 41.8, top: 49.6 },
  jianguo: { left: 12.6, top: 25.9 },
};
