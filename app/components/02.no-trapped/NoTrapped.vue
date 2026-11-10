<!--
  02 無人受困的火場。順序照設計稿 section2：
  導言 → pin 圖表 → 過場 → blur 大標 → 台中案例 → 張賢龢留學故事 → 受訪者卡 → 3 項應變順序 → 段落 → 引言（blur）→（mob）插畫 → 美福倉儲段落＋照片
-->
<script setup lang="ts">
import { CASES } from '~/utils/02.no-trapped/cases';
import { CHART } from '~/utils/02.no-trapped/chart';
import { MEIFU_PHOTOS, PROFILE_SRC } from '~/utils/02.no-trapped/media';
import './NoTrapped.scss';

const str = useCopy().noTrapped;

// 版面（CASES）與文案以 id 對應，素材 alt 依素材 id 取
const cases = CASES.map((c) => {
  const copy = str.cases[c.id as keyof typeof str.cases];
  return {
    ...copy,
    id: c.id,
    aspect: c.aspect,
    padWidth: c.padWidth,
    media: c.media.map((m) => ({ ...m, alt: copy.alt[m.id as keyof typeof copy.alt] ?? '' })),
  };
});

// 台中案例的 scrapbook 隨捲動飛到留學故事上方的這個空位（CaseStory 的 flyTo）
const boardSlot = ref<HTMLElement | null>(null);
const slotStyle = {
  '--aspect-mob': CASES[0]!.aspect.mob,
  '--aspect-pad': CASES[0]!.aspect.pad ?? CASES[0]!.aspect.pc,
  '--aspect-pc': CASES[0]!.aspect.pc,
  '--board-pad': `${CASES[0]!.padWidth ?? 652}px`,
};

const meifuPhotos = MEIFU_PHOTOS.map((src, i) => ({ src, alt: str.meifu.alt[i] ?? '' }));

// 引言隨捲動從模糊變清楚（同 BlurTitle 的效果）
const quote = ref<HTMLElement | null>(null);
useScrollBlur(quote, quote);
</script>

<template>
  <section id="no-trapped" class="sec-no-trapped">
    <header class="sec-no-trapped__intro">
      <h2 class="sec-no-trapped__intro-title">{{ str.intro.title }}</h2>
      <p class="sec-no-trapped__intro-lead">{{ str.intro.lead }}</p>
    </header>

    <PinChart :layout="CHART" :copy="str.chart" />

    <div class="sec-no-trapped__text sec-no-trapped__text--transition">
      <p>{{ str.transition }}</p>
    </div>

    <BlurTitle
      class="sec-no-trapped__title"
      :svg="str.titleSvg"
      :svg-narrow="str.titleSvgNarrow"
      :alt="str.title"
      :label="str.titleLabel"
      pin
    />
    <CaseStory v-for="(c, i) in cases" :key="c.id" :data="c" :reverse="i % 2 === 1" :fly-to="i === 0 ? boardSlot : null" />

    <div ref="boardSlot" class="sec-no-trapped__board-slot" :style="slotStyle" aria-hidden="true" />
    <div class="sec-no-trapped__text">
      <p>
        {{ str.story.first.before
        }}<a :href="str.story.first.href" target="_blank" rel="noopener">{{ str.story.first.link }}</a
        >{{ str.story.first.after }}
      </p>
      <p v-for="p in str.story.rest" :key="p">{{ p }}</p>
    </div>

    <NoTrappedProfile :data="str.profile" :src="PROFILE_SRC" />
    <NoTrappedPriorities :data="str.priorities" />

    <div class="sec-no-trapped__text sec-no-trapped__text--wide">
      <p v-for="p in str.afterPriorities" :key="p">{{ p }}</p>
    </div>

    <blockquote ref="quote" class="sec-no-trapped__quote">
      <span class="sec-no-trapped__quote-mark" aria-hidden="true">“</span>
      <p>{{ str.quote }}</p>
    </blockquote>
    <!-- mob 稿引言後的插畫（362×448），素材未到先放 placeholder -->
    <div class="sec-no-trapped__illust" aria-hidden="true" />

    <div class="sec-no-trapped__text">
      <p v-for="p in str.meifu.paragraphs" :key="p">{{ p }}</p>
    </div>
    <NoTrappedGallery :photos="meifuPhotos" :caption="str.meifu.caption" />
  </section>
</template>
