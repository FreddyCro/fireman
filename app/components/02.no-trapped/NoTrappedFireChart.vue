<!--
  02 重大火災 vs 殉職人數：pc 版捲動動畫（設計稿 CH 2726:218165，只有 pc；平板、手機沿用 ui/PinChart）。
  跑道 sticky 100svh，舞台是 1280×720 的設計座標，依視窗高度等比縮小。
  點、長條、折線用 Canvas 畫（3 萬多顆點），文字留在 HTML 跟著同一套座標；
  時間軸與版面在 utils/02.no-trapped/fireChart.ts。
-->
<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import {
  buildFireDots,
  CHART,
  clamp01,
  COMPARE,
  countsAt,
  deathH,
  DEATHS,
  drawFireChart,
  FIRES,
  FRAME,
  lerp,
  PERIODS,
  snapReduced,
  stateAt,
  TEXT_TOP,
  TRACK_VH,
  YEARS,
} from '~/utils/02.no-trapped/fireChart';
import type { FireDots } from '~/utils/02.no-trapped/fireChart';
import { PC_BREAKPOINTS } from '~/utils/constants';
import './NoTrappedFireChart.scss';

const props = defineProps<{
  copy: {
    title: string;
    periods: string[];
    fires: { label: string; count: string };
    deaths: { label: string; count: string };
    diff: string;
    chartTitle: string;
    legend: { fires: string; deaths: string };
  };
  alt: string;
  note: string;
  source: string;
}>();

const { locale } = useI18n();
// 中文稿數字不分位（35085件），英文用千分位
const fmt = (n: number, sign = false) =>
  new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'zh-TW', {
    useGrouping: locale.value === 'en',
    signDisplay: sign ? 'always' : 'auto',
  }).format(n);

const track = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const progress = ref(0);
const scale = ref(1);
const reduced = ref(false);
const pos = computed(() => (reduced.value ? snapReduced(progress.value) : progress.value));
const state = computed(() => stateAt(pos.value));

// ── 點只建一次 ──
let dots: FireDots | null = null;
// 先讀 state 再判斷 dots（dots 不是 reactive，SSR 時是 null，要讓 computed 追蹤到捲動）
const counts = computed(() => {
  const shrink = state.value.shrink;
  return dots ? countsAt(dots, shrink) : PERIODS[0];
});

// ── 設計稿 1、2 的文字 ──
const shrinkT = computed(() => state.value.shrink);
const periodSwap = computed(() => clamp01((shrinkT.value - 0.4) / 0.2));
const diffOpacity = computed(() => clamp01((shrinkT.value - 0.8) / 0.2));
const labels = computed(() => {
  const t = shrinkT.value;
  const [before, after] = PERIODS;
  return [
    {
      id: 'fires',
      label: props.copy.fires.label,
      count: props.copy.fires.count.replace('{n}', fmt(counts.value.fires)),
      diff: props.copy.diff.replace('{d}', fmt(after.fires - before.fires, true)),
      x: lerp(COMPARE[0].fireLabelX, COMPARE[1].fireLabelX, t),
    },
    {
      id: 'deaths',
      label: props.copy.deaths.label,
      count: props.copy.deaths.count.replace('{n}', fmt(counts.value.deaths)),
      diff: props.copy.diff.replace('{d}', fmt(after.deaths - before.deaths, true)),
      x: lerp(COMPARE[0].deathLabelX, COMPARE[1].deathLabelX, t),
    },
  ];
});

// ── 設計稿 5 的座標軸 ──
const ticks = Array.from({ length: 8 }, (_, k) => ({
  y: CHART.base - deathH(k),
  fires: k * 1000,
  deaths: k,
}));
const years = YEARS.map((y, i) => ({ y, x: CHART.yearX0 + i * CHART.yearPitch }));

// ── 量尺寸：舞台依視窗高度縮放，Canvas 依實際像素出圖 ──
let dpr = 1;
function measure() {
  scale.value = Math.min(1, window.innerHeight / FRAME.h, window.innerWidth / FRAME.w);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (!canvas.value) return;
  canvas.value.width = Math.round(FRAME.w * scale.value * dpr);
  canvas.value.height = Math.round(FRAME.h * scale.value * dpr);
  schedule();
}

let raf = 0;
function draw() {
  raf = 0;
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || !dots) return;
  const k = scale.value * dpr;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, FRAME.w, FRAME.h);
  drawFireChart(ctx, dots, state.value, 1 / k);
}
function schedule() {
  if (!raf) raf = requestAnimationFrame(draw);
}
watch(pos, schedule);

// 只有 pc 才動（平板、手機這個元件被藏起來）
let mq: MediaQueryList | null = null;
let st: ScrollTrigger | null = null;
function setup() {
  if (st || !mq?.matches) return;
  dots ??= buildFireDots();
  gsap.registerPlugin(ScrollTrigger);
  st = ScrollTrigger.create({
    trigger: track.value,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (progress.value = self.progress),
    onRefresh: (self) => (progress.value = self.progress),
  });
  measure();
}
function teardown() {
  st?.kill();
  st = null;
}
const onMq = () => (mq?.matches ? setup() : teardown());

onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  mq = matchMedia(`(min-width: ${PC_BREAKPOINTS}px)`);
  mq.addEventListener('change', onMq);
  window.addEventListener('resize', measure);
  setup();
});
onBeforeUnmount(() => {
  mq?.removeEventListener('change', onMq);
  window.removeEventListener('resize', measure);
  teardown();
  cancelAnimationFrame(raf);
});
</script>

<template>
  <div class="no-trapped-fire-chart">
    <div ref="track" class="no-trapped-fire-chart__track" :style="{ '--track': TRACK_VH }">
      <div class="no-trapped-fire-chart__stage">
        <div
          class="no-trapped-fire-chart__frame"
          :style="{ width: `${FRAME.w}px`, height: `${FRAME.h}px`, '--scale': scale }"
        >
          <canvas ref="canvas" class="no-trapped-fire-chart__canvas" aria-hidden="true" />

          <!-- 設計稿 1、2：數量對比 -->
          <div class="no-trapped-fire-chart__compare" :style="{ opacity: state.compareOpacity }" aria-hidden="true">
            <p class="no-trapped-fire-chart__title" :style="{ top: `${TEXT_TOP.title}px` }">{{ copy.title }}</p>
            <p class="no-trapped-fire-chart__period" :style="{ top: `${TEXT_TOP.period}px` }">
              <span :style="{ opacity: 1 - periodSwap }">{{ copy.periods[0] }}</span>
              <span :style="{ opacity: periodSwap }">{{ copy.periods[1] }}</span>
            </p>
            <p
              v-for="l in labels"
              :key="l.id"
              class="no-trapped-fire-chart__label"
              :style="{ top: `${TEXT_TOP.labels}px`, left: `${l.x}px` }"
            >
              {{ l.label }}<br />{{ l.count
              }}<span class="no-trapped-fire-chart__diff" :style="{ opacity: diffOpacity, '--diff': diffOpacity }">{{
                l.diff
              }}</span>
            </p>
          </div>

          <!-- 設計稿 4、5：20 年圖表的框（長條、折線在 Canvas） -->
          <div
            class="no-trapped-fire-chart__chart"
            :style="{ left: `${CHART.x}px`, top: `${CHART.y}px`, width: `${CHART.w}px`, opacity: state.chartOpacity }"
            aria-hidden="true"
          >
            <p class="no-trapped-fire-chart__chart-title">{{ copy.chartTitle }}</p>
            <p class="no-trapped-fire-chart__legend" :style="{ top: `${CHART.legendTop}px` }">
              <span class="no-trapped-fire-chart__legend-item no-trapped-fire-chart__legend-item--line">
                {{ copy.legend.fires }}
              </span>
              <span class="no-trapped-fire-chart__legend-item no-trapped-fire-chart__legend-item--bar">
                {{ copy.legend.deaths }}
              </span>
            </p>
            <template v-for="t in ticks" :key="t.deaths">
              <span class="no-trapped-fire-chart__tick no-trapped-fire-chart__tick--left" :style="{ top: `${t.y}px` }">
                {{ t.fires }}
              </span>
              <span class="no-trapped-fire-chart__tick no-trapped-fire-chart__tick--right" :style="{ top: `${t.y}px` }">
                {{ t.deaths }}
              </span>
            </template>
            <span
              v-for="y in years"
              :key="y.y"
              class="no-trapped-fire-chart__year"
              :style="{ left: `${y.x}px`, top: `${CHART.yearTop}px` }"
            >
              {{ y.y }}
            </span>
            <p class="no-trapped-fire-chart__note" :style="{ top: `${CHART.noteTop}px` }">
              {{ note }}<br />{{ source }}
            </p>
          </div>

          <!-- 給螢幕閱讀器 -->
          <div class="no-trapped-fire-chart__sr">
            <p>{{ alt }}</p>
            <p>
              {{ copy.periods[0] }}: {{ copy.fires.label }} {{ fmt(PERIODS[0].fires) }}, {{ copy.deaths.label }}
              {{ fmt(PERIODS[0].deaths) }}
            </p>
            <p>
              {{ copy.periods[1] }}: {{ copy.fires.label }} {{ fmt(PERIODS[1].fires) }}, {{ copy.deaths.label }}
              {{ fmt(PERIODS[1].deaths) }}
            </p>
            <p>{{ copy.chartTitle }}</p>
            <ul>
              <li v-for="(y, i) in YEARS" :key="y">
                {{ y }}: {{ copy.legend.fires }} {{ FIRES[i] ?? '—' }}, {{ copy.legend.deaths }} {{ DEATHS[i] }}
              </li>
            </ul>
            <p>{{ note }} {{ source }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
