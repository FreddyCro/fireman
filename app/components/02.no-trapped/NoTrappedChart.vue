<!--
  pin 住的圖表：跑道 CHART_TRACK_VH 高，舞台 sticky 置中（同參考頁 scroll-sticky-wrapper 的做法）。
  ScrollTrigger 只負責算跑道進度，過 CHART_SWITCH_AT 切到第二組：標題／圖例淡入淡出，
  圖上兩塊黑色半透明遮罩（右半／左半）opacity .3s 交替：先遮右邊（前 10 年）再遮左邊（近 10 年）。位置在 utils 的 CHART_SLIDES.mask。
  手機：圖比容器寬（scss 的 --pan），第一組看左半、第二組整張圖向左橫移露出右半，回捲移回。
  往回捲會切回第一組。
-->
<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHART_SLIDES, CHART_SVG, CHART_SWITCH_AT, CHART_TRACK_VH } from '~/utils/02.no-trapped/chart';

const assetUrl = useAssetUrl();
const str = useCopy().noTrapped.chart;
const track = ref<HTMLElement | null>(null);
const active = ref(0);
const slides = CHART_SLIDES.map((s) => ({
  ...s,
  ...str.slides[s.id],
  maskStyle: { left: `${s.mask.left}%`, width: `${s.mask.width}%` },
}));

let trigger: ScrollTrigger | null = null;

onMounted(() => {
  trigger = ScrollTrigger.create({
    trigger: track.value,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      active.value = self.progress >= CHART_SWITCH_AT ? 1 : 0;
    },
  });
});

onBeforeUnmount(() => {
  trigger?.kill();
  trigger = null;
});
</script>

<template>
  <div ref="track" class="sec-no-trapped__chart-track" :style="{ '--track': CHART_TRACK_VH }">
    <figure class="sec-no-trapped__chart">
      <figcaption class="sec-no-trapped__chart-head">
        <div
          v-for="(s, i) in slides"
          :key="s.id"
          class="sec-no-trapped__chart-text"
          :class="{ 'is-active': i === active }"
          :aria-hidden="i !== active"
        >
          <h3 class="sec-no-trapped__chart-title">{{ s.title }}</h3>
          <p class="sec-no-trapped__chart-legend">
            <span class="sec-no-trapped__chart-legend-item sec-no-trapped__chart-legend-item--line">{{ s.fires }}</span>
            <span class="sec-no-trapped__chart-legend-item sec-no-trapped__chart-legend-item--bar">{{ s.deaths }}</span>
          </p>
        </div>
      </figcaption>
      <div class="sec-no-trapped__chart-fig">
        <div class="sec-no-trapped__chart-pan" :class="{ 'sec-no-trapped__chart-pan--after': active === 1 }">
          <img class="sec-no-trapped__chart-img" :src="assetUrl(CHART_SVG)" :alt="str.alt" />
          <div
            v-for="(s, i) in slides"
            :key="s.id"
            class="sec-no-trapped__chart-mask"
            :class="{ 'is-active': i === active }"
            :style="s.maskStyle"
            aria-hidden="true"
          />
        </div>
      </div>
      <p class="sec-no-trapped__chart-note">{{ str.note }}<br />{{ str.source }}</p>
    </figure>
  </div>
</template>
