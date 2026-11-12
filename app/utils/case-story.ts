// 案例區（ui/CaseStory.vue）的版面資料型別：02 no-trapped、03 violation 的 cases.ts 共用。
// 版面（素材路徑、比例、疊字位置）中英文共用，放各 section 的 utils；文字放 locales，以 id 對應。
//
// 右欄由上到下排一串 item，捲到視窗中線的那個 media 是 active：
// ・doc（文件）：400 → 500 寬，並換成焦點圖（灰底只留螢光重點句）
// ・photo（照片）：400 → 500 寬，可疊文字與箭頭
// ・steps（情境插圖）：固定寬，捲過它時依序換圖（a → b → c），可附溫度計
// ・heading（文件標題＋分隔線）、quote（粗體引述，只有 PC 稿有）不會 active

/** 疊在照片上的元素，位置是照片寬高的百分比（設計稿 400 寬換算） */
export interface CaseOverlayArrow {
  src: string;
  x: number;
  y: number;
  /** 箭頭寬度（照片寬的百分比） */
  w: number;
}

export interface CaseOverlayText {
  /** 文字的 locales key（items.<id>.overlay） */
  x: number;
  y: number;
  /** 文字框寬度（照片寬的百分比）；不給＝不換行 */
  w?: number;
  /** 文字中心對齊 x（text-align: center，x 為中心點） */
  center?: boolean;
  /** 深色字（照片上方是淺色天空）；預設白字 */
  dark?: boolean;
}

export type CaseItem =
  | { kind: 'heading'; id: string }
  | { kind: 'quote'; id: string }
  | {
      kind: 'doc';
      id: string;
      src: string;
      /** CSS aspect-ratio，如 "400/410"（焦點圖同比例） */
      ratio: string;
      /** active 時換上的焦點圖 */
      focus: string;
      /** 焦點圖只有 pc／pad 版（檔名 _pcpad）：mob 不換圖、只放大 */
      focusPcPadOnly?: boolean;
    }
  | {
      kind: 'photo';
      id: string;
      src: string;
      ratio: string;
      overlayText?: CaseOverlayText;
      arrows?: CaseOverlayArrow[];
    }
  | {
      kind: 'steps';
      id: string;
      /** 依序切換的圖（同尺寸） */
      srcs: string[];
      /** 圖的 CSS aspect-ratio */
      ratio: string;
      /**
       * 溫度計（屏東）：每一步的漸層 [白色停在 %, 橘色停在 %]，
       * 設計稿 P01 白 64% / 橘 100%、P02 白 0% / 橘 64%、P03 白 0% / 橘 19%
       */
      thermometer?: [number, number][];
    };

/** 單一案例的版面：中英文共用，文案在各 section 的 locales 以 id 對應 */
export interface CaseLayout {
  id: string;
  items: CaseItem[];
}

/** 會變 active 的 item */
export const isMedia = (it: CaseItem) => it.kind === 'doc' || it.kind === 'photo' || it.kind === 'steps';

/** steps item 依捲動進度（0–1）取第幾張圖 */
export const stepAt = (progress: number, count: number) =>
  Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
