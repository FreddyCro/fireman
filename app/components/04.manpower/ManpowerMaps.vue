<!--
  04 分隊駐點的四縣市地圖（設計稿 pc 2423:5605、pad 2423:26598、mob 2423:16361）。
  上方：目前縣市的說明＋圖例（文字欄寬）；下方：滿版地圖帶輪播，中間那張全亮、左右 30%，左右箭頭切換，點旁邊的圖也能切。
  循環輪播：最後一張的下一張接回第一張，兩側永遠有鄰圖、箭頭不停用。
  做法：pos 是不設上限的虛擬位置（目前縣市 = pos mod 4），只畫 pos 前後各 SPAN 張、以虛擬位置當 key；
  每張依「與 pos 的距離」平移，捲動時既有的圖各自滑動、畫面外的一端補新圖另一端移除，不會倒捲回第一張。
  地圖用鄉鎮界圖資畫（useTaiwanTowns），鄉鎮依火災通報數上色、疊消防分隊據點（資料在 utils/04.manpower/maps.ts，POC 先留空）。
  中間那張的鄉鎮可 hover／點擊，彈出鄉鎮名稱與通報數（設計註記 2477:7203）。
-->
<script setup lang="ts">
import { townsBbox, useTaiwanTowns } from '~/composables/04.manpower/useTaiwanTowns';
import { fitBox, project, viewBoxStr } from '~/utils/04.manpower/geo';
import { FIRE_COUNTS, FIRE_STATIONS, MAP_ARROW, REGION_START, REGIONS, fireColor } from '~/utils/04.manpower/maps';
import type { FireStation, RegionId } from '~/utils/04.manpower/maps';
import './ManpowerMaps.scss';

const props = defineProps<{
  data: {
    regions: Record<RegionId, { name: string; caption: string }>;
    legend: { min: string; max: string; stations: string };
    popupCount: string;
    prev: string;
    next: string;
  };
}>();

const assetUrl = useAssetUrl();
const { locale } = useI18n();
/** 虛擬位置（不設上限）；目前縣市 = active */
const pos = ref(REGION_START);
const N = REGIONS.length;
const mod = (v: number) => ((v % N) + N) % N;
const active = computed(() => mod(pos.value));
/** 前後各畫幾張：±2 在 pc 1990px 以下的寬度都在畫面外，多一張給更寬的螢幕 */
const SPAN = 3;

const towns = useTaiwanTowns(REGIONS.map((r) => r.county));

const regions = computed(() =>
  REGIONS.map((r) => {
    const list = towns.value.filter((t) => t.county === r.county);
    const view = list.length ? fitBox(townsBbox(list), 0.04) : null;
    return {
      ...r,
      ...props.data.regions[r.id],
      viewBox: view ? viewBoxStr(view) : undefined,
      towns: list.map((t) => ({
        code: t.code,
        d: t.d,
        name: locale.value === 'en' ? t.nameEn : t.name,
        count: FIRE_COUNTS[t.code],
        fill: fireColor(FIRE_COUNTS[t.code]),
      })),
      // 據點畫成一條 path：每點一段零長度線段，配圓頭＋不縮放線寬，各斷點都是固定像素大小的圓
      pins: (FIRE_STATIONS as FireStation[])
        .filter((s) => s.county === r.county)
        .map((s) => {
          const [x, y] = project(s.lon, s.lat);
          return `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
        })
        .join(''),
    };
  }),
);

/** 地圖帶上實際畫出的圖：虛擬位置 v、相對目前位置的距離 offset、對應的縣市 */
const slots = computed(() =>
  Array.from({ length: SPAN * 2 + 1 }, (_, k) => {
    const v = pos.value - SPAN + k;
    return { v, offset: v - pos.value, region: regions.value[mod(v)]! };
  }),
);

/** 往前／往後走 step 張（循環） */
const go = (step: number) => {
  pos.value += step;
  popup.value = null;
};

// ── 彈出視窗：hover（滑鼠）或點擊（觸控）鄉鎮時出現在指標旁 ──
const strip = ref<HTMLElement | null>(null);
const popup = ref<{ code: string; text: string; x: number; y: number } | null>(null);

function showPopup(e: PointerEvent, t: { code: string; name: string; count?: number }) {
  const box = strip.value?.getBoundingClientRect();
  if (!box) return;
  const count = t.count == null ? '' : `｜${props.data.popupCount.replace('{count}', String(t.count))}`;
  popup.value = { code: t.code, text: `${t.name}${count}`, x: e.clientX - box.left, y: e.clientY - box.top };
}

function hidePopup(e: PointerEvent) {
  if (e.pointerType === 'mouse') popup.value = null;
}
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

    <div ref="strip" class="mp-maps__strip" @pointerleave="popup = null">
      <ul class="mp-maps__list">
        <li
          v-for="{ v, offset, region: r } in slots"
          :key="v"
          class="mp-maps__item"
          :class="{ 'mp-maps__item--active': offset === 0 }"
          :style="{ '--o': offset }"
          :aria-hidden="offset !== 0"
          @click="offset !== 0 && go(offset)"
        >
          <svg
            v-if="r.viewBox"
            class="mp-maps__svg"
            :viewBox="r.viewBox"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            :aria-label="r.name"
          >
            <path
              v-for="t in r.towns"
              :key="t.code"
              class="mp-maps__town"
              :class="{ 'mp-maps__town--hover': popup?.code === t.code }"
              :d="t.d"
              :style="{ fill: t.fill }"
              @pointerenter="offset === 0 && showPopup($event, t)"
              @pointermove="offset === 0 && showPopup($event, t)"
              @pointerleave="hidePopup"
              @click.stop="offset === 0 && showPopup($event as PointerEvent, t)"
            />
            <!-- 據點：白邊＋灰點（同圖例） -->
            <path class="mp-maps__pin mp-maps__pin--ring" :d="r.pins" />
            <path class="mp-maps__pin" :d="r.pins" />
          </svg>
        </li>
      </ul>

      <p v-if="popup" class="mp-maps__popup" :style="{ left: `${popup.x}px`, top: `${popup.y}px` }">{{ popup.text }}</p>

      <button
        type="button"
        class="mp-maps__arrow mp-maps__arrow--prev"
        :aria-label="data.prev"
        @click="go(-1)"
      >
        <img :src="assetUrl(MAP_ARROW)" alt="" width="17" height="18" />
      </button>
      <button
        type="button"
        class="mp-maps__arrow mp-maps__arrow--next"
        :aria-label="data.next"
        @click="go(1)"
      >
        <img :src="assetUrl(MAP_ARROW)" alt="" width="17" height="18" />
      </button>
    </div>
  </figure>
</template>
