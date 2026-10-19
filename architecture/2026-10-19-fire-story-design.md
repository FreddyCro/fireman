# fire-story：以實際素材驗證 paper-scroll（POC）設計

日期：2026-10-19　分支：`poc/fire-story`

## 目標

把 [paper-scroll](2026-10-13-paper-scroll-design.md) 的引擎套上接近正式的素材（動畫師 C1～C4），驗證：

- C1～C3「幻燈片切換」：整張插畫交叉淡化 + zoom in 是否自然（設計稿註明待測試）。
- C4 影片跟著捲動 scrub／loop 的手感。
- 直式素材在手機與桌機的呈現。

示範頁 `/poc/fire-story`，網址加 `?debug` 開除錯面板。

## 素材

原檔在 `temp/`（不進版控），轉檔後放 `public/poc/fire-story/`，共約 5.9 MB。

| 原檔 | 轉檔 | 說明 |
|---|---|---|
| `1-1`～`3-5.png`（整張不透明、1080×1920，3-2／3-3 為 1242×2208） | WebP q90、統一 1080×1920 | 原檔共約 31 MB。q82 會吃掉顆粒質感，改用 q90 |
| `3-6.png` | 不另存 | 與 `2-2.png` 是同一張圖，設定直接引用 `2-2.webp` |
| `cut 4-1.mp4`、`cut 4-3.mp4`（H.264、30fps、3 秒、每 30 格才有 keyframe） | 720×1280、**每格都是 keyframe**（`-g 1`）、crf 24、無音軌、faststart | scrub 時每次 seek 都要從前一個 keyframe 解碼，原檔拖動會卡 |
| `cut 4-2 loop.mp4` | 720×1280、crf 24、一般 GOP | 只循環播放，不 scrub |

轉檔工具（sharp、ffmpeg-static）只在暫存目錄臨時安裝，不在專案依賴裡。正式版交件時請動畫師直接給 scrub 用的逐格 keyframe 影片，或改交 PNG 序列。

## 引擎擴充（向下相容，door-fire 不受影響）

- **`SceneConfig.fit`**：`cover`（預設）／`contain`／`smart`。`smart` 會在 cover 裁掉超過 `maxCrop`（預設 0.25）時改用 contain，所以直式素材在手機上是 cover（裁掉左右約 18%），在桌機上是置中直欄、兩側露出背景色。`SceneConfig.anchor` 決定對齊方式，預設是靠上置中。
- 繪製時一律裁到設計畫布範圍內：contain 時 zoom 放大的圖不會溢出直欄；cover 時設計畫布本來就蓋滿舞台，不受影響。
- **影片元素**：`sprite.kind = 'video'` 加上 `playback`：
  - `{ mode: 'scroll', range }`：依進度 scrub（`currentTime`），正在 seek 時就跳過這次。
  - `{ mode: 'loop' }`：看得到時播放，看不到或 `prefers-reduced-motion` 時暫停。
  - 載入時先 `play()` 再暫停，因為 iOS Safari 不播放就不會解碼第一格。
- **文字 overlay 對齊可見設計區**：composable 提供 `designRect`，overlay 只蓋在看得到的設計畫布上，並設 `container-type: size`，所以文字可以用 `cqw`／`cqh` 跟著手機滿版或桌機直欄縮放。

## 分鏡（跑道 1800vh，背景全黑）

每張幻燈片疊在上一張上面淡入，被下一張完全蓋住後就隱藏（省繪製）。實際數值見 `scenes/fire-story.ts`。

| 進度 | 畫面 | 文字 |
|---|---|---|
| 0 → 0.12 | 1-1 → 1-2 → 1-3，極緩慢推近 | 0.105 起出現日期 + 事件描述 |
| 0.19 → 0.42 | 2-1 淡入並 zoom 1.06 → 1.6，2-2 淡入繼續推近 | |
| 0.37 → 0.62 | 3-1 → 3-5，每張由略大縮回 1（人物越走越遠） | 0.60 起出現「然而最後，他沒能再走出來。」 |
| 0.67 → 0.75 | 3-6（同 2-2） | |
| 0.72 → 0.81 | 4-1 scrub（滿版火收成一團火） | 說明文字 |
| 0.80 → 0.87 | 4-2 loop | 27名 救災殉職的消防員 |
| 0.86 → 0.95 | 4-3 scrub（火團熄滅） | |
| 0.915 → 1 | 黑底 | 4-5 文字 → 標題「消防員之死」，退場是模糊、放大、字距拉開 |

## 尚未處理（等動畫師交件或之後再決定）

- C1～C3「疊加 loop 材質」（透明 PNG 序列）：還沒交件，這版只測幻燈片切換。
- 4-7 標題粉末化（參考兔子洞開頭 9 秒）：目前是 CSS 佔位效果，也還沒做英文版。
- 4-2 火團造型待調整。
- 真機（iOS／Android）尚未驗證，特別是影片 scrub 和 iOS 的自動播放。

## 驗證

- `pnpm test`：`fitTransform`、`visibleDesignRect`、`scrubTime`，以及素材是否存在、關鍵幀與文字區間是否合法。
- 桌機 Edge，390×844 與 1440×900 兩種尺寸，從頭捲到尾截圖：分鏡順序、直欄、影片 scrub、文字位置都正確，console 沒有錯誤；載入失敗的只有 udn 的追蹤腳本，和本頁無關。
