# 素材命名規則（UPic / UVid）

團隊共用的兩個媒體元件，來源：`udn-75/app/components/UPic.vue`、`UVid.vue`。
素材放 `public/img/<section>/`，檔名要照元件拼路徑的方式命名，否則會 404。

> 本專案的副本在 `app/components/ui/UPic.vue`、`UVid.vue`（UVid 依賴 `app/utils/get-device.ts`）。
> 斷點與 `app/utils/constants.ts` 一致：mob ≤767、pad 768–1279、pc ≥1280。

## 工具

| 工具 | 用途 |
|---|---|
| `node scripts/assets/normalize.mjs <交件目錄>` | 設計交件 → `public/img/<section>/` 的改名計畫（dry-run）；`--apply` 複製、`--move` 複製後刪除來源 |
| `/poc/resources` | 素材總覽頁：即時掃 `public/img`，UPic／UVid 預覽、自動檢查缺檔與大檔、複製使用程式碼 |
| `app/utils/poc/resources/notes.ts` | 總覽頁的人工疑慮註記，確認後刪除 |

### 設計交件 → 本專案的對應

交件檔名 `firefighter_p{頁}_{素材}[_en]_{裝置}{日期}.{ext}`：

- 頁碼對應 section 資料夾：p01 hero、p02 no-trapped、p03 violation、p04 manpower、p05 ending；按鈕放 `ui/`。
- 拿掉 `firefighter_p{頁}_` 前綴與日期。
- `pcpadmob`（三尺寸共用）→ 無後綴；`padmob`（UPic 不支援）→ 複製成 `_pad` 與 `_mob`。
- 同組同時有 pcpadmob 與其他裝置版、檔名帶「 (1)」、或撞名但內容不同 → 原檔名放 `<section>/_review/` 待確認。

---

## 共通原則

- 元件的 `src` 傳**不含副檔名、不含裝置後綴**的路徑，例如 `/img/hero/1-1`。
- 實際網址 ＝ `APP_ASSETS_PATH` + `src` + 後綴 + 副檔名（dev / prod 的 `APP_ASSETS_PATH` 為空字串）。
- 裝置後綴固定三種：`_pc`、`_pad`、`_mob`；另有 `_pcpad`（PC 與平板共用一張）。
- 高解析度版本在副檔名前加 `@2x`：`_pc@2x.jpg`。

---

## UPic（圖片）

輸出 `<picture>`：每個斷點各一組 `<source>`（WebP ＋ 原格式），最後一個 `<img>` 當 fallback。

### Props 與命名的關係

| prop | 預設 | 對檔名的影響 |
|---|---|---|
| `src` | — | 檔名主幹 |
| `ext` | `jpg` | 原格式副檔名（`png`、`svg`…） |
| `srcset` | `['pc','pad','mob']` | 要準備哪幾組裝置後綴 |
| `default` | `pc` | fallback `<img>` 用哪一組（**該檔必須存在**） |
| `usePrefix` | `true` | `false` ＝ 不加裝置後綴 |
| `use2x` | `true` | 要準備 `@2x` 版 |
| `webp` | `true` | 每個檔都要有對應 `.webp` |

### 情境 A：標準多斷點照片（全預設）

```vue
<UPic src="/img/hero/cover" alt="..." />
```

需要 **12 個檔**：

```
cover_pc.jpg     cover_pc@2x.jpg     cover_pc.webp     cover_pc@2x.webp
cover_pad.jpg    cover_pad@2x.jpg    cover_pad.webp    cover_pad@2x.webp
cover_mob.jpg    cover_mob@2x.jpg    cover_mob.webp    cover_mob@2x.webp
```

### 情境 B：同一張圖、只有密度變體（不分裝置）

```vue
<UPic src="/img/hero/photo" :use-prefix="false" :srcset="['mob']" alt="..." />
```

```
photo.jpg   photo@2x.jpg   photo.webp   photo@2x.webp
```

`srcset` 只放一個值即可（沒有後綴時三組會產生重複的 source）。

