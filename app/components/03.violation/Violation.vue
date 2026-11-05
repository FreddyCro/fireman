<!--
  03 工安違法事實。順序照設計稿 section3：
  blur 大標 → 屏東明揚案例 → 桃園敬鵬案例（scrapbook 隨捲動飛到下一段內文上方的空位）→ 消防年報段落 → pin 圖表＋訪談段落
-->
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

// 桃園敬鵬（最後一個案例）的 scrapbook 隨捲動飛到消防年報段落上方的這個空位（CaseStory 的 flyTo）
const flyIndex = CASES.length - 1;
const boardSlot = ref<HTMLElement | null>(null);
const slotStyle = { '--aspect-mob': CASES[flyIndex]!.aspect.mob, '--aspect-pc': CASES[flyIndex]!.aspect.pc };
</script>

<template>
  <section id="violation" class="sec-violation">
    <BlurTitle class="sec-violation__title" :svg="str.titleSvg" :alt="str.title" :label="str.titleLabel" pin />
    <CaseStory
      v-for="(c, i) in cases"
      :key="c.id"
      :data="c"
      :reverse="i % 2 === 1"
      :fly-to="i === flyIndex ? boardSlot : null"
    />

    <div ref="boardSlot" class="sec-violation__board-slot" :style="slotStyle" aria-hidden="true" />
    <div class="sec-violation__text">
      <p>{{ str.lead }}</p>
    </div>

    <!-- 工廠／倉庫火災件數：圖表 pin 住切換兩個十年，跑道走完才接訪談段落 -->
    <PinChart :layout="CHART" :copy="str.chart">
      <p v-for="q in str.quotes" :key="q">{{ q }}</p>
    </PinChart>
  </section>
</template>
