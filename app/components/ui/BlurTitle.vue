<!--
  滾動 blur 大標：大標是 SVG（文字已轉圖），從 blur(maxBlur) 隨捲動清晰到 blur(0)。
  svg 沒給（如該語系還沒有正式稿）就直接渲染 alt 文字，一樣 blur。
  label 有給就在上方顯示小標（白底黑字），小標不 blur。

  兩種模式：
  ・預設：元件進入視窗（start）到 end 之間完成清晰。
  ・pin：外層 trackVh 高的跑道、內層 sticky 100svh 置中，pin 住的期間依跑道進度 blur，
    進度到 clearAt 時全清、之後停留；往回捲會再糊回去。
  prefers-reduced-motion 時不做動畫、直接清晰。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './BlurTitle.scss';

const props = withDefaults(
  defineProps<{
    /** 大標 SVG 路徑（站台根目錄寫法，如 /img/no-trapped/title-zh.svg）；空字串＝改渲染 alt 文字 */
    svg?: string;
    /** 大標文字，給 <img alt> 與 SEO 用 */
    alt: string;
    /** 上方小標；不給就不顯示 */
    label?: string;
    /** 標題標籤 */
    tag?: 'h1' | 'h2' | 'h3';
    /** 起始模糊半徑（px） */
    maxBlur?: number;
    /** 預設模式：ScrollTrigger 的 start / end（相對元件本身） */
    start?: string;
    end?: string;
    /** pin 模式：100svh pin 住、依跑道進度 blur */
    pin?: boolean;
    /** pin 模式的跑道高度（vh） */
    trackVh?: number;
    /** pin 模式：跑道進度到此比例時全清 */
    clearAt?: number;
  }>(),
  {
    svg: '',
    label: undefined,
    tag: 'h2',
    maxBlur: 10,
    start: 'top 85%',
    end: 'center 50%',
    pin: false,
    trackVh: 200,
    clearAt: 0.6,
  },
);

const assetUrl = useAssetUrl();
const root = ref<HTMLElement | null>(null);
const img = ref<HTMLElement | null>(null);
let trigger: ScrollTrigger | null = null;

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const setBlur = gsap.quickSetter(img.value, 'filter') as (v: string) => void;
  // pin：跑道從貼頂到貼底；預設：元件本身從 start 到 end
  const range = props.pin ? { start: 'top top', end: 'bottom bottom' } : { start: props.start, end: props.end };
  const clearAt = props.pin ? props.clearAt : 1;
  trigger = ScrollTrigger.create({
    trigger: root.value,
    ...range,
    onUpdate: (self) => {
      const t = Math.min(self.progress / clearAt, 1);
      setBlur(`blur(${(props.maxBlur * (1 - t)).toFixed(2)}px)`);
    },
    onRefresh: (self) => {
      const t = Math.min(self.progress / clearAt, 1);
      setBlur(`blur(${(props.maxBlur * (1 - t)).toFixed(2)}px)`);
    },
  });
});

onBeforeUnmount(() => {
  trigger?.kill();
  trigger = null;
});
</script>

<template>
  <div ref="root" class="blur-title" :class="{ 'blur-title--pin': pin }" :style="pin ? { '--track': trackVh } : undefined">
    <div class="blur-title__stage">
      <p v-if="label" class="blur-title__label">{{ label }}</p>
      <component :is="tag" class="blur-title__title">
        <img v-if="svg" ref="img" class="blur-title__img" :src="assetUrl(svg)" :alt="alt" />
        <span v-else ref="img" class="blur-title__text">{{ alt }}</span>
      </component>
    </div>
  </div>
</template>
