// 04 人力吃緊：分隊駐點的四縣市地圖輪播（中英文共用），名稱、說明以 id 對應 locales 的 deploy.maps.regions
// 設計稿：pc 2423:5616、pad 2423:26609、mob 2423:16372
// 圖是設計稿的暫用圖（0929-PT01～TC04）；正式版改用地圖 JSON 灌火災熱點與分隊據點資料（設計註記 2443:2029）

export type RegionId = 'pingtung' | 'newTaipei' | 'taoyuan' | 'taichung';

export const REGIONS: { id: RegionId; src: string; width: number; height: number }[] = [
  { id: 'pingtung', src: '/img/manpower/map-pingtung.jpg', width: 550, height: 803 },
  { id: 'newTaipei', src: '/img/manpower/map-new-taipei.jpg', width: 795, height: 751 },
  { id: 'taoyuan', src: '/img/manpower/map-taoyuan.jpg', width: 740, height: 791 },
  { id: 'taichung', src: '/img/manpower/map-taichung.jpg', width: 781, height: 585 },
];

/** 一開始置中的縣市（設計稿停在新北） */
export const REGION_START = 1;

export const MAP_ARROW = '/img/manpower/arrow-prev.svg';
