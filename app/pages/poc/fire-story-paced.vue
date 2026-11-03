<!-- C 版：B 版的觸發播放 + 紐時式節奏（觸發點沒有文字、區段比影片長）（設計見 architecture/2026-10-22-fire-story-paced-design.md）。
     內容在 components/poc/FireStoryPage.vue，與 A、B 版共用 -->
<script setup lang="ts">
// POC 只有中文版，不產生 /en/poc/*
definePageMeta({ i18n: false });
</script>

<template>
  <PocFireStoryPage variant="paced" />
</template>
