import { defineConfig } from 'vitest/config';

// 只跑 test/ 下的純函式測試：預設的 include 會掃到 .output / node_modules/.cache
// 這類建置產物，白花時間也可能撞到同名檔。
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
  },
});
