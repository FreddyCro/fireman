import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 讓區網設備可以使用，例如手機
  // devServer: {
  //   host: "0.0.0.0",
  //   port: 3000,
  // },

  ssr: true,

  experimental: {
    // 純靜態站用不到 /_nuxt/builds/meta/<id>.json（沒有 route rules、不需要偵測新版）。
    appManifest: false,
    // 全站沒有 useAsyncData / useFetch 時，_payload.json 只是多一個 request。
    payloadExtraction: false,
  },

  components: [
    // ui/：跨 section 共用的無語意元件。pathPrefix: false 讓元件名只取檔名，
    // 否則會被最後那筆 '~/components'（預設 pathPrefix: true）命名成 <UiXxx>。
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
  ],

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      // 首頁沒有連到 demo 頁，crawler 抓不到，要明列
      routes: ['/demo/paper-scroll'],
    },
  },

  runtimeConfig: {
    public: {
      APP_MODE: '',
      APP_ASSETS_PATH: '',
    },
  },

  app: {
    // NUXT_URL 的 pathname 當 baseURL：子路徑部署（如 GitHub Pages 的 /fireman/）
    // 沒設的話 _nuxt 資源會 404。
    baseURL: (() => {
      const nuxtUrl = process.env.NUXT_URL;
      if (!nuxtUrl) return '/';
      try {
        return new URL(nuxtUrl).pathname;
      } catch {
        return '/';
      }
    })(),
  },

  css: ['~/assets/styles/tailwind.css', '~/assets/styles/base.scss'],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // vue-scrollto 為 CJS-only（common-components 內部會 import 它），
      // 預先 bundle 成 ESM 才有 default export；common-components 若是延遲載入，
      // Vite 初掃描不到，故明確列入，避免 dev 期間觸發整頁 reload。
      include: ['vue-scrollto', '@udn-digital-center/common-components'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // common-components 的 index.scss 用相對路徑 @import，quietDeps 不涵蓋，
          // 故直接關閉 import 棄用類別。
          quietDeps: true,
          silenceDeprecations: ['import'],
          // 只放「不產生 CSS 輸出」的 @use（mixin / function / 變數），
          // 才能安全地 prepend 進每個 SCSS 進入點而不重複輸出樣式。
          additionalData: `@use "@/assets/styles/mixins.scss" as *;\n`,
        },
      },
    },
  },
});
