<!--
  04 屏東地圖 scrollytelling（設計稿 pc 2423:5543 → 2423:6234 → 2423:6247）。
  跑道每格 100vh，舞台 sticky 100svh；分鏡見 stations.ts 的 PINGTUNG_BEATS（文字段落與動畫分開，換段先換字、再捲一格才動）。
  地圖用鄉鎮界圖資畫屏東縣（useTaiwanTowns）：第一格看全縣、屏東市標橘；之後 viewBox 補間 zoom in 到屏東市，
  其他鄉鎮淡出、分隊點與人數淡入。動畫格：小圓點沿弧線在屏東／公館與建國之間移動，人數同步跳動並標增減，
  人數字級固定。往回捲反向播放。
  版面：mob 文字在上、地圖置中在下；tablet 以上文字在左、地圖在右。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { townsBbox, useTaiwanTowns } from '~/composables/04.manpower/useTaiwanTowns';
import { useStepTrack } from '~/composables/04.manpower/useStepTrack';
import { arcPoint, dotOpacity, dotProgress } from '~/utils/04.manpower/flow';
import { fitBox, project, toPct, viewBoxStr } from '~/utils/04.manpower/geo';
import type { ViewBox } from '~/utils/04.manpower/geo';
import {
  FLOW_DOTS,
  FLOW_DURATION,
  FLOW_ROUTES,
  PINGTUNG_BEATS,
  PINGTUNG_CAMERA,
  PINGTUNG_CITY,
  PINGTUNG_COUNTY,
  STATION_BASE,
  STATION_COORDS,
  STATION_IDS,
} from '~/utils/04.manpower/stations';
import type { StationId } from '~/utils/04.manpower/stations';
import './ManpowerPingtung.scss';

const props = defineProps<{
  data: {
    steps: string[];
    place: string[];
    stations: Record<StationId, string>;
    unit: string;
  };
}>();

const track = ref<HTMLElement | null>(null);
const { active } = useStepTrack(track, PINGTUNG_BEATS.length);
const beat = computed(() => PINGTUNG_BEATS[active.value]!);
const zoomed = computed(() => beat.value.counts != null);
// TODO 暫時：地圖上方顯示分鏡編號，與設計溝通用，定稿後移除（連同 scss 的 &__debug）
const DEBUG_BEAT_LABELS = ['0 全縣', 'A｜01', 'B｜02 連續動作', 'C｜02 換文字', 'D｜03 連續動作'];

// ── 地圖 ──
const towns = useTaiwanTowns([PINGTUNG_COUNTY]);
const city = computed(() => towns.value.find((t) => t.code === PINGTUNG_CITY));
const others = computed(() => towns.value.filter((t) => t.code !== PINGTUNG_CITY));

const countyView = computed(() =>
  towns.value.length ? fitBox(townsBbox(towns.value), PINGTUNG_CAMERA.countyPad, PINGTUNG_CAMERA.aspect) : null,
);
const cityView = computed(() =>
  city.value ? fitBox(city.value.bbox, PINGTUNG_CAMERA.cityPad, PINGTUNG_CAMERA.aspect) : null,
);

// viewBox 由 gsap 補間（reactive 物件），畫面用字串
const view = reactive<ViewBox>({ x: 0, y: 0, w: 1, h: 1 });
const viewBox = computed(() => viewBoxStr(view));
const reduced = ref(false);
let camTween: gsap.core.Tween | null = null;

function moveCamera(animate: boolean) {
  const target = zoomed.value ? cityView.value : countyView.value;
  if (!target) return;
  camTween?.kill();
  if (!animate || reduced.value) {
    Object.assign(view, target);
    return;
  }
  camTween = gsap.to(view, { ...target, duration: PINGTUNG_CAMERA.duration, ease: 'power2.inOut' });
}

// 圖資載入後先定位（不補間），之後隨段落切換 zoom
watch(countyView, () => moveCamera(false));
watch(zoomed, () => moveCamera(true));

// 縣市標籤：放在屏東市西側、垂直置中（依全縣視角換算 %）
const placeStyle = computed(() => {
  if (!city.value || !countyView.value) return undefined;
  const b = city.value.bbox;
  return toPct(countyView.value, [b[0], (b[1] + b[3]) / 2]);
});

// ── 分隊：點在 SVG 裡、標籤用 HTML 疊在上面（依屏東市視角換算 %） ──
// counts 人數、flow.p 小圓點進度（0＝在屏東／公館、1＝到建國），同一支 timeline 同步補間
const counts = reactive<Record<StationId, number>>({ ...STATION_BASE });
const flow = reactive({ p: 0 });
let beatTl: gsap.core.Timeline | null = null;
// 增減標註只在小圓點停下時顯示（移動中隱藏，結束才出現）
const settled = ref(true);

