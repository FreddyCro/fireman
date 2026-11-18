import { onMounted, ref } from 'vue';
import type { Copy } from '~/composables/useCopy';

export function detectMob() {
  // 在 server-side 或沒有 navigator 時避免存取 undefined
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    return false;
  }

  // 使用單一正則檢查 userAgent
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

/** 分享網址依語系的 meta（標題、描述、網址）組出來；meta 在 locales/{zh,en}/meta.json */
export function buildShareUrls(meta: Copy['meta']) {
  const encodeTitle = encodeURI(meta.metaTitle);
  const encodeDescription = encodeURI(meta.metaDesc);
  const encodeUrl = encodeURI(meta.metaURL);
  const shareText = `${encodeTitle}%0D%0A%0D%0A${encodeDescription}`;

  return {
    fb: `https://www.facebook.com/dialog/share?app_id=1010324812347164&display=popup&href=${encodeUrl}&redirect_uri=${encodeUrl}`,
    twitter: `https://twitter.com/intent/tweet/?text=${shareText}%0D%0A%0D%0A${encodeUrl}`,
    // LINE 分享網址分手機／PC 兩種（手機版才會喚起 App）
    linePc: `https://social-plugins.line.me/lineit/share?url=${encodeUrl}`,
    lineMob: `https://line.naver.jp/R/msg/text/?${encodeUrl}`,
  };
}

// ⚠️ LINE 不要在 setup 直接用 detectMob() 選一個：
//    SSR／prerender 階段沒有 navigator 一定拿到 PC 版；到瀏覽器（手機 UA）重新求值就變成手機版，
//    兩邊 href 不同 → hydration attribute mismatch。
//    首次渲染（含 SSR）固定給 PC 版，掛載後才依 UA 換成手機版 —— 換值發生在 hydration 之後，Vue 不會比對。
export function useShareUrls() {
  const urls = buildShareUrls(useCopy().meta);
  const line = ref(urls.linePc);

  onMounted(() => {
    if (detectMob()) line.value = urls.lineMob;
  });

  return { fb: urls.fb, twitter: urls.twitter, line };
}
