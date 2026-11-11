<!--
  04 各國消防員服務比（設計稿 pc 2423:5630＋旁邊狀態 2423:6578、2423:7940、2423:10049；pad 2423:26623；mob 2426:35）。
  跑道四段、舞台 sticky 100svh，四個狀態原地淡入淡出：
    0 一位民眾（intro）→ 1 日本 724 → 2 日本 vs 台灣（+77%）→ 3 五國長條
  數字放 utils/04.manpower/staffing.ts；國名、標題、單位走文案。圖下方接註解與資料來源（不 pin）。
-->
<script setup lang="ts">
import { useStepTrack } from '~/composables/04.manpower/useStepTrack';
import { COMPARE, COUNTRIES, SOURCES } from '~/utils/04.manpower/staffing';
import type { CountryId, SourceId } from '~/utils/04.manpower/staffing';
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

const STATES = 4;
const track = ref<HTMLElement | null>(null);
const { active } = useStepTrack(track, STATES);

const countries = computed(() => COUNTRIES.map((c) => ({ ...c, name: props.data.countries[c.id] })));
const from = computed(() => countries.value.find((c) => c.id === COMPARE.from)!);
const to = computed(() => countries.value.find((c) => c.id === COMPARE.to)!);
const diffPct = computed(() => Math.round((to.value.perFirefighter / from.value.perFirefighter - 1) * 100));
const maxValue = Math.max(...COUNTRIES.map((c) => c.perFirefighter));

const sources = computed(() => SOURCES.map((s) => ({ ...s, name: props.data.sources.items[s.id] })));

// 方塊（狀態 1、2）一列 30 點；長條（狀態 3）一列 10 點
const BLOCK_COLS = 30;
const BAR_COLS = 10;
</script>

<template>
  <div class="mp-chart">
    <div ref="track" class="mp-chart__track" :style="{ '--steps': STATES }">
      <div class="mp-chart__stage">
        <div class="mp-chart__box">
          <!-- 0：一位民眾 -->
          <div class="mp-chart__state mp-chart__state--intro" :class="{ 'mp-chart__state--active': active === 0 }" :aria-hidden="active !== 0">
            <p class="mp-chart__intro-label">{{ data.intro.label }}</p>
            <p class="mp-chart__intro-question">{{ data.intro.question }}</p>
            <p class="mp-chart__person">
              {{ data.intro.person }}
              <span class="mp-chart__person-dot" aria-hidden="true" />
            </p>
          </div>

          <!-- 1：日本 -->
          <div class="mp-chart__state" :class="{ 'mp-chart__state--active': active === 1 }" :aria-hidden="active !== 1">
            <p class="mp-chart__title">{{ data.title }}</p>
            <div class="mp-chart__pairs">
              <div class="mp-chart__pair">
                <p class="mp-chart__name">{{ from.name }}</p>
                <p class="mp-chart__big">
                  {{ from.perFirefighter }}<span class="mp-chart__unit">{{ data.unit }}</span>
                </p>
                <ManpowerChartDots class="mp-chart__dots" :count="from.perFirefighter" :cols="BLOCK_COLS" />
              </div>
            </div>
          </div>

          <!-- 2：日本 vs 台灣 -->
          <div class="mp-chart__state" :class="{ 'mp-chart__state--active': active === 2 }" :aria-hidden="active !== 2">
            <p class="mp-chart__title">{{ data.title }}</p>
            <div class="mp-chart__pairs">
              <div v-for="c in [from, to]" :key="c.id" class="mp-chart__pair" :class="{ 'mp-chart__pair--accent': c.highlight }">
                <p class="mp-chart__name">{{ c.name }}</p>
                <p class="mp-chart__big">
                  {{ c.perFirefighter }}<span class="mp-chart__unit">{{ data.unit }}</span>
                </p>
                <p v-if="c.id === to.id" class="mp-chart__diff">+{{ diffPct }}%</p>
                <ManpowerChartDots
                  v-if="c.id === to.id"
                  class="mp-chart__dots"
                  :count="to.perFirefighter - from.perFirefighter"
                  :cols="BLOCK_COLS"
                  accent
                />
                <ManpowerChartDots class="mp-chart__dots" :count="from.perFirefighter" :cols="BLOCK_COLS" />
              </div>
            </div>
          </div>

          <!-- 3：五國長條 -->
          <div class="mp-chart__state" :class="{ 'mp-chart__state--active': active === 3 }" :aria-hidden="active !== 3">
            <p class="mp-chart__title">{{ data.title }}</p>
            <ul class="mp-chart__bars">
              <li
                v-for="c in countries"
                :key="c.id"
                class="mp-chart__bar"
                :class="{ 'mp-chart__bar--accent': c.highlight }"
                :style="{ '--ratio': c.perFirefighter / maxValue }"
              >
                <span class="mp-chart__bar-name">{{ c.name }}</span>
                <span class="mp-chart__bar-value">{{ c.perFirefighter }}</span>
                <ManpowerChartDots class="mp-chart__bar-dots" :count="c.perFirefighter" :cols="BAR_COLS" :accent="c.highlight" />
              </li>
            </ul>
            <p v-if="data.unitNote" class="mp-chart__unit-note">{{ data.unitNote }}</p>
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