watch(beat, (b) => {
  if (!b.counts) return;
  const p = b.flow === 'jianguo' ? 1 : 0;
  beatTl?.kill();
  if (reduced.value) {
    Object.assign(counts, b.counts);
    flow.p = p;
    settled.value = true;
    return;
  }
  if (flow.p !== p) settled.value = false;
  beatTl = gsap
    .timeline({ onComplete: () => (settled.value = true) })
    .to(counts, { ...b.counts, duration: FLOW_DURATION, ease: 'power2.inOut' }, 0)
    .to(flow, { p, duration: FLOW_DURATION, ease: 'power1.inOut' }, 0);
});

const fmtDelta = (d: number) => `(${d > 0 ? '+' : ''}${d})`;

const stations = computed(() =>
  STATION_IDS.map((id) => {
    const pt = project(...STATION_COORDS[id]);
    return {
      id,
      name: props.data.stations[id],
      delta: settled.value ? beat.value.deltas[id] : undefined,
      count: Math.round(counts[id]),
      cx: pt[0],
      cy: pt[1],
      style: cityView.value ? toPct(cityView.value, pt) : undefined,
    };
  }),
);
// 點的半徑：在屏東市視角下約 8px（設計稿 r 7.7，容器 317 寬）
const dotR = computed(() => (cityView.value ? (cityView.value.w / 317) * 7.7 : 0));

// 移動中的小圓點：每條路線 FLOW_DOTS 顆，停在端點時隱藏
const routes = FLOW_ROUTES.map((r) => ({
  ...r,
  a: project(...STATION_COORDS[r.from]),
  b: project(...STATION_COORDS.jianguo),
}));
const flowDots = computed(() =>
  routes.flatMap((r) =>
    Array.from({ length: FLOW_DOTS }, (_, i) => {
      const t = dotProgress(flow.p, i, FLOW_DOTS);
      const [cx, cy] = arcPoint(r.a, r.b, r.bend, t);
      return { key: `${r.from}-${i}`, cx, cy, opacity: dotOpacity(t) };
    }),
  ),
);

onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
});
onBeforeUnmount(() => {
  camTween?.kill();
  beatTl?.kill();
});
</script>

<template>
  <div ref="track" class="mp-pingtung" :style="{ '--steps': PINGTUNG_BEATS.length }">
    <div class="mp-pingtung__stage">
      <div class="mp-pingtung__inner">
        <div class="mp-pingtung__texts">
          <p
            v-for="(step, i) in data.steps"
            :key="i"
            class="mp-pingtung__text"
            :class="{ 'mp-pingtung__text--active': i === beat.text }"
            :aria-hidden="i !== beat.text"
          >
            {{ step }}
          </p>
        </div>

        <div class="mp-pingtung__map" :class="{ 'mp-pingtung__map--zoomed': zoomed }">
          <svg
            class="mp-pingtung__svg"
            :viewBox="viewBox"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            :aria-label="data.place.join('')"
          >
            <path v-for="t in others" :key="t.code" class="mp-pingtung__town" :d="t.d" />
            <path v-if="city" class="mp-pingtung__town mp-pingtung__town--city" :d="city.d" />
            <circle v-for="s in stations" :key="s.id" class="mp-pingtung__dot" :cx="s.cx" :cy="s.cy" :r="dotR" />
            <circle
              v-for="d in flowDots"
              :key="d.key"
              class="mp-pingtung__flow-dot"
              :cx="d.cx"
              :cy="d.cy"
              :r="dotR * 0.4"
              :opacity="d.opacity"
            />
          </svg>

          <!-- TODO 暫時：分鏡編號 -->
          <p class="mp-pingtung__debug">{{ DEBUG_BEAT_LABELS[active] }}</p>

          <!-- 第一段：縣市標籤 -->
          <p v-if="placeStyle" class="mp-pingtung__place" :style="placeStyle">
            <span v-for="p in data.place" :key="p">{{ p }}</span>
          </p>

          <!-- 第二段起：分隊名稱＋人數 -->
          <p v-for="s in stations" :key="s.id" class="mp-pingtung__station" :style="s.style">
            <span class="mp-pingtung__station-name">
              {{ s.name }}<span v-if="s.delta != null" class="mp-pingtung__station-delta">{{ fmtDelta(s.delta) }}</span>
            </span>
            <span class="mp-pingtung__station-count">
              {{ s.count }}{{ data.unit }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