### 情境 C：單一檔案（無 WebP、無 @2x，如底圖、PNG）

```vue
<UPic src="/img/hero/bg" ext="png" :use-prefix="false" :use2x="false" :webp="false" alt="..." />
```

```
bg.png
```

### 情境 D：PC／平板共用 ＋ 手機一張（常用於 SVG 圖表）

```vue
<UPic src="/img/hero/chart01" ext="svg" :srcset="['pcpad', 'mob']"
      default="pcpad" :use2x="false" :webp="false" alt="..." />
```

```
chart01_pcpad.svg   ← ≥768px
chart01_mob.svg     ← <768px
```

⚠️ 一定要設 `default="pcpad"`，否則 fallback 會去抓不存在的 `chart01_pc.svg`。

### 其他

- 首屏主視覺：`loading="eager"` ＋ `fetch-priority="high"`（兩者是不同的事，LCP 圖兩個都要）。
- 可選：只要 `srcset` 有列出的後綴才需要檔案，例如 `:srcset="['pc','mob']"` 就不用準備 `_pad`。

---

## UVid（影片）

依裝置寬度挑一支來源，輸出單一 `<video>`。**一律靜音**、預設 autoplay ＋ loop、`playsinline`。

### 命名規則

- `src` 是物件 `{ mob, pad, pc }`，每個值是**不含副檔名**的路徑，元件自動補 `.mp4`。
- `poster`（選用）同樣是 `{ mob, pad, pc }`，自動補 `.jpg`。
- 檔名本身沒有強制後綴；**慣例**沿用 `_pc` / `_pad` / `_mob`。
- 只支援 mp4 ／ jpg poster，沒有 webm、沒有 webp poster。

### 情境 A：三個尺寸各一支

```vue
<UVid :src="{ mob: '/img/hero/intro_mob', pad: '/img/hero/intro_pad', pc: '/img/hero/intro_pc' }"
      :poster="{ mob: '/img/hero/intro_mob', pad: '/img/hero/intro_pad', pc: '/img/hero/intro_pc' }" />
```

```
intro_pc.mp4    intro_pc.jpg
intro_pad.mp4   intro_pad.jpg
intro_mob.mp4   intro_mob.jpg
```

（poster 與影片同名、不同副檔名，是最順手的做法。）

### 情境 B：單一檔案、不分裝置

```vue
<UVid :src="{ mob: '/img/hero/loop', pad: '/img/hero/loop', pc: '/img/hero/loop' }" preload="metadata" />
```

```
loop.mp4
```

### 其他 props

| prop | 預設 | 說明 |
|---|---|---|
| `autoplay` | `true` | **反應式**開關：切 false 暫停、切回 true 續播（可接 IntersectionObserver） |
| `loop` | `true` | |
| `preload` | `auto` | 摺疊線下建議 `metadata` |
| `pcFrom` | `1280` | 只調整 pad／pc 分界；mob 界線固定 767 |

src／poster 在 mounted 後才寫入，SSR 標記不帶來源（避免手機先抓 pc 版）。

---

## 加入新素材時的改名清單

1. 決定用哪個情境（A／B／C／D），列出需要的後綴組合。
2. 依 `{主幹}{_裝置}{@2x}.{ext}` 改名，主幹用小寫英數 ＋ 連字號或底線，不要有空白與中文。
3. UPic 預設要 WebP：每個 jpg／png 都要有同名 `.webp`。
4. 確認 `default` 指向的那組檔案存在。
5. UVid 只認 `.mp4` ＋ `.jpg` poster。

### 速查

| 素材 | 檔名模板 |
|---|---|
| 多斷點照片 | `name_{pc,pad,mob}[@2x].{jpg,webp}` |
| 不分裝置照片 | `name[@2x].{jpg,webp}` |
| 單檔圖 | `name.{ext}` |
| SVG 圖表 | `name_{pcpad,mob}.svg` |
| 多斷點影片 | `name_{pc,pad,mob}.mp4` ＋ 選用 `.jpg` poster |
| 單支影片 | `name.mp4` |
