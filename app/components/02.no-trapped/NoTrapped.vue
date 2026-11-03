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
    <h2 class="sec-no-trapped__title">{{ str.title }}</h2>
    <NoTrappedCase v-for="(c, i) in cases" :key="c.id" :data="c" :reverse="i % 2 === 1" />
  </section>
</template>
