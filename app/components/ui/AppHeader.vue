<script setup lang="ts">
import {
  NmdHamburger,
  NmdHeader,
  NmdHeaderShare,
  NmdMenu,
  NmdMenuItem,
  NmdProgressbar,
} from '@udn-digital-center/common-components';
import { shareURL_fb, shareURL_twitter, useLineShareUrl } from '@/utils/share';
import strHeader from '@/locales/header.json';

const lineHref = useLineShareUrl();
</script>

<template>
  <div class="app-header">
    <NmdProgressbar />
    <NmdHeader>
      <ClientOnly>
        <NmdHeaderShare
          :facebook="{ href: shareURL_fb }"
          :line="{ href: lineHref, target: '_blank' }"
          :twitter="{ href: shareURL_twitter }"
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
