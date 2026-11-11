// 04 人力吃緊：各國消防員服務比（中英文共用），國名與來源名稱以 id 對應 locales 的 staffing.chart
// 設計稿：中文 2423:6573～2423:10049；英文 2477:7211～2464:7372

export type CountryId = 'jp' | 'kr' | 'us' | 'sg' | 'tw';

/** 每位消防員平均服務人口（人），依長條圖順序 */
export const COUNTRIES: { id: CountryId; perFirefighter: number; highlight?: boolean }[] = [
  { id: 'jp', perFirefighter: 724 },
  { id: 'kr', perFirefighter: 766 },
  { id: 'us', perFirefighter: 926 },
  { id: 'sg', perFirefighter: 933 },
  { id: 'tw', perFirefighter: 1280, highlight: true },
];

/** 第三個狀態的兩兩比較（設計稿標示 +77%） */
export const COMPARE: { from: CountryId; to: CountryId } = { from: 'jp', to: 'tw' };

export type SourceId = 'nfa' | 'nafr' | 'hk' | 'jp' | 'kr' | 'us' | 'sg';

/** 資料來源，依顯示順序；href 空字串＝不加連結 */
export const SOURCES: { id: SourceId; href: string }[] = [
  { id: 'nfa', href: '' },
  { id: 'nafr', href: '' },
  { id: 'hk', href: 'https://www.hkfsd.gov.hk/chi/fsd_info/publications/review/review_24.html' },
  { id: 'jp', href: 'https://www.fdma.go.jp/publication/hakusho/r7/69377.html' },
  { id: 'kr', href: 'https://www.pennmike.com/news/articleView.html?idxno=96213' },
  { id: 'us', href: 'https://apps.usfa.fema.gov/registry/summary' },
  { id: 'sg', href: 'https://www.scdf.gov.sg/home/about-scdf/our-organisation/departments-and-units' },
];
