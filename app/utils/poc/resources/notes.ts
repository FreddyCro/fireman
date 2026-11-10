/**
 * resources 頁的人工註記：自動檢查（manifest.ts）看不出來、需要人判斷的疑慮。
 * 確認後把該筆刪掉；素材改名時 key 要跟著改。
 */

/** 全域疑慮（不屬於單一素材） */
export const GENERAL_NOTES: string[] = [
  '1106 交件：本專案沒有多語系切換，_en 英文版素材的用途待確認（目前全部保留）。',
  '1106 交件：全部素材都沒有 WebP 與 @2x，UPic 目前以 :webp="false" :use2x="false" 使用。要不要轉檔待決定。',
  '1106 交件：padmob（平板＋手機共用）UPic 不支援，已複製成 _pad 與 _mob 兩份（兩份內容相同）。',
  '1106 交件：PAD/ 夾了一份 p03_number0102_mob，與 MOB/ 的完全相同，已略過。',
  '1106 交件：三個按鈕的後綴拼成 pacpadmob、也沒有日期，已視為三尺寸共用。',
  'hero/ 的 1-1.webp、3-6.mp4 等是捲動動畫 POC 用素材，不在 1106 交件內。',
  'scrapbook/ 是 1030 交件的 POC 素材，仍是設計端原檔名（未正規化），影片 3.9–22.9 MB。',
  '1110 插畫初稿：story1-1～7-3 判斷為 hero「消防員之死」分鏡，放在 hero/，檔名保留描述字（loop、walk…）。尚未接進 utils/01.hero/scene.ts（目前仍用 1-1.webp 等 POC 素材）。',
  '1110 插畫初稿：story5-4 與 5-2、5-5 與 5-1 三個裝置版都完全相同（開門再關門？）。若是刻意重用，可以只留一份、在 scene.ts 重複引用。',
  '1110 插畫初稿：PAD/、MOB/ 各有一份 story5-4「 (1)」副本，與正本相同，已略過。',
  '1110 插畫初稿：PC 版多張超過 1 MB（story1、2、3 系列），交付正式稿時需壓縮或轉 WebP。',
];

/** 單一素材的疑慮，key ＝ AssetEntry.src */
export const ITEM_NOTES: Record<string, string[]> = {
  '/img/no-trapped/_review/firefighter_p02_pic0201_pc1106': [
    '和 no-trapped/pic0201.jpg（pcpadmob 版）內容不同。這是 PC 專用版，還是舊版可以刪？',
    '若是 PC 專用版：改名 pic0201_pc.jpg，原 pic0201.jpg 改成 _pad 與 _mob。',
  ],
  '/img/violation/_review/firefighter_p03_pic0105a_pcpad1106 (1)': [
    '檔名帶「 (1)」，和 violation/pic0105a.jpg（pcpadmob 版）內容不同。',
    '推測是 pcpad 版：若是，改名 pic0105a_pcpad.jpg，原 pic0105a.jpg 改成 pic0105a_mob.jpg。',
  ],
  '/img/violation/pic0103b': ['只有 pcpad 版。手機版是不顯示這張，還是漏交？'],
  '/img/violation/pic0205_en': ['只有手機的英文版。PC／平板要沿用中文版 pic0205.jpg，還是漏交？'],
  '/img/manpower/title0101': ['中文版缺 mob（英文版有），請設計師補。'],
  '/img/manpower/pic0410': ['缺 mob 版（0401–0409 都有）。'],
  '/img/manpower/pic0411': ['缺 mob 版（0401–0409 都有）。'],
  '/img/manpower/pic0412': ['缺 mob 版（0401–0409 都有）。'],
  '/img/no-trapped/title0101': ['_pad 與 _mob 由同一個 padmob 檔複製。'],
  '/img/violation/title0101': ['_pad 與 _mob 由同一個 padmob 檔複製。'],
  '/img/manpower/pic0301': ['_pad 與 _mob 由同一個 padmob 檔複製。'],
  '/img/manpower/pic0302': ['_pad 與 _mob 由同一個 padmob 檔複製。'],
  '/img/hero/story4-2_walk': [
    'pc、pad 是 jpg，mob 卻是 png（另列一組）。UPic 一組只能一種格式，請設計師改交 jpg，或由工程轉檔。',
  ],
  '/img/hero/story5-6_opendoor': ['缺 pc 版（只有 pad、mob）。'],
  '/img/hero/story6-2_run': ['pc 版日期是 1106（其他都是 1110），可能是舊版。'],
};
