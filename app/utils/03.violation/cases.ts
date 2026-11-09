// 03 工安違法事實：屏東明揚、桃園敬鵬案例 scrapbook 的版面（素材、位置、角度）。中英文共用，文案在 locales/{zh,en}/section-violation.json，以 id 對應。
import type { CaseLayout } from '~/utils/scrapbook';

export const CASES: CaseLayout[] = [
  {
    id: 'pingtung',
    // pad 稿：board 與文字欄同寬 530、高 610，影片→剪報→照片由上往下疊
    // mob 稿：board 362×605，影片左上、報告書中、照片下
    aspect: { mob: '362/605', pad: '530/610', pc: '6/5' },
    padWidth: 530,
    media: [
      {
        id: 'video',
        type: 'video',
        src: '/img/scrapbook/case2/firefighter_p03_video0103_1030.mp4',
        ratio: '3/2',
        mob: { x: 1, y: 3, w: 76, r: -5 },
        pad: { x: 0, y: 2, w: 54, r: 2 },
        pc: { x: 52, y: 0, w: 46, r: 2 },
      },
      {
        id: 'report',
        type: 'image',
        src: '/img/scrapbook/case2/firefighter_p03_pic0102_1030.png',
        ratio: '1377/504',
        mob: { x: 0, y: 31, w: 98, r: 2 },
        pad: { x: 14, y: 25, w: 84, r: -3 },
        pc: { x: 4, y: 30, w: 72, r: -3 },
      },
      {
        id: 'photo',
        type: 'image',
        src: '/img/scrapbook/case2/firefighter_p03_pic0101_1030.jpg',
        ratio: '909/618',
        mob: { x: 2, y: 57, w: 94, r: -1 },
        pad: { x: 15, y: 49, w: 85, r: 2 },
        pc: { x: 30, y: 52, w: 58, r: 2 },
      },
    ],
  },
  {
    id: 'taoyuan',
    // pad 稿：board 530×560，影片左上、剪報中、pic0202（廠房）右下、pic0203（風管）左下
    // mob 稿：board 362×762，影片上、報告書、廠房照右、風管照左下
    aspect: { mob: '362/762', pad: '530/560', pc: '6/5' },
    padWidth: 530,
    media: [
      {
        id: 'video',
        type: 'video',
        src: '/img/scrapbook/case3/firefighter_p03_video0204_1030.mp4',
        ratio: '16/9',
        mob: { x: 25, y: 0, w: 50, r: -1 },
        pad: { x: 0, y: 2, w: 34, r: -2 },
        pc: { x: 56, y: 52, w: 42, r: 3 },
      },
      {
        id: 'report',
        type: 'image',
        src: '/img/scrapbook/case3/firefighter_p03_pic0201_1030.png',
        ratio: '904/550',
        mob: { x: 1, y: 13, w: 97, r: 4 },
        pad: { x: 23, y: 20, w: 76, r: -3 },
        pc: { x: 2, y: 0, w: 62, r: -2 },
      },
      {
        id: 'ducts',
        type: 'image',
        src: '/img/scrapbook/case3/firefighter_p03_pic0202_1030.jpg',
        ratio: '550/767',
        mob: { x: 36, y: 44, w: 64, r: -1 },
        pad: { x: 55, y: 36, w: 45, r: -3 },
        pc: { x: 0, y: 44, w: 32, r: 2 },
      },
      {
        id: 'photo',
        type: 'image',
        src: '/img/scrapbook/case3/firefighter_p03_pic0203_1030.jpg',
        ratio: '410/610',
        mob: { x: 10, y: 63, w: 52, r: 3 },
        pad: { x: 4, y: 50, w: 36, r: 2 },
        pc: { x: 34, y: 42, w: 28, r: -4 },
      },
    ],
  },
];
