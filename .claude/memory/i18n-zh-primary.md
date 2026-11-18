---
name: i18n-zh-primary
description: 文案以中文為主；英文設計稿缺的就不要填（也不填空字串），執行時 fallback 顯示中文
metadata:
  type: feedback
---

中文是主版本。英文 locale 只放英文設計稿真的有的翻譯，缺的 key 直接省略，不要自己補、不要用空字串佔位，也不要從中文挪用推測的內容。`useCopy` 會用中文補上，英文頁出現中文就能發現缺漏。

**Why:** 使用者要讓缺翻譯「看得見」，之後校稿時才會發現問題；空字串或自行補的英文會把問題藏起來。

**How to apply:** 新增或修改 `app/locales/en/*.json` 時，英文稿沒有的就省略該 key；英文多出中文沒有的內容也要回報。陣列是整段替換、不逐項補中文。`test/copy.spec.ts` 會擋英文用空字串佔位。相關：[[figma-section-map]]
