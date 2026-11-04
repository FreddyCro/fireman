// 02 無人受困的火場：案例 scrapbook 的版面（素材、位置、角度）。中英文共用，文案在 locales/{zh,en}/section-no-trapped.json，以 id 對應。
import type { CaseLayout } from '~/utils/scrapbook';

export const CASES: CaseLayout[] = [
  {
    id: 'taichung',
    aspect: { mob: '4/5', pc: '6/5' },
    media: [
      {
        id: 'clipping',
        type: 'image',
        src: '/img/scrapbook/case1/firefighter_p02_pic02_1030.png',
        ratio: '746/762',
        mob: { x: 4, y: 30, w: 70, r: -4 },
        pc: { x: 4, y: 6, w: 52, r: -4 },
      },
      {
        id: 'photo',
        type: 'image',
        src: '/img/scrapbook/case1/firefighter_p02_pic01_1030.jpg',
        ratio: '674/380',
        mob: { x: 30, y: 2, w: 66, r: 3 },
        pc: { x: 46, y: 2, w: 50, r: 3 },
      },
      {
        id: 'video',
        type: 'video',
        src: '/img/scrapbook/case1/firefighter_p02_video0103_1030.mp4',
        ratio: '16/9',
        mob: { x: 10, y: 64, w: 80, r: -2 },
        pc: { x: 30, y: 54, w: 62, r: -2 },
      },
    ],
  },
];
