<!--
  美國 3 項災害應變順序：引言＋三行「大數字＋中文＋英文副標」，捲到時一項一項淡入。
  中文版每行是一張 SVG（設計稿文字已轉外框），英文版沒有圖，走文字 fallback：數字用序號、title／sub 用文案。
-->
<script setup lang="ts">
defineProps<{ data: { lead: string; items: { svg: string; title: string; sub: string }[] } }>();

const assetUrl = useAssetUrl();
// 捲到才一項一項淡入（mob 稿：1 → 2 → 3）
const items = ref<HTMLElement[]>([]);
const shown = useReveal(items, { threshold: 0.5 });
</script>

<template>
  <div class="sec-no-trapped__priorities">
    <p class="sec-no-trapped__priorities-lead">{{ data.lead }}</p>
    <ol class="sec-no-trapped__priorities-list">
      <li
        v-for="(it, i) in data.items"
        :key="it.title"
        ref="items"
        class="sec-no-trapped__priorities-item"
        :class="{ 'sec-no-trapped__priorities-item--shown': shown[i] }"
      >
        <img v-if="it.svg" class="sec-no-trapped__priorities-img" :src="assetUrl(it.svg)" :alt="`${i + 1} ${it.title} ${it.sub}`" />
        <template v-else>
          <span class="sec-no-trapped__priorities-num" aria-hidden="true">{{ i + 1 }}</span>
          <span class="sec-no-trapped__priorities-text">
            <span class="sec-no-trapped__priorities-title">{{ it.title }}</span>
            <span class="sec-no-trapped__priorities-sub">{{ it.sub }}</span>
          </span>
        </template>
      </li>
    </ol>
  </div>
</template>
