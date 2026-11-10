<!--
  單一案例：文字＋scrapbook，跨 section 共用（02 no-trapped、03 violation）。整個 article 就是素材的拖曳範圍，素材可以拖到文字上。
  body 文案裡用 **…** 包起來的字會渲染成粗體白字（設計稿的重點句）。

  flyTo：給一個「落點」元素（同比例的空位，見 02 的 __board-slot），scrapbook 整塊會隨捲動從案例的位置
  平移＋縮放飛到那個空位（ScrollTrigger scrub）：案例置中時出發、落點置中時到達，往回捲會飛回來。
  位移用 offset 鏈算文件座標（不含 transform），refresh 時重算。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ScrapbookItem } from '~/utils/scrapbook';
import './CaseStory.scss';

const props = defineProps<{
  data: {
    date: string;
    title: string[];
    body: string;
    count: { number: string; label: string };
    aspect: { mob: string; pad?: string; pc: string };
    padWidth?: number;
    media: ScrapbookItem[];
  };
  /** pc 以上左右對調（素材在左、文字在右） */
  reverse?: boolean;
  /** scrapbook 隨捲動飛去的落點元素 */
  flyTo?: HTMLElement | null;
}>();

const rootStyle = computed(() => ({ '--board-pad': `${props.data.padWidth ?? 652}px` }));

/** body 依 **…** 切段：偶數段一般文字、奇數段粗體 */
const bodyParts = computed(() => props.data.body.split(/\*\*(.+?)\*\*/));

const root = ref<HTMLElement | null>(null);
const board = ref<HTMLElement | null>(null);
let tween: gsap.core.Tween | null = null;

/** 文件座標（offsetParent 鏈相加，不受 transform 影響） */
const docPos = (el: HTMLElement) => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

const setup = () => {
  tween?.scrollTrigger?.kill();
  tween?.kill();
  tween = null;
  gsap.set(board.value, { clearProps: 'transform' });
  const target = props.flyTo;
  if (!target || !board.value || !root.value) return;

  gsap.registerPlugin(ScrollTrigger);
  const b = board.value;
  tween = gsap.to(b, {
    x: () => docPos(target).x - docPos(b).x,
    y: () => docPos(target).y - docPos(b).y,
    scale: () => target.offsetWidth / b.offsetWidth,
    transformOrigin: '0 0',
    ease: 'none',
    scrollTrigger: {
      trigger: root.value,
      start: 'center center',
      endTrigger: target,
      end: 'center center',
      scrub: 0.5,
      invalidateOnRefresh: true,
    },
  });
};

onMounted(setup);
watch(() => props.flyTo, setup);

onBeforeUnmount(() => {
  tween?.scrollTrigger?.kill();
  tween?.kill();
});
</script>

<template>
  <article
    ref="root"
    class="case-story"
    :class="{ 'case-story--reverse': reverse, 'case-story--fly': !!flyTo }"
    :style="rootStyle"
  >
    <div class="case-story__text">
      <p class="case-story__date">{{ data.date }}</p>
      <h3 class="case-story__heading">
        <span v-for="l in data.title" :key="l">{{ l }}</span>
      </h3>
      <p class="case-story__body">
        <template v-for="(part, i) in bodyParts" :key="i">
          <strong v-if="i % 2" class="case-story__em">{{ part }}</strong>
          <template v-else>{{ part }}</template>
        </template>
      </p>
      <p class="case-story__count">
        <span class="case-story__count-num">{{ data.count.number }}</span>{{ data.count.label }}
      </p>
    </div>
    <div ref="board" class="case-story__board">
      <Scrapbook :items="data.media" :aspect="data.aspect" :self-bounds="!!flyTo" />
    </div>
  </article>
</template>
