<!--
  04 分隊駐點的四縣市地圖（設計稿 pc 2423:5605、pad 2423:26598、mob 2423:16361）。
  上方：目前縣市的說明＋圖例（文字欄寬）；下方：滿版地圖帶輪播，中間那張全亮、左右 30%，左右箭頭切換，點旁邊的圖也能切。
  地圖目前是設計稿暫用圖；hover 彈出視窗等地圖 JSON 進來再做。
-->
<script setup lang="ts">
import { MAP_ARROW, REGION_START, REGIONS } from '~/utils/04.manpower/maps';
import type { RegionId } from '~/utils/04.manpower/maps';
import './ManpowerMaps.scss';

const props = defineProps<{
  data: {
    regions: Record<RegionId, { name: string; caption: string }>;
    legend: { min: string; max: string; stations: string };
    prev: string;
    next: string;
  };
}>();

const assetUrl = useAssetUrl();
const active = ref(REGION_START);

const regions = computed(() => REGIONS.map((r) => ({ ...r, ...props.data.regions[r.id] })));

const go = (i: number) => {
  active.value = Math.min(Math.max(i, 0), REGIONS.length - 1);
};
</script>

<template>
  <figure class="mp-maps">
    <figcaption class="mp-maps__head">
      <!-- 四個縣市的說明疊在同一格，高度取最長的，切換時下方不跳動 -->
      <div class="mp-maps__captions" aria-live="polite">
        <p
          v-for="(r, i) in regions"
          :key="r.id"
          class="mp-maps__caption"
          :class="{ 'mp-maps__caption--active': i === active }"
          :aria-hidden="i !== active"
        >
          {{ r.name }}<template v-if="r.caption">｜{{ r.caption }}</template>
        </p>
      </div>
      <p class="mp-maps__legend">
        <span class="mp-maps__legend-scale">
          <span>{{ data.legend.min }}</span>
          <span class="mp-maps__legend-bar" aria-hidden="true" />
          <span>{{ data.legend.max }}</span>
        </span>
        <span class="mp-maps__legend-station">
          <span class="mp-maps__legend-dot" aria-hidden="true" />
          {{ data.legend.stations }}
        </span>
      </p>
    </figcaption>

    <div class="mp-maps__strip">
      <ul class="mp-maps__list" :style="{ '--i': active }">
        <li
          v-for="(r, i) in regions"
          :key="r.id"
          class="mp-maps__item"
          :class="{ 'mp-maps__item--active': i === active }"
          @click="go(i)"
        >
          <img class="mp-maps__img" :src="assetUrl(r.src)" :width="r.width" :height="r.height" :alt="r.name" loading="lazy" />
        </li>
      </ul>
      <button
        type="button"
        class="mp-maps__arrow mp-maps__arrow--prev"
        :disabled="active === 0"
        :aria-label="data.prev"
        @click="go(active - 1)"
      >
        <img :src="assetUrl(MAP_ARROW)" alt="" width="17" height="18" />
      </button>
      <button
        type="button"
        class="mp-maps__arrow mp-maps__arrow--next"
        :disabled="active === regions.length - 1"
        :aria-label="data.next"
        @click="go(active + 1)"
      >
        <img :src="assetUrl(MAP_ARROW)" alt="" width="17" height="18" />
      </button>
    </div>
  </figure>
</template>
