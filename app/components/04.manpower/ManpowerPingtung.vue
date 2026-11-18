<!--
  04 屏東地圖 scrollytelling（設計稿 pc 2423:5543 → 2423:6234 → 2423:6247）。
  跑道每段 100vh，舞台 sticky 100svh：文字逐段淡入淡出。
  地圖用鄉鎮界圖資畫屏東縣（useTaiwanTowns）：第一段看全縣、屏東市標橘；第二段起 viewBox 補間 zoom in 到屏東市，
  其他鄉鎮淡出、分隊點與人數淡入，人數跳動（起點 STATION_BASE），建國分隊從 0 變有人時字級放大。往回捲反向 zoom out。
  版面：mob 文字在上、地圖置中在下；tablet 以上文字在左、地圖在右。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { townsBbox, useTaiwanTowns } from '~/composables/04.manpower/useTaiwanTowns';
import { useStepTrack } from '~/composables/04.manpower/useStepTrack';
import { fitBox, project, toPct, viewBoxStr } from '~/utils/04.manpower/geo';
import type { ViewBox } from '~/utils/04.manpower/geo';
import {
  PINGTUNG_CAMERA,
  PINGTUNG_CITY,
  PINGTUNG_COUNTY,
  STATION_BASE,
  STATION_COORDS,
  STATION_IDS,
  STATION_STEPS,
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
const { active } = useStepTrack(track, () => props.data.steps.length);
const zoomed = computed(() => STATION_STEPS[active.value] != null);

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
const counts = reactive<Record<StationId, number>>({ ...STATION_BASE });
let countTween: gsap.core.Tween | null = null;

watch(active, (i) => {
  const target = STATION_STEPS[i];
  if (!target) return;
  countTween?.kill();
  if (reduced.value) {
    Object.assign(counts, target);
    return;
  }
  countTween = gsap.to(counts, { ...target, duration: 0.8, delay: 0.4, ease: 'power2.out' });
});

const stations = computed(() =>
  STATION_IDS.map((id) => {
    const pt = project(...STATION_COORDS[id]);
    return {
      id,
      name: props.data.stations[id],
      count: Math.round(counts[id]),
      grown: counts[id] > 0.5,
      cx: pt[0],
      cy: pt[1],
      style: cityView.value ? toPct(cityView.value, pt) : undefined,
    };
  }),
);
// 點的半徑：在屏東市視角下約 8px（設計稿 r 7.7，容器 317 寬）
const dotR = computed(() => (cityView.value ? (cityView.value.w / 317) * 7.7 : 0));

onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
});
onBeforeUnmount(() => {
  camTween?.kill();
  countTween?.kill();
});
</script>

<template>
  <div ref="track" class="mp-pingtung" :style="{ '--steps': data.steps.length }">
    <div class="mp-pingtung__stage">
      <div class="mp-pingtung__inner">
        <div class="mp-pingtung__texts">
          <p
            v-for="(step, i) in data.steps"
            :key="i"
            class="mp-pingtung__text"
            :class="{ 'mp-pingtung__text--active': i === active }"
            :aria-hidden="i !== active"
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
          </svg>

          <!-- 第一段：縣市標籤 -->
          <p v-if="placeStyle" class="mp-pingtung__place" :style="placeStyle">
            <span v-for="p in data.place" :key="p">{{ p }}</span>
          </p>

          <!-- 第二段起：分隊名稱＋人數 -->
          <p v-for="s in stations" :key="s.id" class="mp-pingtung__station" :style="s.style">
            <span class="mp-pingtung__station-name">{{ s.name }}</span>
            <span class="mp-pingtung__station-count" :class="{ 'mp-pingtung__station-count--grown': s.grown }">
              {{ s.count }}{{ data.unit }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
