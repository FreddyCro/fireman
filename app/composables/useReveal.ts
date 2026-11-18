/**
 * 元素第一次進入視窗就標成「已出現」，之後不再藏回去（scrapbook 素材、02 應變順序的淡入）。
 * 回傳與 targets 同順序的 boolean 陣列；樣式自己用 class 做 opacity 過場。
 * prefers-reduced-motion 或不支援 IntersectionObserver 時一開始就全部出現。
 */
export function useReveal(
  targets: Ref<HTMLElement[] | HTMLElement | null>,
  options: IntersectionObserverInit = { threshold: 0.3 },
) {
  const shown = ref<boolean[]>([]);
  let io: IntersectionObserver | null = null;

  onMounted(() => {
    const list = ([] as HTMLElement[]).concat(targets.value ?? []);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      shown.value = list.map(() => true);
      return;
    }
    shown.value = list.map(() => false);
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = list.indexOf(e.target as HTMLElement);
        if (i >= 0) shown.value[i] = true;
        io?.unobserve(e.target);
      }
    }, options);
    list.forEach((el) => io!.observe(el));
  });

  onBeforeUnmount(() => io?.disconnect());
  return shown;
}
