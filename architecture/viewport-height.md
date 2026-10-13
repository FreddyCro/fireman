# viewport 高度：手機網址列與 sticky 舞台

跨設計的長期主題。來源：紐時〈Nuclear War: The Rising Risk〉互動頁的實際原始碼分析（2026-10-13），
以及本專案 paper-scroll 的實作（[2026-10-13-paper-scroll-design.md](2026-10-13-paper-scroll-design.md)）。

## 現象

手機瀏覽器（iOS Safari、Android Chrome）的 `100vh` 等於**網址列收起時**的視窗高度（即 `100lvh`）。
所以一個 `height: 100vh` 的 sticky 舞台：

- 網址列出現時：比可見區域高，底部那一截被網址列蓋住 → 看起來像「先裁掉」。
- 網址列收起時：那一截露出來 → 看起來像「還原高度」。

整個過程 `100vh` 的值**沒有變**，不會觸發重新排版，也不會跳動。紐時沒有用 JS 去裁切或還原高度，就是這個 CSS 行為。

## 紐時的三個決定

| 用途 | 做法 | 原因 |
|---|---|---|
| 舞台／影片高度 | CSS `100vh`（= lvh） | 伸縮時不變、滿版 |
| 捲動距離、觸發點 | `document.documentElement.clientHeight` | 不隨網址列變，進度不會跳 |
| resize | 150ms 節流；觸控裝置上只有高度變就忽略 | 避免每次網址列伸縮都重算 |

另外：共用的 viewport store 取 `Math.max(innerHeight, visualViewport.height)`，也是偏向 lvh 的思路；
紐時 App 內用 `calc(100vh - 50px)` 扣掉 App 底部列。

## 本專案的對應

| 項目 | 位置 |
|---|---|
| 舞台 `height: 100vh; height: 100lvh;`（不支援 lvh 時退回 vh，手機上行為相同） | `app/components/poc/PaperStage.vue` |
| `measureLvh()`：用隱藏元素量 100lvh，給 canvas 尺寸用 | `app/utils/poc/paper-scroll/viewport.ts` |
| `readViewport().safeHeight` = `documentElement.clientHeight`：安全區，重要內容放這裡面 | 同上 |
| `needsRelayout()`：觸控裝置上只有高度變就忽略；寬度或 DPR 變才重設 canvas | 同上 |
| `fitCanvas()`：尺寸沒變就不動（重設 `canvas.width` 會清空畫布） | 同上 |
| ScrollTrigger `ignoreMobileResize: true`（全域） | `app/plugins/gsap-config.client.ts` |
| ScrollTrigger `end` 用 `track.offsetHeight - stage.offsetHeight`，與 sticky 實際可黏住的距離一致 | `app/composables/poc/usePaperScene.ts` |

除錯面板（`PocPaperStage` 的 `debug` prop）會畫出安全區底線，真機上可以直接看網址列蓋到哪裡。

## 不要做的事

- **不要用 `dvh`**：捲動途中跟著網址列變，畫面會跳。
- **不要用 `innerHeight` 算捲動進度**：iOS 上隨網址列一直變。
- **不要因為高度變就重設 canvas**：會清空畫布閃一下，而且重新配置記憶體。

## 給設計師的規格

- 畫布以 lvh 高度設計，但字幕與主要元素放在安全高度內（底部留約 80～120px）。
- 底部那一截只能放可以被裁掉的背景延伸。

## 待真機驗證（2026-10-13 時尚未做）

桌機 Chrome 不會模擬網址列伸縮，以上是讀程式碼與桌機實測的結論。部署到 staging 後要用真機確認：

- iOS Safari、Android Chrome：捲動時網址列伸縮，舞台不跳、火焰與文字不被蓋住。
- 轉向（直式 ↔ 橫式）：canvas 重設、ScrollTrigger refresh、構圖正確。
- 鍵盤彈出（若頁面有輸入框）：不觸發重排。
