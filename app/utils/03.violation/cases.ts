// 03 工安違法事實：屏東明揚、桃園敬鵬案例右欄的素材（中英文共用）。文字在 locales/{zh,en}/section-violation.json 的 cases.<id>，以 id 對應。
// 設計稿 1110 定版。檔名對應注意：pic0106a 的焦點圖是 pic0105b；pic0105a 的焦點圖是 pic0105a-focus_pcpad。
import type { CaseLayout } from '~/utils/case-story';

export const CASES: CaseLayout[] = [
  {
    // 報告標題 → 報告（主要成因）→ 倉庫堆放情境圖（a→b→c＋溫度計）→ 報告（安全資料表）→ 報告（隱匿超量存放）
    id: 'pingtung',
    items: [
      { kind: 'heading', id: 'heading' },
      {
        kind: 'doc',
        id: 'cause',
        src: '/img/violation/pic0103.jpg',
        focus: '/img/violation/pic0103b_pcpad.jpg',
        focusPcPadOnly: true,
        ratio: '800/634',
      },
      {
        kind: 'steps',
        id: 'storage',
        srcs: ['/img/violation/pic0104a.jpg', '/img/violation/pic0104b.jpg', '/img/violation/pic0104c.jpg'],
        ratio: '626/506',
        thermometer: [
          [64, 100],
          [0, 64],
          [0, 19],
        ],
      },
      {
        kind: 'doc',
        id: 'sds',
        src: '/img/violation/pic0105a.jpg',
        focus: '/img/violation/pic0105a-focus_pcpad.jpg',
        focusPcPadOnly: true,
        ratio: '800/774',
      },
      {
        kind: 'doc',
        id: 'conceal',
        src: '/img/violation/pic0106a.jpg',
        focus: '/img/violation/pic0105b.jpg',
        ratio: '800/624',
      },
    ],
  },
  {
    // 報告標題 → 報告（防火區劃破壞）→ 延燒路徑圖（正常 a → 破壞後 b）→ 風管照（疊字＋箭頭）→ 廠房照（疊字＋箭頭）
    id: 'taoyuan',
    items: [
      { kind: 'heading', id: 'heading' },
      {
        kind: 'doc',
        id: 'report',
        src: '/img/violation/pic0202a.jpg',
        focus: '/img/violation/pic0202b.jpg',
        ratio: '800/904',
      },
      {
        kind: 'steps',
        id: 'spread',
        srcs: ['/img/violation/pic0203a.jpg', '/img/violation/pic0203b.jpg'],
        ratio: '724/828',
      },
      {
        kind: 'photo',
        id: 'ducts',
        src: '/img/violation/pic0204.jpg',
        ratio: '800/1192',
        // 設計稿（400×596）：字在 (108, 228)，向上箭頭 (164, 166) 68 寬、向下箭頭 (204, 263) 71 寬
        overlayText: { x: 27, y: 38.3 },
        arrows: [
          { src: '/img/violation/arrow0204wup.svg', x: 41, y: 27.9, w: 17 },
          { src: '/img/violation/arrow0204wdown.svg', x: 51, y: 44.1, w: 17.75 },
        ],
      },
      {
        kind: 'photo',
        id: 'outside',
        src: '/img/violation/pic0205.jpg',
        ratio: '800/1092',
        // 設計稿（400×546）：深色字置中於 x 170、上緣 17、寬 280；箭頭 (66, 42) 107 寬
        overlayText: { x: 42.5, y: 3.1, w: 70, center: true, dark: true },
        arrows: [{ src: '/img/violation/arrow0205b.svg', x: 16.5, y: 7.7, w: 26.75 }],
      },
    ],
  },
];
