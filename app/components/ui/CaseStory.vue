<!-- 單一案例：文字＋scrapbook，跨 section 共用（02 no-trapped、03 violation）。整個 article 就是素材的拖曳範圍，素材可以拖到文字上。 -->
<script setup lang="ts">
import type { ScrapbookItem } from '~/utils/scrapbook';
import './CaseStory.scss';

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
  <article class="case-story" :class="{ 'case-story--reverse': reverse }">
    <div class="case-story__text">
      <p class="case-story__date">{{ data.date }}</p>
      <h3 class="case-story__heading">
        <span v-for="l in data.title" :key="l">{{ l }}</span>
      </h3>
      <p class="case-story__body">{{ data.body }}</p>
      <p class="case-story__count">
        <span class="case-story__count-num">{{ data.count.number }}</span>{{ data.count.label }}
      </p>
    </div>
    <Scrapbook class="case-story__board" :items="data.media" :aspect="data.aspect" />
  </article>
</template>
