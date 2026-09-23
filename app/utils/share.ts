import { onMounted, ref } from 'vue';
import meta from '@/locales/meta.json';

export function detectMob() {
  // 在 server-side 或沒有 navigator 時避免存取 undefined
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    return false;
  }

  // 使用單一正則檢查 userAgent
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

// 以下三行，請根據每個專案的 meta 自行調整
const metaTitle = meta.metaTitle;
const metaDescription = meta.metaDesc;
const metaURL = meta.metaURL;

const encodeTitle = encodeURI(metaTitle);
const encodeDescription = encodeURI(metaDescription);
const encodeUrl = encodeURI(metaURL);
const shareText = `${encodeTitle}%0D%0A%0D%0A${encodeDescription}`;

// LINE 分享網址分手機／PC 兩種（手機版才會喚起 App）。
//
// ⚠️ 不要在模組頂層用 detectMob() 直接選一個然後當常數 export：
//    這支檔案在 SSR／prerender 階段也會被載入，那時沒有 navigator 一定拿到 PC 版；
//    到瀏覽器（手機 UA）重新求值就變成手機版，兩邊 href 不同 → hydration attribute mismatch。
//    需要在 template 綁 href 時，一律用 useLineShareUrl()。
export const shareURL_line_pc = `https://social-plugins.line.me/lineit/share?url=${encodeUrl}`;
export const shareURL_line_mob = `https://line.naver.jp/R/msg/text/?${encodeUrl}`;

// 首次渲染（含 SSR）固定給 PC 版，掛載後才依 UA 換成手機版 ——
// 換值發生在 hydration 之後，Vue 不會比對，也就不會有 mismatch。
export function useLineShareUrl() {
  const href = ref(shareURL_line_pc);

  onMounted(() => {
    if (detectMob()) href.value = shareURL_line_mob;
  });

  return href;
}

export const shareURL_fb = `https://www.facebook.com/dialog/share?app_id=1010324812347164&display=popup&href=${encodeUrl}&redirect_uri=${encodeUrl}`;

export const shareURL_twitter = `https://twitter.com/intent/tweet/?text=${shareText}%0D%0A%0D%0A${encodeUrl}`;

export default {
  detectMob,
  shareURL_fb,
  shareURL_line_pc,
  shareURL_line_mob,
  useLineShareUrl,
  shareURL_twitter,
};
