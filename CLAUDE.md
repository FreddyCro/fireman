# CLAUDE.md

## Language

回答用繁體中文和英文，避免使用簡體字和中國慣用語。

## Memory

優先將 memory 存放在本專案的 `.claude/memory/` 目錄（`.claude\memory\`），而非全域 memory 目錄。MEMORY.md index 同樣存放於此目錄。

## Output Files

所有 skill 或任務產生的暫存、輸出檔案，優先寫入 `temp/` 目錄。若該子目錄不存在，先建立再寫入。

## Architecture Docs

設計文件、PRD、元件清單放 `architecture/`，命名慣例見 `architecture/README.md`。

## Cleanup

每次工作告一段落（交還控制權給使用者前），必須清掉自己開的執行環境：

1. **關閉所有 dev server**：結束自己啟動的 `pnpm dev` / `nuxt dev` 等背景行程，不要留著佔用 port。
   ⚠️ 只用 `TaskStop` 不夠 —— 它結束的是 pnpm 包裝行程，底下的 node 仍在監聽。
   要用 `Get-NetTCPConnection -LocalPort <port> -State Listen` 找出真正的 PID，
   `Stop-Process -Id <pid> -Force` 殺掉，再確認 port 真的釋放。
2. **關閉所有 worktree**：移除自己建立的 git worktree（`git worktree remove`），並確認 `git worktree list` 只剩主工作目錄。

清完後回報實際結果（關掉了哪些、port 是否釋放）。使用者原本就自己開著的行程不要動。

## Figma

讀取 Figma 時，優先使用 Figma MCP（`mcp__claude_ai_Figma__*` 工具），避免直接呼叫 Figma API。

## 元件目錄

沿用 udn-75 的編號 section 資料夾慣例：

- 首頁每個 section 一個資料夾：`app/components/NN.<name>/`（`01.hero`、`02.no-trapped`…），編號 ＝ 頁面順序。新增資料夾要在 `nuxt.config.ts` 的 `components` 補一筆 `pathPrefix: false`。
- 資料夾內檔名一律以 section 名開頭：主元件 `NoTrapped.vue`，子元件 `NoTrappedChart.vue`。
- section 的根元素是 `<section id="<name>" class="sec-<name>">`；`app/pages/index.vue` 只負責依序擺放 section。
- 兩個以上 section 共用的元件搬到 `ui/`；section 之間不互相 import。元件只放在 section 資料夾、`ui/`、`poc/` 三處。
- section 專用的 utils / composables 用同一個資料夾名：`app/utils/02.no-trapped/`、`app/composables/02.no-trapped/`（巢狀不會 auto-import，需明確 import）。素材放 `public/img/<name>/`（如 `public/img/hero/`）。
- section 的樣式寫在同資料夾的 `<Name>.scss`，由元件的 script `import './Hero.scss'`；元件檔不放 `<style>`。
- 捲動動畫引擎（canvas 幻燈片＋影片序列）：`app/utils/paper-scroll/`、`app/composables/usePaperScene.ts`、`ui/PaperStage.vue`。場景設定放各 section 的 utils（如 `app/utils/01.hero/scene.ts`），POC 場景在 `app/utils/poc/paper-scroll/scenes/`。
- header（`ui/AppHeader.vue`）用 common-components 的 `NmdHeader` 系列，選單項目在 `locales/{zh,en}/header.json`。

## 文案與中英文（i18n）

中文在 `/`、英文在 `/en`，用 `@nuxtjs/i18n`（`prefix_except_default`）處理路由、`<html lang>`、hreflang。**沒有動態切換**，不偵測瀏覽器語言，也不放語系切換鈕。

- **文案不走 vue-i18n 的 messages**（不用 `$t` / `tm` / `rt`）：依 section / component 分檔放 `app/locales/zh/*.json` 與 `app/locales/en/*.json`（兩邊檔名、結構相同），元件用 `const str = useCopy().noTrapped` 取目前語系的那份。新增檔案要在 `app/composables/useCopy.ts` 的 zh、en 各補一筆。
- `test/copy.spec.ts` 會檢查中英文的檔案、key 結構一致，且英文沒有殘留中文；`_` 開頭的 key 是備註，不檢查。
- 只放文案；中英文共用的版面資料（素材路徑、位置、角度）放 section 的 utils，以 id 對應文案（例：`app/utils/02.no-trapped/cases.ts`）。
- 共用檔：`meta.json`（SEO，在 `app.vue` 用 `useSeoMeta` 消費；分享網址由 `useShareUrls()` 依語系組）、`header.json`（漢堡選單）、`footer.json`（製作團隊名單；`NmdAuthor` 的 slot 名就是顯示的職稱）。
- `meta.json` 的圖片路徑用 runtimeConfig 的 `APP_ASSETS_PATH` 組：`${ASSETS_PATH}/${meta.metaImage}`。
- runtime 才組出來的素材路徑一律經過 `useAssetUrl()`。
- POC 頁只有中文：page 加 `definePageMeta({ i18n: false })`，文案仍直接 import `app/locales/poc/*.json`。
- `/en` 沒有連結可讓 crawler 抓到，已列在 `nuxt.config.ts` 的 `nitro.prerender.routes`。

目的是把文案與排版分離，方便編輯校稿。

## 環境變數與部署

- `.env.*.example` 是各部署目標的設定，`.env` 本身不進版控（開發時從 `.env.development.example` 複製）。
- `NUXT_URL` 的 pathname 會被 `nuxt.config.ts` 拿來當 `app.baseURL`；`NUXT_PUBLIC_APP_ASSETS_PATH` 是素材的絕對 URL 前綴（og:image 靠它組出可分享的完整網址，不要改成相對路徑）。
- 部署用 `./deploy-gh.sh [staging|nmdap|production]`：從目前 HEAD 重開目標 branch、`pnpm generate`、輸出放 `docs/`、force push。`docs/` 是部署產物，不要手動放東西進去。POC 一律放各目錄的 `poc/` 子目錄（`app/pages/poc/`、`app/components/poc/`…），純靜態 HTML POC 放 `public/poc/`。

## SCSS

1. 優先使用 BEM（`block__element--modifier`）命名。
2. RWD 寫在 BEM element 內部，用 `rwd-xxx` mixin 包住，不要按斷點把整份 scss 切成多區。同一個 class 只定義一次，其各斷點樣式集中在同一處。
3. **BEM 最多一層 element**：巢狀結構用連字號延伸，不可疊兩個。
4. 新寫的樣式一律 mobile-first（基底＝mob 稿，`rwd-min` 往大螢幕覆蓋）。斷點權威來源是 `app/assets/styles/mixins.scss`，JS 側對應 `app/utils/constants.ts`。
