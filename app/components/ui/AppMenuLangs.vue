<!--
  漢堡選單頂端的 CH｜EN（設計稿 menu_pc 2423:15246）：連到另一個語系的同一頁。
  - 用一般 <a> 整頁換頁，不走 client 端導覽：文案與 hero 場景只在載入時依語系決定（沒有動態切換）。
    router.resolve 的 href 會帶上 app.baseURL，部署在子路徑時才不會 404。
  - name 刻意設成 NmdMenuItem：common-components 的 NmdMenuList 只收 name 為 NmdMenuItem／NmdMenuGroup 的子節點，
    其他一律丟掉（見 node_modules/@udn-digital-center/common-components/src/components/NmdMenuList）。
    它對 NmdMenuItem 是原樣放進 <ul>，所以這裡自己輸出 <li>。升級 common-components 時要確認這個判斷沒變。
-->
<script setup lang="ts">
defineOptions({ name: 'NmdMenuItem' });

const { locale } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const router = useRouter();

const LANGS = [
  { code: 'zh', label: 'CH', lang: 'zh-TW' },
  { code: 'en', label: 'EN', lang: 'en' },
] as const;

const langs = computed(() =>
  LANGS.map((l) => ({ ...l, href: router.resolve(switchLocalePath(l.code)).href, current: l.code === locale.value })),
);
</script>

<template>
  <li class="app-menu-langs">
    <template v-for="(l, i) in langs" :key="l.code">
      <span v-if="i > 0" class="app-menu-langs__sep" aria-hidden="true">｜</span>
      <a
        class="app-menu-langs__link"
        :href="l.href"
        :hreflang="l.lang"
        :lang="l.lang"
        :aria-current="l.current ? 'page' : undefined"
      >
        {{ l.label }}
      </a>
    </template>
  </li>
</template>

<style lang="scss">
// 設計稿：Noto Sans TC Light 14/24 #404040；選單頂端（pc padding 110）下 10px，與第一個項目文字相距 30（項目本身上 padding 20）。
// 下方不畫分隔線（設計稿只有項目之間有線）
.app-menu-langs {
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  font-size: 14px;
  font-weight: 300;
  line-height: 24px;
  color: #404040;

  &__link {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: #c9282f; // 同 NmdMenu 項目 hover
    }

    &[aria-current='page'] {
      pointer-events: none;
    }
  }
}
</style>
