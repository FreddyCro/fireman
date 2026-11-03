<script lang="ts" setup>
import { useTracking } from '~/utils/tracking';

const meta = useCopy().meta;
const config = useRuntimeConfig();
const APP_MODE = config.public.APP_MODE;
const ASSETS_PATH = config.public.APP_ASSETS_PATH;

useSeoMeta({
  title: meta.metaTitle,
  description: meta.metaDesc,
  'og:title': meta.metaTitle,
  'og:description': meta.metaXDesc,
  'og:image': `${ASSETS_PATH}/${meta.metaImage}`,
  'twitter:title': meta.metaTitle,
  'twitter:description': meta.metaXDesc,
  twitterCard: 'summary_large_image',
  keywords: meta.metaKeywords,
  robots: APP_MODE === 'production' ? 'index, follow' : 'noindex, nofollow',
});

// <html lang>、hreflang（/ ↔ /en 互指）、og:locale；POC 頁（i18n: false）不輸出
const i18nHead = useLocaleHead();
useHead(() => ({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs.lang },
  link: i18nHead.value.link,
  meta: i18nHead.value.meta,
}));

// favicon（UDN）
useHead({
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: 'https://vip.udn.com/static/img/favicon.ico',
    },
  ],
});

// UDN 追蹤碼（GTM / comScore / Alexa / etu…），集中於 utils/tracking.ts
useHead(useTracking());
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
