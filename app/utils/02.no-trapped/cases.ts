// 02 無人受困的火場：案例 scrapbook 的版面（素材、位置、角度）。中英文共用，文案在 locales/{zh,en}/section-no-trapped.json，以 id 對應。
import type { CaseLayout } from '~/utils/scrapbook';

// 淡入順序照 mob 稿：影片 → 照片 → 剪報
export const CASES: CaseLayout[] = [
  {
    id: 'taichung',
    // mob 稿：board 362×665，剪報在上、影片中右、照片在下；pad 稿：board 652×575，文字在上、素材在下
    aspect: { mob: '362/665', pad: '652/575', pc: '6/5' },
    media: [
      {
        id: 'clipping',
        type: 'image',
        src: '/img/scrapbook/case1/firefighter_p02_pic02_1030.png',
        ratio: '746/762',
        mob: { x: 0, y: 0, w: 85, r: -2 },
        pad: { x: 2, y: 11, w: 51, r: -4 },
        pc: { x: 4, y: 6, w: 52, r: -4 },
        reveal: 2,
      },
      {
        id: 'photo',
        type: 'image',
        src: '/img/scrapbook/case1/firefighter_p02_pic01_1030.jpg',
        ratio: '674/380',
        mob: { x: 1, y: 70, w: 97, r: 2 },
        pad: { x: 35, y: 24, w: 64, r: 3 },
        pc: { x: 46, y: 2, w: 50, r: 3 },
        reveal: 1,
      },
      {
        id: 'video',
        type: 'video',
        src: '/img/scrapbook/case1/firefighter_p02_video0103_1030.mp4',
        ratio: '16/9',
        mob: { x: 20, y: 46, w: 80, r: -1 },
        pad: { x: 25, y: 64, w: 53, r: -2 },
        pc: { x: 30, y: 54, w: 62, r: -2 },
        reveal: 0,
      },
    ],
  },
];
