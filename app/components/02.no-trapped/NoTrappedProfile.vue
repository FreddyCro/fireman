<!-- 受訪者卡：照片＋姓名＋簡介。mob 照片滿版在上、文字在下；tablet 以上照片在左（204×140）、文字在右。 -->
<script setup lang="ts">
defineProps<{ data: { name: string; bio: string; alt: string }; src: string }>();

const assetUrl = useAssetUrl();
</script>

<template>
  <figure class="sec-no-trapped__profile">
    <img class="sec-no-trapped__profile-img" :src="assetUrl(src)" :alt="data.alt" loading="lazy" />
    <figcaption class="sec-no-trapped__profile-text">
      <p class="sec-no-trapped__profile-name">{{ data.name }}</p>
      <p class="sec-no-trapped__profile-bio">{{ data.bio }}</p>
    </figcaption>
  </figure>
</template>
