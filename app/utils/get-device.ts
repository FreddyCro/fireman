import { PC_BREAKPOINTS } from './constants';

/**
 * 依視窗寬度判斷該取哪一組裝置素材（mob / pad / pc）。
 *
 * 界線與 SCSS 的 `$breakpoints`（mixins.scss）一致：pc ≥1280、pad 768–1279、mob ≤767。
 * 設計師裁決**純寬度切**，不看 orientation。
 *
 * ⚠️ 已知並接受的代價：1024–1279 不只有 iPad 直式（Pro 12.9" 1024×1366），也含所有
 *    iPad 橫式（mini 1133×744、Air 1180×820、Pro 11" 1194×834）。後者拿到的是 pad 的
 *    1024×1364 直片 ＋ `object-fit: contain` ⇒ 左右各留 250–280px 白邊
 *    （udn-75 的觀察，見其 HeroVideo.vue）。
 *
 * @param pcFrom pc 的下界（含），預設 PC_BREAKPOINTS（1280）＝ 版型的 pc 斷點。
 *        素材是照別的界線剪的時候才傳。
 *        ⚠️ 傳值只影響 pad/pc 的分界，mob 的 767 界線不動（三組素材的 mob 都同一條線）。
 */
function getDeviceTypeByResolution(pcFrom: number = PC_BREAKPOINTS) {
  if (window.matchMedia('(max-width: 767px)').matches) return 'mob';
  if (window.matchMedia(`(max-width: ${pcFrom - 1}px)`).matches) return 'pad';
  return 'pc';
}

export { getDeviceTypeByResolution };
