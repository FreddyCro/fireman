<!-- 素材總覽：列出 public/img 全部素材（UPic / UVid 預覽 ＋ 檔案清單 ＋ 疑慮），右上角可複製使用程式碼。
     清單由 server/api/poc/resources 即時掃描；人工疑慮寫在 app/utils/poc/resources/notes.ts。 -->
<script setup lang="ts">
import { formatSize, snippet, upicProps, type AssetEntry, type AssetKind } from '~/utils/poc/resources/manifest';
import { GENERAL_NOTES, ITEM_NOTES } from '~/utils/poc/resources/notes';

useHead({ title: '素材總覽 · fireman' });

const { data, error } = await useFetch<AssetEntry[]>('/api/poc/resources');
const assetUrl = useAssetUrl();

const onlyIssues = ref(false);

const notesOf = (e: AssetEntry) => ITEM_NOTES[e.src] ?? [];
const hasIssue = (e: AssetEntry) => e.issues.length > 0 || notesOf(e).length > 0;

const groups = computed(() => {
  const map = new Map<string, AssetEntry[]>();
  for (const e of data.value ?? []) {
    if (onlyIssues.value && !hasIssue(e)) continue;
    if (!map.has(e.dir)) map.set(e.dir, []);
    map.get(e.dir)!.push(e);
  }
  return [...map.entries()].map(([dir, items]) => ({ dir, items }));
});

const total = computed(() => data.value?.length ?? 0);
const issueCount = computed(() => (data.value ?? []).filter(hasIssue).length);

// 註記的 key 打錯或素材改名後會默默失效，列出來提醒
const orphanNotes = computed(() => {
  const srcs = new Set((data.value ?? []).map((e) => e.src));
  return Object.keys(ITEM_NOTES).filter((k) => !srcs.has(k));
});

const KIND_LABEL: Record<AssetKind, string> = {
  single: '不分裝置',
  rwd: 'pc / pad / mob',
  pcpad: 'pcpad / mob',
  partial: '裝置不齊',
  video: '影片',
  review: '待確認',
};

const fileName = (path: string) => path.split('/').pop() ?? path;
const vidSrc = (e: AssetEntry) =>
  e.devices.length
    ? { mob: `${e.src}_mob`, pad: `${e.src}_pad`, pc: `${e.src}_pc` }
    : { mob: e.src, pad: e.src, pc: e.src };

const copied = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;
async function copy(e: AssetEntry) {
  try {
    await navigator.clipboard.writeText(snippet(e));
  } catch {
    return;
  }
  copied.value = e.src;
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = null), 1500);
}
</script>

<template>
  <div class="resources">
    <header class="resources__head">
      <h1 class="resources__title">素材總覽</h1>
      <p class="resources__legend">
        共 {{ total }} 組素材，{{ issueCount }} 組有疑慮。預覽用 UPic / UVid 實際輸出，縮放視窗可切換裝置版本；右上角按鈕複製使用程式碼。
      </p>
      <label class="resources__filter">
        <input v-model="onlyIssues" type="checkbox" />
        只看有疑慮的
      </label>
    </header>

    <p v-if="error" class="resources__error">讀取素材清單失敗：{{ error.message }}</p>

    <section v-if="GENERAL_NOTES.length || orphanNotes.length" class="resources__notes">
      <h2 class="resources__notes-title">整體疑慮</h2>
      <ul class="resources__notes-list">
        <li v-for="note in GENERAL_NOTES" :key="note">{{ note }}</li>
        <li v-for="key in orphanNotes" :key="key" class="resources__notes-orphan">
          notes.ts 的註記找不到素材：{{ key }}（已改名或刪除？）
        </li>
      </ul>
    </section>

    <section v-for="group in groups" :key="group.dir" class="resources__group">
      <h2 class="resources__group-title">
        /img/{{ group.dir }}
        <span class="resources__group-count">{{ group.items.length }}</span>
      </h2>

      <ul class="resources__grid">
        <li
          v-for="item in group.items"
          :key="item.src"
          class="resources__item"
          :class="{ 'resources__item--issue': hasIssue(item) }"
        >
          <div class="resources__thumb" :class="{ 'resources__thumb--video': item.kind === 'video' }">
            <UVid v-if="item.kind === 'video'" :src="vidSrc(item)" preload="metadata" :autoplay="false" />
            <UPic v-else v-bind="upicProps(item)" :alt="item.stem" />
            <button
              type="button"
              class="resources__copy"
              :class="{ 'resources__copy--done': copied === item.src }"
              :aria-label="`複製 ${item.stem} 的程式碼`"
              @click="copy(item)"
            >
              {{ copied === item.src ? '✓' : '⧉' }}
            </button>
          </div>

          <div class="resources__info">
            <p class="resources__name">
              {{ item.stem }}
              <span class="resources__kind" :class="`resources__kind--${item.kind}`">{{ KIND_LABEL[item.kind] }}</span>
            </p>
            <ul class="resources__files">
              <li v-for="f in item.files" :key="f.path">
                <a :href="assetUrl(encodeURI(f.path))" target="_blank" rel="noopener">{{ fileName(f.path) }}</a>
                <span class="resources__size">{{ formatSize(f.size) }}</span>
              </li>
            </ul>
            <ul v-if="hasIssue(item)" class="resources__issues">
              <li v-for="i in item.issues" :key="i" class="resources__issue">⚠️ {{ i }}</li>
              <li v-for="n in notesOf(item)" :key="n" class="resources__issue resources__issue--note">📝 {{ n }}</li>
            </ul>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss">
