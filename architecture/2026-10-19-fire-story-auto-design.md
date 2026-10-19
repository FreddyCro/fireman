# fire-story-auto：C4 影片「捲到定點自動播放、播完接下一段」設計

日期：2026-10-19　接續 [2026-10-19-fire-story-design.md](2026-10-19-fire-story-design.md)

## 目標

設計師要比較 C4 的兩種呈現：
- **A 版 `/poc/fire-story`**：4-1、4-3 跟著捲動 scrub（現況，不動）。
- **B 版 `/poc/fire-story-auto`**：捲到定點時影片自動原速播放，播完自動接下一個分鏡。

兩版共用 C1～C3、文案、素材與頁面模板，只有 C4 的設定和幾處文字的顯示條件不同。

## 核心問題：時間與捲動怎麼共存

引擎現在所有畫面都是捲動進度 `p` 的函數。B 版加入「時間」這個第二個輸入，必須定義清楚，否則會出現「停在原地畫面自己換、往回捲一點又換回來」。

**做法：以捲動分區，區內以時間分段。** 不鎖捲動、不自動捲頁。

| 區 | 進入條件 | 進區時 | 影片播完後 |
|---|---|---|---|
| 區 0 | `p ≥ 0.75`（4-1 淡入完成處） | 4-1 從頭原速播放 | 交叉淡化到 4-2 開始 loop |
| 區 1 | `p ≥ 0.86` | 4-3 從頭原速播放，4-2 交叉淡出 | 淡到黑底 |

規則：
1. **正向進區 → 該區影片從 0 播放**。包含重新整理後直接落在區 1、或一次跳過區 0。
2. **反向退回某區 → 直接顯示該區「播完後」的狀態**（不重播），且不做交叉淡化。
3. **退到第一個觸發點以下 → 全部重置**，回到純關鍵幀畫面（3-6）。
4. **`prefers-reduced-motion`** → 進區直接顯示播完後的狀態。

狀態 = `(p 所在的區, 子狀態 playing／ended, 進入子狀態的時刻)`，是純函式，可單元測試。

## 引擎擴充（向下相容；door-fire、A 版不受影響）

- `PlaybackConfig` 加 `{ mode: 'trigger' }`：影片不自己 scrub／loop，由序列控制 `play()` 與重置；`syncVideo` 對這種模式不動作。
- `SceneConfig.sequence?: { steps: { trigger, play, then? }[], fade?: ms }`，`steps` 依 `trigger` 遞增；`fade` 預設 400。
- 新檔 `sequence.ts`（純函式）：
  - `stepFor(steps, p)`：目前所在區（`-1` = 尚未進入）。
  - `advanceSequence(prev, cfg, { p, now, ended, reduceMotion })` → `{ state, events }`；`events` 是 `play`／`reset` 指令，由 `PaperScene` 套到影片元素。
  - `sequenceOpacities(cfg, state, now)` → 成員元素的 opacity 覆寫：
    - 尚未進區（`-1`）：不覆寫，成員走自己的關鍵幀（所以 4-1 仍用關鍵幀從 3-6 淡入）。
    - 目前區 playing：`play` = 1、`then` = 0；前一區的 `then` 在 `fade` 內由 1 淡到 0。
    - 目前區 ended：`play` 由 1 淡到 0、`then` 由 0 淡到 1；沒有 `then` 就淡到背景。
    - 之後的區：全部 0。更早的區：全部 0。
- `TickInput` 加 `nowMs`；`PaperScene.update` 先推進序列、套用 events、再把 opacity 覆寫進繪製狀態。`PaperScene.sequence` 給外部讀狀態。
- composable 多回傳 `sequence` ref（只在區或子狀態改變時更新，避免 60Hz 重繪）；`PocPaperStage` 的 slot 多給 `sequence`。

## 場景與頁面

- `scenes/fire-story.ts` 改成 `buildFireStoryScene(variant)`，C1～C3 共用；`fireStoryScene`（A）與 `fireStoryAutoScene`（B）兩個匯出。
  - B 版 C4：4-1 關鍵幀只保留淡入（0.72→0.75），之後交給序列；4-2、4-3 關鍵幀 opacity 0，完全由序列控制；`sequence.steps = [{ trigger: 0.75, play: '4-1', then: '4-2' }, { trigger: 0.86, play: '4-3' }]`。
  - B 版名單捲動位置區間 `FIRE_STORY_AUTO_ROLL = [0.78, 0.86]`。
- 頁面內容抽成 `app/components/poc/FireStoryPage.vue`（prop `variant`），`fire-story.vue` 與新的 `fire-story-auto.vue` 是薄殼。
  - B 版名單：位置由捲動決定，但 **4-2 顯示後才可見**（區 0 ended 或已進區 1）。
  - B 版 C4 之後的文字（教訓、標題）：`p` 到位 **且** 區 1 ended 才出現；否則捲得慢會先黑再等字、捲得快會字疊在火上。
  - 兩版 intro 各放一個切到另一版的連結。
- `nuxt.config.ts` prerender 加 `/poc/fire-story-auto`。

## 素材

兩版共用現有影片。逐格 keyframe 的 4-1、4-3 用原速播放沒問題，只是檔案較大；等版本定案再重轉一般 GOP。

## 已知取捨（要讓設計師知道）

- 影片播放的 3 秒內畫面不理會捲動。區 0 的捲動長度約 200vh，讓一般速度捲動的人在 4-1 播完、4-2 loop 一會兒後才到區 1；捲太快會在 4-1 播完前越過區 1，4-2 與名單一閃而過。
- iOS 自動播放：影片靜音、`playsinline`，無手勢也允許；真機尚未驗證。

## 驗證

- `pnpm test`：`sequence.ts` 的六條規則、兩版場景的素材／關鍵幀／序列設定合法。
- `pnpm generate`：兩頁都有輸出。
- 瀏覽器連線目前不可用，實際捲動手感由使用者本機確認。
