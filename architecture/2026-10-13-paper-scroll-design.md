# paper-scroll：紙片風格捲動場景（POC）設計

日期：2026-10-13　分支：`feat/paper-scroll`

## 目標

驗證「多個紙片元素、每個有自己的 3～5 格 sprite、跟著捲動位移並像影片一樣播放」的做法。
示範劇本：**一個人走進一扇門，門內失火，火越燒越大蓋過人，火由大到小熄滅、背景轉黑，出現文字。**

技術決策來源：紐時〈Nuclear War: The Rising Risk〉互動頁的分析（見 [viewport-height.md](viewport-height.md)）。
從紐時借來的做法：單一 scroll 來源、sticky 舞台加跑道、進度用 lerp 平滑、`100vh`（手機上等於 `lvh`）當舞台高度、只有寬度變才重新排版。

## 不做的事（YAGNI）

- 影片拖動（video scrub）：素材是 3～5 格 sprite，不需要。
- 視差 depth、位移量化到 12fps、停止後切換時間循環：先不做，設計上留欄位即可。
- 座標模式 B（錨點相對座標）：先只做 A（cover，構圖靠上置中）。
- 不引入新套件；捲動用專案既有的 GSAP ScrollTrigger。

## 架構

```
app/utils/paper-scroll/          純 TS，不碰 Vue；可在 vitest（node 環境）測
  types.ts                       場景設定檔型別
  keyframes.ts                   關鍵幀取樣、easing、顏色插值
  frame.ts                       格數邏輯：time / scroll / hold、三種循環、防車輪效應
  viewport.ts                    lvh 量測、fitCanvas、cover 變換、resize 判斷
  assets.ts                      載入 sprite strip → ImageBitmap（SVG 也在此一次點陣化）
  scene.ts                       PaperScene：解析 trigger、更新格數、依圖層與 clip 繪製
  scenes/door-fire.ts            示範劇本的場景設定
app/composables/usePaperScene.ts ScrollTrigger + gsap.ticker + viewport 的生命週期
app/components/PaperStage.vue    sticky 舞台、canvas、文字 overlay slot
app/components/PaperDebug.vue    除錯面板
app/pages/demo/paper-scroll.vue  示範頁
app/locales/demo-paper.json      佔位文案
public/demo/paper/*.svg          產生的 sprite strip
poc/sprite-generator/generate.mjs 用 node 產生上面的 SVG（可重跑）
test/paper-*.spec.ts             純函式與「素材↔設定一致」測試
```

### 時間軸：兩條互相獨立

| | 來源 | 用途 |
|---|---|---|
| 捲動進度 `p`（0～1） | ScrollTrigger `onUpdate` 給目標值，`gsap.ticker` 每 tick 以 `p += (target - p) * (1 - e^(-dt/80ms))` 平滑 | 位置、縮放、旋轉、透明度、圖層、背景色、2b 換格 |
| 時鐘 `dt` | `gsap.ticker` 的 deltaTime | 2a 換格（累加 `acc += dt/1000 * fps`，fps 可隨 `p` 變） |

整頁只有 ScrollTrigger 的 scroll listener 與 `gsap.ticker` 的 rAF；舞台不在畫面上（IntersectionObserver）就不繪製。

### 格數模式（每個元素各自設定）

| `frameMode` | 換格依據 | 參數 |
|---|---|---|
| `time`（2a） | 時鐘 | `fps`（可用關鍵幀變動）、`phase`（格數或 `'random'`） |
| `scroll`（2b） | 捲動 | `pxPerFrame`（每捲 N px 換一格，與跑道長度無關）**或** `range: [from, to]`（進度區間平均分配到各格） |
| `hold` | 固定 | `holdFrame` |

- `loop`：`repeat`（1→2→3→4→1）、`pingpong`（1→2→3→2→1）、`clamp`（停在最後一格）。
- `maxStepPerTick`（預設 1）：每 tick 最多前進幾格，避免快速捲動時的車輪效應。內部維護無上限的 raw index，顯示時才做 loop 對應。
- `jitter: { rot, px }`：換格時加一點隨機位移與旋轉，模擬手擺放。
- 除錯面板可全域覆寫成全 time / 全 scroll（`hold` 不受影響）。

### 關鍵幀

每個屬性獨立取樣：找出有定義該屬性的關鍵幀，用「後一幀的 `ease`」插值；在第一幀之前取第一幀值、最後一幀之後取最後一幀值。
數值屬性：`x`、`y`（設計畫布的 0～1 比例）、`scale`、`rot`（度）、`opacity`、`fps`。階梯屬性：`layer`。
背景：`background: [{ p, color }]`，RGB 線性插值。

### Trigger（可逆）

`triggers: [{ p, set: Partial<ElementConfig> }]`。每 tick 以「所有 `p <= 進度` 的 trigger 依序覆蓋設定」求出當前設定，不是進入時觸發一次，所以往回捲自然還原。

### Clip

`clip: { ref, rect: [x, y, w, h], from?, until?, fade? }`：`rect` 是 `ref` 元素目前繪製格子的比例；進度在 `[from, until)` 內時裁切。`fade` 讓裁切矩形在 `[until - fade, until]` 之間由 1× 放大到 4×，避免解除裁切時畫面突然跳出。

