<script setup lang="ts">
/**
 * UVid — 響應式影片元件（Responsive Video Component）
 *
 * 依目前裝置解析度（mob / pad / pc）從 src 物件挑對應來源，輸出單一 <video>。
 * 路徑會被 runtimeConfig 的 APP_ASSETS_PATH 前綴（dev/prod 為空字串），
 * 並自動補上副檔名：影片 .mp4、poster .jpg。預設 autoplay + loop。
 * autoplay 是**反應式**的播放開關，不只是初始屬性（見 autoplay prop）。
 *
 * ⚠️ **一律靜音，沒有開關**（原本有個 muted prop 預設跟隨全站音效開關，已移除）。
 *    全站只有 hero 影片可以有聲 —— 它的 play() 綁在 start 按鈕那一下點擊上，在使用者
 *    手勢之內，過得了瀏覽器的自動播放政策。本元件的播放一律由捲動／可見性驅動，
 *    **捲動不算手勢**，非靜音的 play() 必被擋（NotAllowedError），而且是靜默失敗：
 *    rejection 被吞掉、下方的 watcher 只在值變化時才跑 ⇒ 沒有重試，一次被擋就整段黑掉。
 *    udn-75 實測（390×844、Chrome 的 document-user-activation-required 政策）：
 *    媒體拍已啟動、readyState 4，但 paused: true / currentTime: 0。
 *    （udn-75 有 test/video-muted.spec.ts 守這條不變式，本專案尚未移植。）
 *
 * 使用範例（對應本專案 public/img，完整清單見 app/pages/poc/resources.vue）：
 *
 * 1. 有裝置變體（三個尺寸各一支）：
 *    <UVid :src="{ mob: '/img/hero_mob', pad: '/img/hero_pad', pc: '/img/hero_pc' }" />
 *
 * 2. 單一檔案、無裝置變體（三個 key 指向同一支）：
 *    <UVid :src="{
 *      mob: '/img/xxx/loop',
 *      pad: '/img/xxx/loop',
 *      pc:  '/img/xxx/loop',
 *    }" preload="metadata" />
 *
 * 3. 搭配 poster 首幀、關閉自動播放：
 *    <UVid :src="{ ... }" :poster="{ mob: '...', pad: '...', pc: '...' }" :autoplay="false" />
 *
 * 4. 把播放權交給可見性判斷（進視窗才播、離開就停）：
 *    <UVid :src="{ ... }" :autoplay="isInPlay" preload="metadata" />
 *
 * 命名規則：src 傳「不含副檔名」的路徑，元件會補 .mp4；poster 補 .jpg。
 * src / poster 掛載後才寫入（mounted），SSR 標記不帶來源。
 */
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { getDeviceTypeByResolution } from '@/utils/get-device';

type DeviceType = 'mob' | 'pad' | 'pc';

interface Props {
  src: {
    mob: string;
    pad: string;
    pc: string;
  };
  poster?: {
    mob: string;
    pad: string;
    pc: string;
  };
  /**
   * 「現在該不該播」的**反應式**開關，不只是初始屬性：切成 false 就暫停、
   * 切回 true 就續播（接在原處，不倒回開頭；要從頭演由呼叫端自己處理）。
   *
   * 用途是把播放權交給呼叫端的可見性判斷 —— 例如 udn-75 的 SubpageIntroMedia 用
   * IntersectionObserver ＋ active 兩道閘。原生 autoplay 屬性是一 mount 就播，
   * 瀏覽器雖然對 muted 影片有「看不見就不播」的節流慣例，但那是各家自訂的啟發式、
   * 各家的判準與時機都不同 —— 不能當機制依賴。
   */
  autoplay?: boolean;
  loop?: boolean;
  preload?: string;
  classname?: string;
  ariaLabel?: string;
  /**
   * pc 素材的下界（含）。不傳 ＝ 沿用 ~/utils/get-device 的預設 PC_BREAKPOINTS（1280）。
   *
   * 為什麼留著這個覆寫口：**素材的界線由那組影片當初照什麼尺寸剪的決定**，不保證永遠
   * 等於版型斷點。目前全站兩者同值，日後有照別的尺寸剪的素材時從這裡傳。
   * ⚠️ 只動 pad/pc 的分界，mob 的 767 界線不受影響。
   */
  pcFrom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true,
  loop: true,
  preload: 'auto',
  ariaLabel: 'Udn newmeida center',
});

// 與 UPic 一致：改用 Nuxt runtimeConfig（本專案是 NUXT_PUBLIC_APP_ASSETS_PATH，
// 而非 Vite 的 VITE_ASSETS_PATH）。
const config = useRuntimeConfig();
const ASSETS_PATH = config.public.APP_ASSETS_PATH;

// SSR 安全：伺服器端沒有 window，先以 'pc' 為預設（與初次 client render 一致，
// 避免 hydration mismatch），掛載後再依實際解析度校正並掛上 resize 監聽。
const deviceType = ref<DeviceType>('pc');
// SSR 與 hydration 首次渲染都不寫 src / poster（udn-75 的 HeroVideo 同理）：deviceType 在 SSR 一律是 pc，
// 寫在標記裡手機就會先抓 pc 版 metadata 與 pc poster —— udn-75 子頁兩支引言影片實測白抓 4 個 request。
const mounted = ref(false);

const videoRef = ref<HTMLVideoElement | null>(null);

// autoplay 當開關用。flush 'post' 讓 DOM 上的 autoplay 屬性先同步完，再下 play/pause 指令。
watch(
  () => props.autoplay,
  (play) => {
    const el = videoRef.value;
    if (!el) return;
    if (!play) {
      el.pause();
      return;
    }
    // 下指令前把 muted 再確認一次。template 上的靜態 muted 已經夠，這一行是為了讓
    // 「靜音」在**呼叫 play() 的那一刻**成立而不依賴任何外部狀態 —— 非靜音的影片在
    // 沒有使用者手勢時會被擋（NotAllowedError），而下面的 catch 會讓它靜默失敗。
    el.muted = true;
    // 仍然吞掉 rejection：AbortError（play 被隨後的 pause 打斷）是正常流程的一部分，
    // 不該噴 console。靜音之後 NotAllowedError 不會再出現。
    void el.play().catch(() => {});
  },
  { flush: 'post' },
);

function onResize() {
  deviceType.value = getDeviceTypeByResolution(props.pcFrom);
}

// pcFrom 改變（RWD 用不到，但父層可以是 computed）時要重新解一次，否則會沿用舊界線。
watch(() => props.pcFrom, onResize);

onMounted(() => {
  onResize();
  mounted.value = true;
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <video
    ref="videoRef"
    class="u-vid"
    :class="classname || ''"
    :src="mounted ? `${ASSETS_PATH}${src[deviceType]}.mp4` : undefined"
    type="video/mp4"
    :poster="mounted && poster ? `${ASSETS_PATH}${poster[deviceType]}.jpg` : undefined"
    playsinline
    :autoplay="autoplay"
    :loop="loop"
    muted
    :preload="preload"
    :aria-label="ariaLabel"
  />
</template>

<style lang="scss">
.u-vid {
  width: 100%;
  max-width: 100%;
  pointer-events: none;
}
</style>
