<!-- A 版：C4 影片跟著捲動 scrub。內容在 components/poc/FireStoryPage.vue，與 B 版 /poc/fire-story-auto 共用 -->
<script setup lang="ts">
// POC 只有中文版，不產生 /en/poc/*
definePageMeta({ i18n: false });
</script>

<template>
  <PocFireStoryPage variant="scrub" />
</template>
