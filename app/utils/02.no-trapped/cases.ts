// 02 無人受困的火場：台中案例右欄的素材（中英文共用）。文字在 locales/{zh,en}/section-no-trapped.json 的 cases.taichung，以 id 對應。
// 設計稿 1110 定版：右欄由上到下＝報導標題 → 剪報（active 換焦點圖）→ 空拍照 → 引述（只有 PC）→ 救災照。
import type { CaseLayout } from '~/utils/case-story';

export const CASES: CaseLayout[] = [
  {
    id: 'taichung',
    items: [
      { kind: 'heading', id: 'heading' },
      {
        kind: 'doc',
        id: 'clipping',
        src: '/img/no-trapped/pic0101.png',
        focus: '/img/no-trapped/pic0102.png',
        ratio: '808/827',
      },
      { kind: 'photo', id: 'aerial', src: '/img/no-trapped/pic0104.jpg', ratio: '800/450' },
      { kind: 'quote', id: 'quote' },
      { kind: 'photo', id: 'rescue', src: '/img/no-trapped/pic0103.jpg', ratio: '800/536' },
    ],
  },
];
