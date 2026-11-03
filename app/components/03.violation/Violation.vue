<script setup lang="ts">
const str = useCopy().violation;
</script>

<template>
  <section id="violation" class="sec-violation">
    <h2 class="sec-violation__title">{{ str.title }}</h2>
  </section>
</template>
