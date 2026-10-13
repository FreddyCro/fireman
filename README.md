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
- `poc/` — 獨立的 POC（純 HTML / JS）
- `docs/` — 部署產物，由 `deploy-gh.sh` 產生
- `test/` — vitest
