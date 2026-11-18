# 02.no-trapped「超哥故事」捲動動畫（NoTrappedEscape）

日期：2026-11-16

## 來源

- 主稿位置：Figma「定版1106 (CH)」→ `1280 px` 長頁 `2423:5331`（pc_內文圖，引言），前後是 `2423:5288`（張賢龢段落）與 `2423:5333`（美福倉儲）。
- 動態分鏡：同頁畫布左側「PC插畫編排」（`2469:2257` 起，共約 20 格 `story` frame，含動態註記）。
- Pad / Mob 只有主稿上的靜態一格（`2423:27188`、`2423:16879`），沒有分鏡；版面依素材尺寸推。
- 素材：1110 插畫初稿 `story{1..7}-{n}_<name>_{pc,pad,mob}`，原本誤放在 `public/img/hero/`，搬到 `public/img/no-trapped/escape/`。

## 分鏡

| # | 畫面 | 素材 | 動態（分鏡註記） | 字幕 key |
|---|---|---|---|---|
| 0 | 引言 | — | 維持 DOM blockquote＋useScrollBlur | `quote`（既有） |
| 1 | 火燒工廠 | story1-1～3 | PNG 幻燈片輪播（time loop） | `escape.fire` |
| 2 | 水簾洞樓梯 | story2-1～3（直長圖） | 輪播＋長圖往上捲 | `escape.stair` |
| 3 | 腳踩水 | story3-1～3（PNG 疊在樓梯上） | 幻燈片播一次（scroll），播完連底圖淡出 | `escape.acid` |
| 4 | 走廊 | story4-1～3 | 淡出淡入；scroll 播 | `escape.corridor` |
| 5 | 開關門 | story5-1～6 | scroll 播 | `escape.labels`、`escape.closeDoor` |
| 6 | 黑畫面 | — | 只有字 | `escape.explosion` |
| 7 | 逃跑 | story6-1～3 | 畫面變白，硬切；6-3 放大到全黑 | `escape.run` |
| 8 | 工廠大火 | story7-1～3 | 畫面變黑，淡入輪播 | `escape.burn` |

## 架構

```
app/components/02.no-trapped/NoTrappedEscape.vue   PaperStage＋字幕 overlay（同 Hero.vue）
app/components/02.no-trapped/NoTrappedEscape.scss
app/utils/02.no-trapped/escape.ts                  escapeScene(device)、時間軸、字幕位置
app/utils/paper-scroll/timeline.ts                 vh → p 的換算工具（新場景用；hero 之後可改用）
app/locales/{zh,en}/section-no-trapped.json        新增 escape 字幕
```

NoTrapped.vue：引言保留，`__illust` placeholder 換成 `<NoTrappedEscape />`。

## 引擎擴充（paper-scroll）

1. **`SpriteConfig.srcs`：一格一個檔**。素材是逐格分開的檔案，不拼 sprite strip（PC 6 格會到 9720px 寬，也省一個 build step）。
   有 `srcs` 時 `src` 只當快取 key，`frames = srcs.length`；每格各自算 pixelRatio。
   點陣圖保留 `HTMLImageElement`（decode 後直接畫），不轉 ImageBitmap：約 30 張大圖全轉 bitmap 會吃掉 150～200 MB，留給瀏覽器管理解碼快取。
2. **`SceneConfig.maxScale`**：「1920 尺寸插畫文字位置不變也不放大，螢幕自己將黑背景左右延伸」→ PC 用 contain＋`maxScale: 1`。
3. **`lazy` 載入**：這段在頁面中段，素材很大（PC 約 30 MB），track 接近畫面（前 1.5 個畫面）才開始載。
4. **三載具不同構圖**：PC 1280×720 橫、Pad 768×1024、Mob 414×736 直。`escapeScene(device)` 各出一份，元件以 `:key="device"` 重掛 PaperStage。SSR 先出 pc，掛載後依寬度切換。

## 時間軸

跑道 2550vh（捲動距離 2450vh），全部以「捲到第幾 vh」寫在 `escape.ts`，每段約 200～300vh；實際節奏要上線後跟設計一起調。

## 待設計確認

- 引言：PC 稿「我大喊快跑」，Mob 稿與現有文案「我說快跑」。暫維持「說」。
- story5-6 缺 PC 版 → PC 開關門先用 5 格。
- story5-4＝5-2、5-5＝5-1 完全相同（推測刻意重用開門→關門），照樣引用。
- 「輪播」暫定硬切、6 fps；「播一次」暫定綁捲動。
- PC 素材多張 > 1 MB，正式稿需轉 WebP。
- Pad / Mob 的字幕位置沒有稿，暫放畫面上方置中。
- 英文字幕是暫譯，需校稿。
