<script setup lang="ts">
import {
  NmdAuthor,
  NmdFooter,
  NmdShare,
} from '@udn-digital-center/common-components';
import { useShareUrls } from '@/utils/share';

const share = useShareUrls();
const strFooter = useCopy().footer;

const CURRENT_YEAR = new Date().getFullYear();
</script>

<template>
  <div id="editor" class="app-footer">
    <div class="app-footer__info">
      <NmdAuthor>
        <template
          v-for="credit in strFooter.credits"
          :key="credit.title"
          #[credit.title]
        >
          {{ credit.names }}
        </template>
        <template #上線日期>{{ strFooter.date }}</template>
      </NmdAuthor>
      <ClientOnly>
        <NmdShare
          :facebook="{ href: share.fb }"
          :line="{ href: share.line.value, target: '_blank' }"
          :twitter="{ href: share.twitter }"
          twitter-icon="x"
        />
      </ClientOnly>
    </div>
    <NmdFooter :year="CURRENT_YEAR" />
  </div>
</template>

<style lang="scss">
.app-footer {
  &__info {
    padding-bottom: 50px;
    background-color: #f1f1f1;

    // NmdAuthor 把每個名字與「、」各自當 flex 項目換行，8 字的名字（桃園市消防局提供）後面的「、」會單獨掉到下一行；
    // 名單欄改回一般文字流：同設計稿逐字換行，瀏覽器的避頭點規則也不會讓「、」出現在行首
    .author-grid__item:nth-child(even) {
      display: block;
    }
  }
}
</style>
