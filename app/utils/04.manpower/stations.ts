// 04 人力吃緊：屏東地圖（中英文共用的版面資料），名稱以 id 對應 locales 的 pingtung.stations
// 設計稿：中文 2423:5543、2423:6234、2423:6247；英文 2464:2049、2464:3589、2464:3611
// 動畫註記：數字跳動，建國分隊從 0 跳到 18、屏東分隊從 37 減到 28、公館分隊從 20 減到 11（人數字級固定，不做放大）
// 分鏡見 PINGTUNG_BEATS（設計稿「動態分鏡」：01 → 02 連續動作 → 換文字 → 03 連續動作）

export type StationId = 'pingtung' | 'gongguan' | 'jianguo';

export const STATION_IDS: StationId[] = ['pingtung', 'gongguan', 'jianguo'];

/** 數字跳動的起點（第一段還沒顯示人數） */
export const STATION_BASE: Record<StationId, number> = { pingtung: 37, gongguan: 20, jianguo: 0 };

/**
 * 捲動分鏡（每格一段捲動）。文字段落與動畫分開：換到新段落時先只換文字，再捲一格才播人數跳動＋小圓點移動。
 * - text：顯示 locales pingtung.steps 的第幾段
 * - counts：null＝縣全圖、不顯示分隊；否則為該格的人數（數字跳動的目標）
 * - deltas：人數旁標的增減（如建國分隊(+18)）；小圓點移動中不顯示，移動結束才出現（設計稿 02、03 的中間格都沒有增減）
 * - flow：小圓點位置，'home'＝在屏東、公館（不顯示）、'jianguo'＝已移到建國
 */
export interface PingtungBeat {
  text: number;
  counts: Record<StationId, number> | null;
  deltas: Partial<Record<StationId, number>>;
  flow: 'home' | 'jianguo';
}

export const PINGTUNG_BEATS: PingtungBeat[] = [
  // 全縣總覽
  { text: 0, counts: null, deltas: {}, flow: 'home' },
  // 01：zoom 到屏東市，建國分隊維持 0 人
  { text: 1, counts: STATION_BASE, deltas: {}, flow: 'home' },
  // 02（連續動作）：小圓點從屏東、公館移到建國，人數跳動並標增減
  { text: 1, counts: { pingtung: 28, gongguan: 11, jianguo: 18 }, deltas: { pingtung: -9, gongguan: -9, jianguo: 18 }, flow: 'jianguo' },
  // 換文字，維持 02
  { text: 2, counts: { pingtung: 28, gongguan: 11, jianguo: 18 }, deltas: { pingtung: -9, gongguan: -9, jianguo: 18 }, flow: 'jianguo' },
  // 03（連續動作）：小圓點跑回屏東、公館，人數恢復（不標增減）；移動結束後建國標 +18
  { text: 2, counts: { pingtung: 37, gongguan: 20, jianguo: 18 }, deltas: { jianguo: 18 }, flow: 'home' },
];

/**
 * 移動的小圓點：屏東、公館各一條弧線到建國，每條 FLOW_DOTS 顆（一顆＝一人）。
 * bend：弧線控制點往法線方向偏移的比例（正負決定往哪邊彎）。
 * 依設計稿「動態分鏡」：屏東↔建國往上微拱、公館↔建國往左下兜一圈再進公館。
 */
export const FLOW_DOTS = 9;
export const FLOW_ROUTES: { from: StationId; bend: number }[] = [
  { from: 'pingtung', bend: 0.2 },
  { from: 'gongguan', bend: -0.45 },
];
/** 小圓點移動時長（秒），人數跳動同步 */
export const FLOW_DURATION = 1.4;

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
  cityPad: 0.005, // 設計稿屏東市形狀填滿 317×353 容器
  duration: 1.2,
};
