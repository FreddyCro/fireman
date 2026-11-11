---
name: figma-section-map
description: Figma 設計稿（file p0bgDrJ8C8zTHZJVx5ds3s）CH/EN 各斷點主欄與 5 個 section 的節點對照、跨語系比對錨點
metadata:
  type: reference
---

Figma 檔 `p0bgDrJ8C8zTHZJVx5ds3s`。定版頁：CH `2423:4916`、EN `2464:1095`（其他頁是舊稿，不要用）。
完整對照表在 `temp/figma-sections.md`（temp/ 不進版控，遺失就重跑 get_metadata 再產生）。

主欄 frame（由上到下＝頁面順序，主欄外的 frame 是切圖或標註）：
- CH：pc `2423:4972`、pad `2423:25903`、mob `2423:15657`
- EN：pc `2464:1099`、pad `2464:15260`、mob `2464:13616`

跨語系比對同一 section 時，靠錨點，不靠 frame 名稱：
- Hero：封面圖 → `title_PC/Mob TW 2`
- NoTrapped：intro 大標「10年27人殉職火場…」/ EN「27 Firefighters Dead in…」
- Violation／Manpower：章節標題（CH 是 vector，名稱＝中文標題；EN 是 `2484:*` text frame）
- Ending：大火照片 `firefighter_p04_pic0401`＋拼貼，到「用你的方式支持聯合報」。pc/pad 的 Ending 巢狀在 Manpower 最後一個 frame 裡；mob 則是獨立 frame。

get_metadata 對整頁輸出 >1.5M 字元，必須寫入檔案再用 node 解析（這台沒有 python）。
