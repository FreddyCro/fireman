<!--
  04 各國消防員服務比（設計稿 pc 2423:5630＋旁邊狀態 2423:6578、2423:7940、2423:10049；pad 2423:26623；mob 2426:35）。
  跑道四段、舞台 sticky 100svh。圓點用 Canvas 逐顆畫，跟著捲動在四個 stage 之間連續移動（版面計算在 utils/04.manpower/chartDots.ts）：
    0 一位民眾 → 1 日本 724（大白點縮成第一格、其餘依序冒出）→ 2 日本 vs 台灣（白底複製滑開、橘點疊上、+77%）
    → 3 五國長條（重排成長條，台灣保留白底＋橘頂，其他三國從底部長出）
  文字（標題、國名、數字）留在 HTML、跟著同一套座標移動；畫面是裝飾，另附一份給螢幕閱讀器的文字版。
  圖下方接註解與資料來源（不 pin）。
-->
<script setup lang="ts">
import { useStepTrack } from '~/composables/04.manpower/useStepTrack';
import { buildLayout, drawDots, lerpStage, STAGES, stagePos } from '~/utils/04.manpower/chartDots';
import type { ChartLayout } from '~/utils/04.manpower/chartDots';
import { COMPARE, COUNTRIES, SOURCES } from '~/utils/04.manpower/staffing';
import type { CountryId, SourceId } from '~/utils/04.manpower/staffing';
import { TABLET_BREAKPOINTS } from '~/utils/constants';
import './ManpowerChart.scss';

const props = defineProps<{
  data: {
    intro: { label: string; question: string; person: string };
    title: string;
    countries: Record<CountryId, string>;
    unit: string;
    unitNote: string;
    note: string;
    sources: { label: string; sep: string; end: string; items: Record<SourceId, string> };
  };
}>();

const track = ref<HTMLElement | null>(null);
const box = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const introDot = ref<HTMLElement | null>(null);
const titleEl = ref<HTMLElement | null>(null);
const { progress } = useStepTrack(track, STAGES);

// 系統設定減少動態：不做轉場，直接停在各 stage
const reduced = ref(false);
const pos = computed(() => {
  const p = stagePos(progress.value);
  return reduced.value ? Math.round(p) : p;
});

// ── 版面：量容器與 stage 0 大白點佔位，算出每顆點的位置 ──
const layout = shallowRef<ChartLayout | null>(null);
const wide = ref(false);
let dpr = 1;

function measure() {
  if (!box.value || !canvas.value || !introDot.value || !titleEl.value) return;
  const b = box.value.getBoundingClientRect();
  const d = introDot.value.getBoundingClientRect();
  wide.value = window.innerWidth >= TABLET_BREAKPOINTS;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.value.width = Math.round(b.width * dpr);
  canvas.value.height = Math.round(b.height * dpr);
  layout.value = buildLayout({
    w: b.width,
    h: b.height,
    wide: wide.value,
    titleBottom: titleEl.value.getBoundingClientRect().bottom - b.top,
    introX: d.left - b.left + d.width / 2,
    introY: d.top - b.top + d.height / 2,
  });
}

// ── 畫：pos 或版面變了就排一個 rAF ──
let raf = 0;
function draw() {
  raf = 0;
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || !layout.value) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height);
  drawDots(ctx, layout.value, pos.value);
}
watch([pos, layout], () => {
  if (!raf) raf = requestAnimationFrame(draw);
});

let resizeObs: ResizeObserver | null = null;
onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  measure();
  resizeObs = new ResizeObserver(() => measure());
  resizeObs.observe(box.value!);
});
onBeforeUnmount(() => {
  resizeObs?.disconnect();
  cancelAnimationFrame(raf);
});

// ── 文字：透明度與位置跟著 pos ──
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const introOpacity = computed(() => clamp01(1 - pos.value * 2));
// 問句先淡出（0～0.5），標題、國名才淡入，避免疊字
const titleOpacity = computed(() => clamp01(pos.value * 2 - 1));

const from = COUNTRIES.find((c) => c.id === COMPARE.from)!;
const to = COUNTRIES.find((c) => c.id === COMPARE.to)!;
const diffPct = Math.round((to.perFirefighter / from.perFirefighter - 1) * 100);

/** 各國標籤從哪個 stage 開始出現（日本 1、台灣 2、其他 3） */
const appearAt = (id: CountryId) => (id === from.id ? 1 : id === to.id ? 2 : 3);

// 字級：stage 1、2 是大字（國名＋大數字），stage 3 縮成長條上方的小字
const FONT = {
  wide: { name: [30, 20], value: [72, 32], unit: 30 },
  narrow: { name: [22, 15], value: [48, 22], unit: 22 },
};

