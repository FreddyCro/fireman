<!-- 單一案例：文字＋scrapbook。整個 article 就是素材的拖曳範圍，素材可以拖到文字上。 -->
<script setup lang="ts">
import type { ScrapbookItem } from '~/utils/02.no-trapped/scrapbook';

defineProps<{
  data: {
    date: string;
    title: string[];
    body: string;
    count: { number: string; label: string };
    aspect: { mob: string; pc: string };
    media: ScrapbookItem[];
  };
  /** 平板以上左右對調（素材在左、文字在右） */
  reverse?: boolean;
}>();
</script>

<template>
  <article class="sec-no-trapped__case" :class="{ 'sec-no-trapped__case--reverse': reverse }">
    <div class="sec-no-trapped__text">
      <p class="sec-no-trapped__date">{{ data.date }}</p>
      <h3 class="sec-no-trapped__heading">
        <span v-for="l in data.title" :key="l">{{ l }}</span>
      </h3>
      <p class="sec-no-trapped__body">{{ data.body }}</p>
      <p class="sec-no-trapped__count">
        <span class="sec-no-trapped__count-num">{{ data.count.number }}</span>{{ data.count.label }}
      </p>
    </div>
    <NoTrappedScrapbook class="sec-no-trapped__board" :items="data.media" :aspect="data.aspect" />
  </article>
</template>