.resources {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 16px 96px;
  color: #222;
  background: #fff;

  @include rwd-min('tablet') {
    padding: 40px 24px 96px;
  }

  &__head {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
  }

  &__legend {
    margin-top: 8px;
    font-size: 13px;
    color: #666;
  }

  &__filter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: 14px;
    cursor: pointer;
  }

  &__error {
    color: #b91c1c;
  }

  &__notes {
    padding: 16px 20px;
    border: 1px solid #f5c26b;
    border-radius: 8px;
    background: #fffaf0;
  }

  &__notes-title {
    font-size: 16px;
    font-weight: 700;
  }

  &__notes-list {
    margin-top: 8px;
    padding-left: 20px;
    font-size: 13px;
    line-height: 1.7;
    list-style: disc;
  }

  &__notes-orphan {
    color: #b91c1c;
  }

  &__group {
    margin-top: 40px;
  }

  &__group-title {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 18px;
    font-weight: 700;
  }

  &__group-count {
    margin-left: auto;
    padding: 2px 10px;
    border-radius: 999px;
    background: #f0f0f0;
    font-size: 12px;
    font-weight: 400;
    color: #666;
  }

  // auto-fill + minmax 本身就會隨寬度增減欄數
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    margin-top: 20px;

    @include rwd-min('tablet') {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  &__item--issue &__thumb {
    border-color: #f5a524;
  }

  // 棋盤格底：透明 PNG / SVG 也看得清邊界
  &__thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 180px;
    padding: 8px;
    overflow: hidden;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background-color: #fff;
    background-image:
      linear-gradient(45deg, #eee 25%, transparent 25%),
      linear-gradient(-45deg, #eee 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #eee 75%),
      linear-gradient(-45deg, transparent 75%, #eee 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0;

    .u-pic {
      display: contents;
    }

    .u-pic-img,
    .u-vid {
      width: auto;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  &__thumb--video {
    background: #111;
  }

  &__copy {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.92);
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
  }

  &__copy--done {
    border-color: #16a34a;
    background: #16a34a;
    color: #fff;
  }

  &__info {
    font-size: 12px;
    line-height: 1.5;
  }

  &__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    word-break: break-all;
  }

  &__kind {
    padding: 0 6px;
    border-radius: 4px;
    background: #eef2ff;
    font-weight: 400;
    color: #3730a3;
  }

  &__kind--partial,
  &__kind--review {
    background: #fef3c7;
    color: #92400e;
  }

  &__files {
    margin-top: 4px;
    color: #555;

    a {
      word-break: break-all;
      text-decoration: underline;
      text-decoration-color: #ccc;
    }
  }

  &__size {
    margin-left: 6px;
    color: #999;
  }

  &__issues {
    margin-top: 6px;
  }

  &__issue {
    color: #b45309;
  }

  &__issue--note {
    color: #1d4ed8;
  }
}
</style>
