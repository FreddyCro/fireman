<!--
  04 人力吃緊。順序照設計稿（CH pc 2423:5541 → 2423:5637，pad 2423:26516、mob 2423:16280）：
  blur 大標 → 屏東地圖 scrollytelling → 專家引言（blur）→ 8 人小分隊插畫 → 分隊駐點＋四縣市地圖
  → 各國人力比較圖表 → 勤務繁雜 → 權益改善
  區塊分析與 design token 見 temp/section3-manpower-analysis.md；token 只在本 section（ManpowerTokens.scss）。
-->
<script setup lang="ts">
import './Manpower.scss';

const str = useCopy().manpower;

// 引言隨捲動從模糊變清楚（設計註記：標語 Blur 10→0）
const quote = ref<HTMLElement | null>(null);
useScrollBlur(quote, quote);
</script>

<template>
  <section id="manpower" class="sec-manpower">
    <BlurTitle
      class="sec-manpower__title"
      :svg="str.titleSvg"
      :svg-narrow="str.titleSvgNarrow"
      :svg-mob="str.titleSvgMob"
      :alt="str.title"
      pin
    />

    <ManpowerPingtung :data="str.pingtung" />

    <blockquote ref="quote" class="sec-manpower__quote">
      <p class="sec-manpower__quote-body">{{ str.quote.body }}</p>
      <footer class="sec-manpower__quote-by">{{ str.quote.by }}</footer>
    </blockquote>

    <ManpowerIllustration :lines="str.illustration.lines" />

    <div class="sec-manpower__block">
      <h3 class="sec-manpower__subtitle">{{ str.deploy.title }}</h3>
      <div class="sec-manpower__text">
        <p v-for="p in str.deploy.body" :key="p">{{ p }}</p>
      </div>
    </div>
    <ManpowerMaps :data="str.deploy.maps" />

    <div class="sec-manpower__block">
      <h3 class="sec-manpower__subtitle">{{ str.staffing.title }}</h3>
      <div class="sec-manpower__text">
        <p v-for="p in str.staffing.body" :key="p">{{ p }}</p>
      </div>
    </div>
    <ManpowerChart :data="str.staffing.chart" />

    <div class="sec-manpower__block">
      <h3 class="sec-manpower__subtitle">{{ str.duties.title }}</h3>
      <div class="sec-manpower__text">
        <p v-for="p in str.duties.body" :key="p">{{ p }}</p>
      </div>
    </div>

    <div class="sec-manpower__block sec-manpower__block--last">
      <h3 class="sec-manpower__subtitle">{{ str.rights.title }}</h3>
      <div class="sec-manpower__text">
        <p v-for="p in str.rights.body" :key="p">{{ p }}</p>
      </div>
    </div>
  </section>
</template>
