<script setup lang="ts">
import {
  NmdAuthor,
  NmdFooter,
  NmdShare,
} from '@udn-digital-center/common-components';
import { shareURL_fb, shareURL_twitter, useLineShareUrl } from '@/utils/share';
import strFooter from '@/locales/footer.json';

const lineHref = useLineShareUrl();

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
          :facebook="{ href: shareURL_fb }"
          :line="{ href: lineHref, target: '_blank' }"
          :twitter="{ href: shareURL_twitter }"
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
