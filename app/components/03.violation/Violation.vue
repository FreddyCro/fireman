<!--
  03 工安違法事實。順序照設計稿 section3：
  blur 大標 → 屏東明揚案例 → 桃園敬鵬案例 → 消防年報段落 → pin 圖表＋訪談段落
-->
<script setup lang="ts">
import { CASES } from '~/utils/03.violation/cases';
import { CHART } from '~/utils/03.violation/chart';
import './Violation.scss';

const str = useCopy().violation;

// 版面（CASES）與文案以 id 對應
const caseCopy = (id: string) => str.cases[id as keyof typeof str.cases];
</script>

<template>
  <section id="violation" class="sec-violation">
    <BlurTitle
      class="sec-violation__title"
      :svg="str.titleSvg"
      :svg-narrow="str.titleSvgNarrow"
      :svg-mob="str.titleSvgMob"
      :alt="str.title"
      :label="str.titleLabel"
      natural
      pin
    />
    <CaseStory v-for="c in CASES" :key="c.id" :layout="c" :copy="caseCopy(c.id)" />

    <div class="sec-violation__text">
      <p>{{ str.lead }}</p>
    </div>

    <!-- 工廠／倉庫火災件數：圖表 pin 住切換兩個十年，跑道走完才接訪談段落 -->
    <PinChart :layout="CHART" :copy="str.chart">
      <p v-for="q in str.quotes" :key="q">{{ q }}</p>
    </PinChart>
  </section>
</template>
