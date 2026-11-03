<script setup lang="ts">
import { CASES } from '~/utils/02.no-trapped/cases';
import './NoTrapped.scss';

const str = useCopy().noTrapped;

// 版面（CASES）與文案以 id 對應，素材 alt 依素材 id 取
const cases = CASES.map((c) => {
  const copy = str.cases[c.id];
  return {
    ...copy,
    id: c.id,
    aspect: c.aspect,
    media: c.media.map((m) => ({ ...m, alt: copy.alt[m.id as keyof typeof copy.alt] ?? '' })),
  };
});
</script>

<template>
  <section id="no-trapped" class="sec-no-trapped">
    <h2>10年27人殉職火場 2大燒不完的制度破口</h2>
    <p>根據消防署歷年消防年報顯示，近10年重大火災案件相較上一個10年大幅減少，而因火場救援的殉職人數卻有增無減</p>

    <h2>前10年重大火災數已呈逐年下降趨勢</h2>
    <p>重大火災：35085件</p>
    <p>殉職總數17人</p>
    <p>註：內政部消防署在 2017年1月1日正式修改「火災認定標準」並擴大統計範圍。A1：造成人員死亡的火災案件。A2：造成人員受傷、涉及糾紛、縱火案件或起火原因待查的火災案件。
      資料來源：內政部消防統計年報</p>

    <p>導致火災殉職的因素相當複雜，本專題訪問張賢龢博士、消防員工作權益促進會(以下簡稱消促會)秘書長林昶志與副理事長鄭少書，從進入火場原則、廠房工安到人力調度與日常勤務，綜合探討如何記取教訓、降低風險、保住人命。</p>

    <BlurTitle class="sec-no-trapped__title" :svg="str.titleSvg" :alt="str.title" :label="str.titleLabel" pin />
    <NoTrappedCase v-for="(c, i) in cases" :key="c.id" :data="c" :reverse="i % 2 === 1" />
  </section>
</template>
