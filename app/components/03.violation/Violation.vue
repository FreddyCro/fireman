<script setup lang="ts">
import { CASES } from '~/utils/03.violation/cases';
import { CHART } from '~/utils/03.violation/chart';
import './Violation.scss';

const str = useCopy().violation;

// 版面（CASES）與文案以 id 對應，素材 alt 依素材 id 取
const cases = CASES.map((c) => {
  const copy = str.cases[c.id as keyof typeof str.cases];
  return {
    ...copy,
    id: c.id,
    aspect: c.aspect,
    media: c.media.map((m) => ({ ...m, alt: copy.alt[m.id as keyof typeof copy.alt] ?? '' })),
  };
});
</script>

<template>
  <section id="violation" class="sec-violation">
    <!-- 大標還沒有 SVG 稿，BlurTitle 走文字 fallback -->
    <BlurTitle class="sec-violation__title" :alt="str.title" pin />
    <CaseStory v-for="(c, i) in cases" :key="c.id" :data="c" :reverse="i % 2 === 1" />

    <!-- 工廠／倉庫火災件數：圖表 pin 住切換兩個十年，跑道走完才接訪談段落 -->
    <PinChart :layout="CHART" :copy="str.chart">
      <p v-for="q in str.quotes" :key="q">{{ q }}</p>
    </PinChart>
  </section>
</template>
