/**
 * 元素捲進觸發區就標成「已出現」，往回捲到觸發區下方時藏回去，再往下捲會重新淡入。
 * 回傳與 targets 同順序的 boolean 陣列；樣式自己用 class 做 opacity 過場。
 * prefers-reduced-motion 或不支援 IntersectionObserver 時一開始就全部出現。
 */
export function useReveal(
  targets: Ref<HTMLElement[] | HTMLElement | null>,
  options: { rootMargin?: string; threshold?: number } = { threshold: 0.3 },
) {
  const shown = ref<boolean[]>([]);
  let io: IntersectionObserver | null = null;

  onMounted(() => {
    const list = ([] as HTMLElement[]).concat(targets.value ?? []);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      shown.value = list.map(() => true);
      return;
    }
    const t = options.threshold ?? 0;
    shown.value = list.map(() => false);
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = list.indexOf(e.target as HTMLElement);
          if (i < 0) continue;
          const visible = t === 0 ? e.isIntersecting : e.intersectionRatio >= t;
          if (visible) shown.value[i] = true;
          // 只有退回觸發區下方才藏；從上方捲出去的維持顯示
          else if (!e.isIntersecting && e.rootBounds && e.boundingClientRect.top >= e.rootBounds.bottom) shown.value[i] = false;
        }
      },
      // 多一個 0：完全離開觸發區時也要收到通知
      { rootMargin: options.rootMargin, threshold: t === 0 ? 0 : [0, t] },
    );
    list.forEach((el) => io!.observe(el));
  });

  onBeforeUnmount(() => io?.disconnect());
  return shown;
}
