// ScrollTrigger 的全域設定。必須在任何 ScrollTrigger.create() 之前跑完，
// 故放在 plugin（Nuxt plugin 早於元件的 onMounted）。
//
// ignoreMobileResize：行動裝置捲動時網址列收合／展開會觸發 resize → ScrollTrigger
// 全體 refresh → 每條尺的 start / end 重算 → 畫面在捲動途中跳一下。
// 觸控裝置上「只有高度小幅變動」的 resize 一律不 refresh。
// ⚠️ 這是 GSAP 全域設定，沒有 per-section 版本。
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
});
