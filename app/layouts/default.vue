<script setup lang="ts">
// POC 頁是滿版捲動動畫，fixed 的 header 會蓋在上面，故不顯示。
const route = useRoute();
const showHeader = computed(() => !route.path.startsWith('/poc'));
</script>

<template>
  <div>
    <AppHeader v-if="showHeader" />
    <main class="main-content">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
