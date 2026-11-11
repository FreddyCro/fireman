// 文案：依目前語系（@nuxtjs/i18n，/ 是中文、/en 是英文）取 locales/{zh,en}/*.json。
//
// 中文為主：英文 JSON 只放有翻譯的 key，缺的不要填（也不要填空字串），執行時自動用中文補上，
// 英文頁出現中文就知道哪裡還沒翻。物件逐層補；陣列視為整段文案，英文有給就整個用英文的。
//
// 文案不放進 vue-i18n 的 messages：那樣陣列／物件要靠 tm() + rt() 一層層解，型別也會掉，
// 文案裡的 @ | { } 還得跳脫。這裡沿用「元件直接 import JSON」的寫法，模組只負責路由、<html lang>、hreflang。
// 沒有動態切換（換語系＝換網址，整頁重新渲染），所以回傳一般物件，不需要 computed。
import zhFooter from '~/locales/zh/footer.json';
import zhHeader from '~/locales/zh/header.json';
import zhMeta from '~/locales/zh/meta.json';
import zhEnding from '~/locales/zh/section-ending.json';
import zhHero from '~/locales/zh/section-hero.json';
import zhManpower from '~/locales/zh/section-manpower.json';
import zhNoTrapped from '~/locales/zh/section-no-trapped.json';
import zhViolation from '~/locales/zh/section-violation.json';
import zhUi from '~/locales/zh/ui.json';
import enFooter from '~/locales/en/footer.json';
import enHeader from '~/locales/en/header.json';
import enMeta from '~/locales/en/meta.json';
import enEnding from '~/locales/en/section-ending.json';
import enHero from '~/locales/en/section-hero.json';
import enManpower from '~/locales/en/section-manpower.json';
import enNoTrapped from '~/locales/en/section-no-trapped.json';
import enViolation from '~/locales/en/section-violation.json';
import enUi from '~/locales/en/ui.json';

const zh = {
  meta: zhMeta,
  header: zhHeader,
  footer: zhFooter,
  ui: zhUi,
  hero: zhHero,
  noTrapped: zhNoTrapped,
  violation: zhViolation,
  manpower: zhManpower,
  ending: zhEnding,
};

export type Copy = typeof zh;

type DeepPartial<T> = T extends unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/** 以中文為底，疊上英文有的 key */
function withFallback<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (over === undefined) return base;
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return over as T;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over as object)) {
    out[k] = withFallback((base as Record<string, unknown>)[k], v);
  }
  return out as T;
}

// 標成 DeepPartial<Copy>：英文可以少 key（用中文補），但不能多出中文沒有的 key
const enRaw: DeepPartial<Copy> = {
  meta: enMeta,
  header: enHeader,
  footer: enFooter,
  ui: enUi,
  hero: enHero,
  noTrapped: enNoTrapped,
  violation: enViolation,
  manpower: enManpower,
  ending: enEnding,
};

const en = withFallback(zh, enRaw);

export const COPY = { zh, en } satisfies Record<string, Copy>;
export type CopyLocale = keyof typeof COPY;

export function useCopy(): Copy {
  const { locale } = useI18n();
  return COPY[locale.value as CopyLocale] ?? zh;
}
