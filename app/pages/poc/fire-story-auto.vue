<!-- B 版：C4 影片捲到定點自動原速播放、播完接下一段（設計見 architecture/2026-10-19-fire-story-auto-design.md）。
     內容在 components/poc/FireStoryPage.vue，與 A 版 /poc/fire-story 共用 -->
<script setup lang="ts">
// POC 只有中文版，不產生 /en/poc/*
definePageMeta({ i18n: false });
</script>

<template>
  <PocFireStoryPage variant="trigger" />
</template>
