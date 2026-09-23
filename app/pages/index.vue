<script setup lang="ts">
import str from '~/locales/index.json';
</script>

<template>
  <div class="index-page">
    <h1 class="index-page__title">{{ str.title }}</h1>
  </div>
</template>

<style lang="scss">
.index-page {
  &__title {
    padding: 80px 16px;
    font-size: 32px;
    text-align: center;

    @include rwd-min('pc') {
      font-size: 48px;
    }
  }
}
</style>
