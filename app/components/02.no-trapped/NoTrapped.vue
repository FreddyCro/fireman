<script setup lang="ts">
import str from '~/locales/section-no-trapped.json';
import type { ScrapbookItem } from '~/utils/02.no-trapped/scrapbook';
import './NoTrapped.scss';

// JSON 的 type 推不出字面值聯集，在這裡收斂成 ScrapbookItem
const cases = str.cases.map((c) => ({ ...c, media: c.media as ScrapbookItem[] }));
</script>

<template>
  <section id="no-trapped" class="sec-no-trapped">
    <h2 class="sec-no-trapped__title">{{ str.title }}</h2>
    <NoTrappedCase v-for="(c, i) in cases" :key="c.id" :data="c" :reverse="i % 2 === 1" />
  </section>
</template>