### 座標與縮放

設計畫布 1920×1080；舞台以 cover 縮放（`scale = max(stageW/1920, stageH/1080)`），構圖**靠上置中**（`anchor: {x: 0.5, y: 0}`），所以手機上被網址列蓋住的只會是底部、被裁掉的是左右兩側。
除錯面板可畫出安全區（`documentElement.clientHeight`）與手機可見欄。

### Viewport（紐時做法）

- 舞台 `height: 100vh; height: 100lvh;`（不支援 lvh 的瀏覽器退回 100vh，手機上行為相同）。
- 安全高度取 `document.documentElement.clientHeight`（不隨網址列變）。
- resize 以 150ms debounce；觸控裝置上只有高度變（網址列、鍵盤）就忽略，寬度或 DPR 變才重設 canvas 並 `ScrollTrigger.refresh()`。
- `fitCanvas` 尺寸沒變就不動（重設 `canvas.width` 會清空畫布）。DPR 上限 2。
- ScrollTrigger 的 `end` 用 `'+=' + (track.offsetHeight - stage.offsetHeight)`，和 sticky 實際可黏住的距離一致。

### 素材格式（設計師交付規格）

- 每個元素一張**橫向 strip**：所有格子同尺寸、透明背景，PNG／WebP／SVG 皆可。
- 設定檔寫 `frames`、`cellW`、`cellH`、`anchor`（旋轉與定位的錨點，比例）。載入時以 `image.width / (cellW * frames)` 算出像素比，所以交 2× 圖不用改設定。
- 陰影請畫進素材，不用 canvas 即時算。
- 構圖以 1920×1080 設計，重要元素放在中央 9:19.5 的可見欄內、安全高度之上。

示範素材由 `poc/sprite-generator/generate.mjs` 產生（程式畫的剪紙幾何造型，只用來驗證手感）：

| 檔案 | 格 | 格子尺寸 | 內容 |
|---|---|---|---|
| `walker.svg` | 4 | 240×320 | 走路：接觸、下沉、經過、抬起 |
| `door.svg` | 5 | 320×420 | 門：關→開，含門框與門內暗色 |
| `flame.svg` | 4 | 200×260 | 火焰外焰與內焰，頂點隨格抖動 |

## 分鏡（跑道 600vh）

| 進度 | 畫面 | 設定 |
|---|---|---|
| 0→0.30 | 人從左走向中間的門，背景紙色 `#f2e9d8` | walker：`scroll` + `pxPerFrame: 60` + `repeat`；x 0.08→0.50 |
| 0.20→0.35 | 門打開 | door：`scroll` + `range: [0.20, 0.35]` + `clamp`，layer 1 |
| 0.30→0.42 | 人停下走進門內 | walker trigger `p: 0.30 → hold frame 2`；clip 到門開口 `from 0.30`；scale 1→0.7；opacity 1→0（0.34→0.42） |
| 0.38→0.55 | 門內冒小火苗，被門口裁切 | flame ×3：`time` 10fps、`phase: 'random'`；clip ref door `until 0.60, fade 0.08`；scale 0→0.4；opacity 0→1（0.38→0.42）；layer 2 |
| 0.55→0.78 | 火衝出門框、蓋過門和人 | flame scale →1.2@0.55 →4@0.78；layer 3@0.60 |
| 0.78→0.92 | 火由大到小熄滅、背景轉黑 | flame scale →0@0.92、opacity 1@0.85→0@0.92、fps 10@0.78→4@0.92；door、walker opacity →0（0.80→0.88）；background →`#000`（0.78→0.92） |
| 0.92→1.0 | 黑底出現文字 | DOM overlay，opacity 0@0.93→1@0.98，y 位移 16px→0 |

往回捲全部可逆（所有狀態都是進度的函數）。

## 無障礙與效能

- `prefers-reduced-motion`：`time` 模式停止換格（固定第 0 格），捲動位移保留。
- 舞台離開畫面或分頁隱藏時不繪製（`gsap.ticker` 本身在分頁隱藏時暫停）。
- 示範頁加進 `nitro.prerender.routes`（首頁沒有連過去，crawler 抓不到）。

## 實作狀態（2026-10-13）

- 依本設計實作，示範頁 `/demo/paper-scroll`，除錯面板預設開啟。唯一未做的是除錯面板的「手機可見欄」疊圖（只畫了安全區底線），待補。
- 桌機 Chrome 實測通過：正向與倒帶、快速捲動（人停在正確格）、全 time／全 scroll 切換、console 無錯誤。
- 真機（iOS／Android 網址列）尚未驗證，見 [viewport-height.md](viewport-height.md) 的待驗證清單。
- 專案沒有安裝 vue-tsc／typescript，型別只靠 `nuxt prepare` 與 dev server 編譯；之後若加型別檢查，先跑 `app/utils/paper-scroll/`。

## 驗證方式

- `pnpm test`：關鍵幀、格數、viewport 純函式、trigger 解析、素材與設定一致。
- `pnpm dev` 以瀏覽器實測：往下與往上捲、快速捲動（車輪效應）、除錯面板切換全 time／全 scroll。
- 真機（`./deploy-gh.sh staging`）：iOS Safari、Android Chrome 的網址列伸縮與轉向。
