<!-- 美福倉儲：兩張照片＋一則圖說。mob 上下疊、tablet 以上並排（設計稿 402×302 ×2，間距 15）。 -->
<script setup lang="ts">
defineProps<{ photos: { src: string; alt: string }[]; caption: string }>();

const assetUrl = useAssetUrl();
</script>

<template>
  <figure class="sec-no-trapped__gallery">
    <div class="sec-no-trapped__gallery-grid">
      <img v-for="p in photos" :key="p.src" class="sec-no-trapped__gallery-img" :src="assetUrl(p.src)" :alt="p.alt" loading="lazy" />
    </div>
    <figcaption class="sec-no-trapped__gallery-caption">{{ caption }}</figcaption>
  </figure>
</template>
