// 04 人力吃緊：屏東地圖（中英文共用的版面資料），名稱以 id 對應 locales 的 pingtung.stations
// 設計稿：中文 2423:5543、2423:6234、2423:6247；英文 2464:2049、2464:3589、2464:3611
// 動畫註記：數字跳動，建國分隊從 0 跳到 18、屏東分隊從 37 減到 28、公館分隊從 20 減到 11；建國分隊字級從 23 放大到 35
// 順序照設計稿 frame 排列（第二段 28/11/18、第三段 37/20/18）

export type StationId = 'pingtung' | 'gongguan' | 'jianguo';

export const STATION_IDS: StationId[] = ['pingtung', 'gongguan', 'jianguo'];

/** 數字跳動的起點（第一段還沒顯示人數） */
export const STATION_BASE: Record<StationId, number> = { pingtung: 37, gongguan: 20, jianguo: 0 };

/** 與 locales pingtung.steps 同順序；null＝該段顯示縣全圖、不顯示人數 */
export const STATION_STEPS: (Record<StationId, number> | null)[] = [
  null,
  { pingtung: 28, gongguan: 11, jianguo: 18 },
  { pingtung: 37, gongguan: 20, jianguo: 18 },
];

/** 屏東縣、屏東市（TOWNCODE） */
export const PINGTUNG_COUNTY = '10013';
export const PINGTUNG_CITY = '10013010';

/**
 * 分隊位置（經緯度）。屏東、公館取自「各縣市消防分隊分布.xlsx」屏東縣分頁；
 * TODO 建國分隊（屏三分隊，新設）不在表內，暫用由設計稿 pic0202.svg 換算的近似值，拿到地址後替換。
 */
export const STATION_COORDS: Record<StationId, [number, number]> = {
  pingtung: [120.498502, 22.676914],
  gongguan: [120.484536, 22.638065],
  jianguo: [120.4579, 22.6668],
};

/** 地圖鏡頭：容器比例（設計稿 317×353）、邊距、zoom 時長 */
export const PINGTUNG_CAMERA = {
  aspect: 317 / 353,
  countyPad: 0.04,
  cityPad: 0.12,
  duration: 1.2,
};
