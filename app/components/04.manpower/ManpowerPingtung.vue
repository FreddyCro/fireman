<!--
  04 屏東地圖 scrollytelling（設計稿 pc 2423:5543 → 2423:6234 → 2423:6247）。
  跑道每段 100vh，舞台 sticky 100svh：文字逐段淡入淡出；第一段是縣市地圖，第二段起換成屏東市分隊地圖，
  分隊人數數字跳動（起點 STATION_BASE），建國分隊從 0 變有人時字級 23→35。
  版面：mob 文字在上、地圖置中在下；tablet 以上文字在左、地圖在右。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { useStepTrack } from '~/composables/04.manpower/useStepTrack';
import { PINGTUNG_MAPS, STATION_BASE, STATION_IDS, STATION_POS, STATION_STEPS } from '~/utils/04.manpower/stations';
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

const assetUrl = useAssetUrl();
const track = ref<HTMLElement | null>(null);
const { active } = useStepTrack(track, () => props.data.steps.length);

const showCity = computed(() => STATION_STEPS[active.value] != null);

// 數字跳動：reactive 物件給 gsap 補間，畫面顯示四捨五入
const counts = reactive<Record<StationId, number>>({ ...STATION_BASE });
const reduced = ref(false);
let tween: gsap.core.Tween | null = null;

watch(active, (i) => {
  const target = STATION_STEPS[i];
  if (!target) return;
  tween?.kill();
  if (reduced.value) {
    Object.assign(counts, target);
    return;
  }
  tween = gsap.to(counts, { ...target, duration: 0.8, ease: 'power2.out' });
});

onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
});
onBeforeUnmount(() => tween?.kill());

const stations = computed(() =>
  STATION_IDS.map((id) => ({
    id,
    name: props.data.stations[id],
    count: Math.round(counts[id]),
    grown: counts[id] > 0.5,
    style: { left: `${STATION_POS[id].left}%`, top: `${STATION_POS[id].top}%` },
  })),
);
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

        <div class="mp-pingtung__map" :class="{ 'mp-pingtung__map--city': showCity }">
          <!-- 第一段：縣市地圖＋屏東市標籤 -->
          <div class="mp-pingtung__layer mp-pingtung__layer--county" :aria-hidden="showCity">
            <img
              class="mp-pingtung__img"
              :src="assetUrl(PINGTUNG_MAPS.county.src)"
              :width="PINGTUNG_MAPS.county.width"
              :height="PINGTUNG_MAPS.county.height"
              :alt="data.place.join('')"
            />
            <p class="mp-pingtung__place">
              <span v-for="p in data.place" :key="p">{{ p }}</span>
            </p>
          </div>

          <!-- 第二段起：屏東市分隊地圖＋人數 -->
          <div class="mp-pingtung__layer mp-pingtung__layer--city" :aria-hidden="!showCity">
            <img
              class="mp-pingtung__img"
              :src="assetUrl(PINGTUNG_MAPS.city.src)"
              :width="PINGTUNG_MAPS.city.width"
              :height="PINGTUNG_MAPS.city.height"
              alt=""
            />
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
  </div>
</template>
