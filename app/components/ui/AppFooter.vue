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
  }
}
</style>
