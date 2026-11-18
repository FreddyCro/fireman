import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * 隨捲動從 blur(maxBlur) 清晰到 blur(0)（ui/BlurTitle、02 引言共用）。
 * trigger 的 start → end 之間依進度變清楚，progress 到 clearAt 就全清；往回捲會再糊回去。
 * prefers-reduced-motion 時不做、直接清晰。
 */
export function useScrollBlur(
  target: Ref<HTMLElement | null>,
  trigger: Ref<HTMLElement | null>,
  opts: { maxBlur?: number; start?: string; end?: string; clearAt?: number } = {},
) {
  const { maxBlur = 10, start = 'top 85%', end = 'center 50%', clearAt = 1 } = opts;
  let st: ScrollTrigger | null = null;

  onMounted(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !target.value) return;
    gsap.registerPlugin(ScrollTrigger);
    const setBlur = gsap.quickSetter(target.value, 'filter') as (v: string) => void;
    const apply = (self: ScrollTrigger) => {
      const t = Math.min(self.progress / clearAt, 1);
      setBlur(`blur(${(maxBlur * (1 - t)).toFixed(2)}px)`);
    };
    st = ScrollTrigger.create({ trigger: trigger.value, start, end, onUpdate: apply, onRefresh: apply });
  });

  onBeforeUnmount(() => {
    st?.kill();
    st = null;
  });
}
