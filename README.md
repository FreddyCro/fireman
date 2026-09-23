# fireman

Nuxt 4 + pnpm 靜態專題站。

## 開發

```bash
cp .env.development.example .env
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest
```

## 部署

```bash
./deploy-gh.sh [staging|nmdap|production]
```

各目標的網址在 `.env.*.example`；`NUXT_URL` 空著時腳本會擋下來。

## 目錄

- `app/` — Nuxt 原始碼（文案在 `app/locales/*.json`）
- `architecture/` — 設計文件
- `public/poc/` — 獨立的純 HTML / JS POC（fire-edge、ink-edge）；Nuxt 內的 POC 放各目錄的 `poc/` 子目錄（頁面在 `app/pages/poc/`）
- `docs/` — 部署產物，由 `deploy-gh.sh` 產生
- `test/` — vitest
