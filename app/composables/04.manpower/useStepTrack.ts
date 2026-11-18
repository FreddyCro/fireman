import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';

/**
 * 04 人力吃緊的 pin 跑道：track 從貼頂捲到貼底的進度切成 steps 段，回傳目前是第幾段（0 起算）。
 * 舞台用 CSS sticky 自己 pin 住，這裡只算進度；往回捲會退回前一段。
 */
export function useStepTrack(track: Ref<HTMLElement | null>, steps: MaybeRefOrGetter<number>) {
  const active = ref(0);
  const progress = ref(0);
  let st: ScrollTrigger | null = null;

  const update = (p: number) => {
    const n = Math.max(toValue(steps), 1);
    progress.value = p;
    active.value = Math.min(Math.floor(p * n), n - 1);
  };

  onMounted(() => {
    if (!track.value) return;
    gsap.registerPlugin(ScrollTrigger);
    st = ScrollTrigger.create({
      trigger: track.value,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
  });

  onBeforeUnmount(() => {
    st?.kill();
    st = null;
  });

  return { active, progress };
}
