// 02 無人受困的火場：各案例 scrapbook 的版面（素材、位置、角度）。中英文共用，文案在 locales/{zh,en}/section-no-trapped.json，以 id 對應。
import type { ScrapbookLayout } from './scrapbook';

export interface CaseLayout {
  id: 'taichung' | 'pingtung' | 'taoyuan';
  /** board 的 CSS aspect-ratio */
  aspect: { mob: string; pc: string };
  media: ScrapbookLayout[];
}

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
  {
    id: 'pingtung',
    aspect: { mob: '4/5', pc: '6/5' },
    media: [
      {
        id: 'video',
        type: 'video',
        src: '/img/scrapbook/case2/firefighter_p03_video0103_1030.mp4',
        ratio: '3/2',
        mob: { x: 40, y: 0, w: 58, r: 2 },
        pc: { x: 52, y: 0, w: 46, r: 2 },
      },
      {
        id: 'report',
        type: 'image',
        src: '/img/scrapbook/case2/firefighter_p03_pic0102_1030.png',
        ratio: '1377/504',
        mob: { x: 2, y: 24, w: 92, r: -3 },
        pc: { x: 4, y: 30, w: 72, r: -3 },
      },
      {
        id: 'photo',
        type: 'image',
        src: '/img/scrapbook/case2/firefighter_p03_pic0101_1030.jpg',
        ratio: '909/618',
        mob: { x: 8, y: 52, w: 84, r: 2 },
        pc: { x: 30, y: 52, w: 58, r: 2 },
      },
    ],
  },
  {
    id: 'taoyuan',
    aspect: { mob: '2/3', pc: '6/5' },
    media: [
      {
        id: 'video',
        type: 'video',
        src: '/img/scrapbook/case3/firefighter_p03_video0204_1030.mp4',
        ratio: '16/9',
        mob: { x: 10, y: 0, w: 72, r: -2 },
        pc: { x: 56, y: 52, w: 42, r: 3 },
      },
      {
        id: 'report',
        type: 'image',
        src: '/img/scrapbook/case3/firefighter_p03_pic0201_1030.png',
        ratio: '904/550',
        mob: { x: 2, y: 20, w: 94, r: 2 },
        pc: { x: 2, y: 0, w: 62, r: -2 },
      },
      {
        id: 'ducts',
        type: 'image',
        src: '/img/scrapbook/case3/firefighter_p03_pic0202_1030.jpg',
        ratio: '550/767',
        mob: { x: 52, y: 56, w: 44, r: 3 },
        pc: { x: 0, y: 44, w: 32, r: 2 },
      },
      {
        id: 'photo',
        type: 'image',
        src: '/img/scrapbook/case3/firefighter_p03_pic0203_1030.jpg',
        ratio: '410/610',
        mob: { x: 6, y: 60, w: 40, r: -4 },
        pc: { x: 34, y: 42, w: 28, r: -4 },
      },
    ],
  },
];