const labels = computed(() => {
  const L = layout.value;
  if (!L) return [];
  const f = wide.value ? FONT.wide : FONT.narrow;
  const t3 = clamp01(pos.value - 2); // 往長條縮的進度
  return COUNTRIES.map((c) => {
    const start = appearAt(c.id);
    const opacity = clamp01((pos.value - (start - 1)) * 2 - 1);
    // 數字跳動：日本 1 → 724（0→1）、台灣 724 → 1280（1→2），其他國家直接顯示
    let value = c.perFirefighter;
    if (c.id === from.id) value = Math.round(1 + (c.perFirefighter - 1) * clamp01(pos.value));
    if (c.id === to.id) value = Math.round(from.perFirefighter + (c.perFirefighter - from.perFirefighter) * clamp01(pos.value - 1));
    return {
      id: c.id,
      name: props.data.countries[c.id],
      value,
      accent: !!c.highlight,
      style: {
        left: `${lerpStage(L.labelX[c.id], pos.value)}px`,
        top: `${L.labelTop}px`,
        opacity,
        visibility: opacity > 0 ? ('visible' as const) : ('hidden' as const),
      },
      nameSize: `${f.name[0]! + (f.name[1]! - f.name[0]!) * t3}px`,
      valueSize: `${f.value[0]! + (f.value[1]! - f.value[0]!) * t3}px`,
      unitStyle: { fontSize: `${f.unit}px`, opacity: 1 - t3 },
    };
  });
});

// +77%：台灣橘點疊完才出現，進到長條前淡出
const diffStyle = computed(() => {
  const L = layout.value;
  if (!L) return { opacity: 0 };
  const opacity = clamp01((pos.value - 1.7) * 4) * clamp01(1 - (pos.value - 2) * 4);
  return { left: `${L.labelX[to.id][2]}px`, top: `${L.diffY}px`, opacity };
});
const unitNoteOpacity = computed(() => clamp01((pos.value - 2.5) * 2));

const sources = computed(() => SOURCES.map((s) => ({ ...s, name: props.data.sources.items[s.id] })));
</script>

<template>
  <div class="mp-chart">
    <div ref="track" class="mp-chart__track" :style="{ '--steps': STAGES }">
      <div class="mp-chart__stage">
        <div ref="box" class="mp-chart__box">
          <canvas ref="canvas" class="mp-chart__canvas" aria-hidden="true" />

          <!-- 畫面（裝飾） -->
          <div class="mp-chart__visual" aria-hidden="true">
            <div class="mp-chart__intro" :style="{ opacity: introOpacity }">
              <p class="mp-chart__intro-label">{{ data.intro.label }}</p>
              <p class="mp-chart__intro-question">{{ data.intro.question }}</p>
              <p class="mp-chart__person">
                {{ data.intro.person }}
                <!-- 大白點由 Canvas 畫，這裡只佔位、給 Canvas 量位置 -->
                <span ref="introDot" class="mp-chart__person-dot" />
              </p>
            </div>

            <p ref="titleEl" class="mp-chart__title" :style="{ opacity: titleOpacity }">{{ data.title }}</p>

            <div
              v-for="l in labels"
              :key="l.id"
              class="mp-chart__label"
              :class="{ 'mp-chart__label--accent': l.accent }"
              :style="l.style"
            >
              <span class="mp-chart__name" :style="{ fontSize: l.nameSize }">{{ l.name }}</span>
              <span class="mp-chart__value" :style="{ fontSize: l.valueSize }">
                {{ l.value }}<span class="mp-chart__unit" :style="l.unitStyle">{{ data.unit }}</span>
              </span>
            </div>

            <p class="mp-chart__diff" :style="diffStyle">+{{ diffPct }}%</p>
            <p v-if="data.unitNote" class="mp-chart__unit-note" :style="{ opacity: unitNoteOpacity }">
              {{ data.unitNote }}
            </p>
          </div>

          <!-- 給螢幕閱讀器的文字版 -->
          <div class="mp-chart__sr">
            <p>{{ data.intro.label }}{{ data.intro.question }}</p>
            <p>{{ data.title }}</p>
            <ul>
              <li v-for="c in COUNTRIES" :key="c.id">{{ data.countries[c.id] }} {{ c.perFirefighter }}{{ data.unit }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="mp-chart__note">
      <p>{{ data.note }}</p>
      <p>
        {{ data.sources.label }}<template v-for="(s, i) in sources" :key="s.id"
          ><template v-if="i > 0">{{ data.sources.sep }}</template
          ><a v-if="s.href" :href="s.href" target="_blank" rel="noopener noreferrer">{{ s.name }}</a
          ><template v-else>{{ s.name }}</template></template
        >{{ data.sources.end }}
      </p>
    </div>
  </div>
</template>
