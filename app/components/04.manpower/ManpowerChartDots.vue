<!--
  04 量化圖表的圓點方塊：count 個點排成 cols 欄，從下往上填，不滿一列的那列放最上面、靠右。
  點用 CSS radial-gradient 平鋪（設計註記：量化造型用 coding 排列無須出圖），點距由外層 --pitch 控制。
-->
<script setup lang="ts">
const props = withDefaults(defineProps<{ count: number; cols: number; accent?: boolean }>(), { accent: false });

const rows = computed(() => Math.floor(props.count / props.cols));
const rem = computed(() => props.count % props.cols);
</script>

<template>
  <span
    class="mp-dots"
    :class="{ 'mp-dots--accent': accent }"
    :style="{ '--cols': cols, '--rows': rows, '--rem': rem }"
    aria-hidden="true"
  >
    <span v-if="rem" class="mp-dots__row" />
    <span class="mp-dots__block" />
  </span>
</template>
