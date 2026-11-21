<!--
  02 無人受困的火場。順序照設計稿 section2：
  導言（pin）→ pin 圖表 → 過場（pin）→ blur 大標 → 「做與不做都兩難」（pin）→ 台中案例 → 張賢龢留學故事 → 受訪者卡 → 3 項應變順序 → 段落 → 引言（pin＋blur）→ 超哥故事捲動動畫 → 美福倉儲段落＋照片
-->
<script setup lang="ts">
import { CASES } from '~/utils/02.no-trapped/cases';
import { CHART } from '~/utils/02.no-trapped/chart';
import { MEIFU_PHOTOS, PROFILE_SRC } from '~/utils/02.no-trapped/media';
import './NoTrapped.scss';

const str = useCopy().noTrapped;

// 版面（CASES）與文案以 id 對應
const caseCopy = (id: string) => str.cases[id as keyof typeof str.cases];

const meifuPhotos = MEIFU_PHOTOS.map((src, i) => ({ src, alt: str.meifu.alt[i] ?? '' }));
</script>

<template>
  <section id="no-trapped" class="sec-no-trapped">
    <PinText>
      <header class="sec-no-trapped__intro">
        <h2 class="sec-no-trapped__intro-title">{{ str.intro.title }}</h2>
        <p class="sec-no-trapped__intro-lead">{{ str.intro.lead }}</p>
      </header>
    </PinText>

    <PinChart :layout="CHART" :copy="str.chart" />

    <PinText>
      <div class="sec-no-trapped__text sec-no-trapped__text--pin">
        <p>{{ str.transition }}</p>
      </div>
    </PinText>

    <BlurTitle
      class="sec-no-trapped__title"
      :svg="str.titleSvg"
      :svg-narrow="str.titleSvgNarrow"
      :svg-mob="str.titleSvgMob"
      :alt="str.title"
      natural
      pin
    />
    <PinText>
      <div class="sec-no-trapped__text sec-no-trapped__text--pin">
        <p>{{ str.dilemma }}</p>
      </div>
    </PinText>
    <CaseStory v-for="c in CASES" :key="c.id" :layout="c" :copy="caseCopy(c.id)" />

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

    <PinText blur>
      <blockquote class="sec-no-trapped__quote">
        <span class="sec-no-trapped__quote-mark" aria-hidden="true">“</span>
        <p>{{ str.quote }}</p>
      </blockquote>
    </PinText>
    <!-- 引言延伸的「超哥故事」捲動動畫 -->
    <NoTrappedEscape />

    <div class="sec-no-trapped__text">
      <p v-for="p in str.meifu.paragraphs" :key="p">{{ p }}</p>
    </div>
    <NoTrappedGallery :photos="meifuPhotos" :caption="str.meifu.caption" />
  </section>
</template>
