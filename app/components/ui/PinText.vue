<!--
  全螢幕 pin 住的段落：捲過 fadeOutAt 後綁捲動淡出，跑道走完才鬆開。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './PinText.scss';

const props = withDefaults(
  defineProps<{
    /** 跑道高度（vh）：pin 住的時間長度 */
    trackVh?: number;
    /** 跑道進度到此比例開始淡出，到 1 全透明 */
    fadeOutAt?: number;
    /** 內容隨捲動從模糊變清楚（引言） */
    blur?: boolean;
    maxBlur?: number;
    /** blur 模式：進度到此比例全清 */
    clearAt?: number;
  }>(),
  { trackVh: 200, fadeOutAt: 0.7, blur: false, maxBlur: 10, clearAt: 0.5 },
);

const root = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
let st: ScrollTrigger | null = null;

if (props.blur) {
  useScrollBlur(content, root, { maxBlur: props.maxBlur, start: 'top top', end: 'bottom bottom', clearAt: props.clearAt });
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !content.value) return;
  gsap.registerPlugin(ScrollTrigger);
  const setOpacity = gsap.quickSetter(content.value, 'opacity') as (v: number) => void;
  const apply = (self: ScrollTrigger) => {
    const p = self.progress;
    const o = p <= props.fadeOutAt ? 1 : 1 - (p - props.fadeOutAt) / (1 - props.fadeOutAt);
    setOpacity(Math.max(0, Math.min(1, o)));
  };
  st = ScrollTrigger.create({ trigger: root.value, start: 'top top', end: 'bottom bottom', onUpdate: apply, onRefresh: apply });
});

onBeforeUnmount(() => {
  st?.kill();
  st = null;
});
</script>

<template>
  <div ref="root" class="pin-text" :style="{ '--track': trackVh }">
    <div class="pin-text__stage">
      <div ref="content" class="pin-text__content"><slot /></div>
    </div>
  </div>
</template>
