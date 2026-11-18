<!--
  pin 住的圖表（02 no-trapped、03 violation 共用）。
  跑道 layout.trackVh 高，舞台 sticky；舞台只放「標題＋圖例／圖／註」這三樣，高度 auto，
  top 由 JS 量舞台高度算成「視窗垂直置中」（--stage-h），不像 BlurTitle 固定 100svh——
  因為圖表下方可能接一大段文字（slot），文字若也塞進 100svh 的舞台，手機上一定爆出視窗。
  所以文字放在跑道之後：圖表 pin 住的期間先切換遮罩（過 switchAt 切第二組），跑道走完舞台鬆開，
  文字緊接著從圖表下方捲上來，看起來仍是同一塊。

  切換：標題／圖例淡入淡出；圖上兩塊黑色半透明遮罩 opacity 交替，位置在 layout.slides[].mask。
  手機：圖比容器寬（scss 的 --pan），看的那半邊跟著遮罩走——遮罩在左就整張圖向左橫移露出右半，遮罩在右就看左半。
-->
<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { PinChartCopy, PinChartLayout } from '~/utils/pin-chart';
import './PinChart.scss';

const props = defineProps<{ layout: PinChartLayout; copy: PinChartCopy }>();

const assetUrl = useAssetUrl();
const track = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const active = ref(0);
const stageH = ref(0);

const slides = computed(() =>
  props.layout.slides.map((s) => {
    const copy = props.copy.slides[s.id];
    return {
      id: s.id,
      title: copy?.title ?? '',
      legend: props.layout.legend.map((l) => ({ ...l, text: copy?.legend[l.id] ?? '' })),
      maskStyle: { left: `${s.mask.left}%`, width: `${s.mask.width}%` },
      // 手機要看的是沒被遮的那半：遮罩在左半就橫移露出右半
      panRight: s.mask.left < 50,
    };
  }),
);

let trigger: ScrollTrigger | null = null;
let resizeObs: ResizeObserver | null = null;

onMounted(() => {
  // 舞台高度 → --stage-h，scss 用它把 sticky top 算成垂直置中（高過視窗就貼頂）
  resizeObs = new ResizeObserver(([e]) => {
    stageH.value = e?.contentRect.height ?? 0;
  });
  resizeObs.observe(stage.value!);

  trigger = ScrollTrigger.create({
    trigger: track.value,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      active.value = self.progress >= props.layout.switchAt ? 1 : 0;
    },
  });
});

onBeforeUnmount(() => {
  trigger?.kill();
  trigger = null;
  resizeObs?.disconnect();
});
</script>

<template>
  <div class="pin-chart">
    <div ref="track" class="pin-chart__track" :style="{ '--track': layout.trackVh }">
      <figure ref="stage" class="pin-chart__stage" :style="{ '--stage-h': `${stageH}px` }">
        <figcaption class="pin-chart__head">
          <div
            v-for="(s, i) in slides"
            :key="s.id"
            class="pin-chart__text"
            :class="{ 'is-active': i === active }"
            :aria-hidden="i !== active"
          >
            <h3 class="pin-chart__title">{{ s.title }}</h3>
            <p class="pin-chart__legend">
              <span
                v-for="l in s.legend"
                :key="l.id"
                class="pin-chart__legend-item"
                :class="`pin-chart__legend-item--${l.shape}`"
                :style="{ '--swatch': l.color }"
              >
                {{ l.text }}
              </span>
            </p>
          </div>
        </figcaption>
        <div class="pin-chart__fig">
          <div class="pin-chart__pan" :class="{ 'pin-chart__pan--right': slides[active]?.panRight }">
            <img class="pin-chart__img" :src="assetUrl(layout.svg)" :alt="copy.alt" />
            <div
              v-for="(s, i) in slides"
              :key="s.id"
              class="pin-chart__mask"
              :class="{ 'is-active': i === active }"
              :style="s.maskStyle"
              aria-hidden="true"
            />
          </div>
        </div>
        <p class="pin-chart__note">{{ copy.note }}<br />{{ copy.source }}</p>
      </figure>
    </div>

    <!-- 圖表下方的文字：跑道結束後才接上來 -->
    <div v-if="$slots.default" class="pin-chart__after">
      <slot />
    </div>
  </div>
</template>
