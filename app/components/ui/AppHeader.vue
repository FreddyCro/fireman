<script setup lang="ts">
import {
  NmdHamburger,
  NmdHeader,
  NmdHeaderShare,
  NmdMenu,
  NmdMenuItem,
  NmdProgressbar,
} from '@udn-digital-center/common-components';
import { useShareUrls } from '@/utils/share';

const share = useShareUrls();
const strHeader = useCopy().header;
</script>

<template>
  <div class="app-header">
    <NmdProgressbar />
    <NmdHeader>
      <ClientOnly>
        <NmdHeaderShare
          :facebook="{ href: share.fb }"
          :line="{ href: share.line.value, target: '_blank' }"
          :twitter="{ href: share.twitter }"
          twitter-icon="x"
        />
      </ClientOnly>
      <NmdHamburger />
    </NmdHeader>
    <!-- NmdMenuItem 一律 target="_blank"，放站內錨點會另開分頁，選單只放外部連結。 -->
    <NmdMenu>
      <NmdMenuItem
        v-for="item in strHeader.menu"
        :key="item.title"
        :to="item.link"
        :is-current="item.isCurrent"
      >
        {{ item.title }}
      </NmdMenuItem>
    </NmdMenu>
  </div>
</template>
