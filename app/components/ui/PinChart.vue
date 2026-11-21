<!--
  pin 住的圖表，捲過 switchAt 換遮罩與標題。
  下方文字（slot）放在跑道外：塞進 sticky 舞台的話手機會超出視窗。
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
      maskStyle: { left: `${s.mask.left}%`, width: `${s.mask.width}%`, bottom: `${s.mask.bottom ?? 0}%` },
      panRight: s.mask.left < 50,
    };
  }),
);

let trigger: ScrollTrigger | null = null;
let resizeObs: ResizeObserver | null = null;

onMounted(() => {
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

    <div v-if="$slots.default" class="pin-chart__after">
      <slot />
    </div>
  </div>
</template>
