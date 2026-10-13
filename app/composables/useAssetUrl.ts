// 靜態資產路徑前綴（單一來源）。
//
// locales/*.json 內的圖片路徑一律以「站台根目錄」寫法保存（/img/...），但實際部署可能
// 掛在子路徑或 CDN 上（見 .env 的 NUXT_PUBLIC_APP_ASSETS_PATH）。把 JSON 的字串原封不動
// 塞進 <img :src> 或 inline style 的 url()，瀏覽器會解析到 origin 根目錄而 404。
//
// ⚠️ 只有「runtime 才組出來的路徑」需要它。以下兩種不要再包一層：
//    ・寫死在 template 的 src="/img/x.svg" → Vite 編譯期就會轉成 base 感知的 URL。
//    ・UPic / UVid 的 src → 元件內部已自行前綴（見 UPic.vue 的 buildSrcset）。
export function useAssetUrl() {
  const config = useRuntimeConfig();
  const base = config.public.APP_ASSETS_PATH;

  // 已是完整 URL / data URI 的原樣放行，避免二次前綴。
  return (path?: string) =>
    !path || /^(https?:)?\/\//.test(path) || path.startsWith('data:')
      ? (path ?? '')
      : `${base}${path}`;
}
