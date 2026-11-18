/**
 * public/img 檔案清單 → resources 頁的素材組（純函式，伺服器端掃檔後呼叫；test/resources-manifest.spec.ts）。
 *
 * 一組素材 ＝ 同資料夾、同主幹（去掉 _pc/_pad/_mob/_pcpad 與 @2x）、同原始格式的檔案。
 * .webp 若有同名 jpg/png 就併入該組當 WebP 變體，否則自成一組。
 * 命名規則見 architecture/assets-naming.md。
 */

export type Device = 'pc' | 'pad' | 'mob' | 'pcpad';
export type AssetKind = 'single' | 'rwd' | 'pcpad' | 'partial' | 'video' | 'review';

export interface AssetFile {
  /** 相對 public 的路徑，如 /img/manpower/pic0401_mob.jpg */
  path: string;
  size: number;
}

export interface AssetEntry {
  /** UPic / UVid 的 src：不含副檔名與裝置後綴 */
  src: string;
  /** 所在資料夾（相對 /img），如 manpower、violation/_review */
  dir: string;
  stem: string;
  ext: string;
  kind: AssetKind;
  devices: Device[];
  has2x: boolean;
  hasWebp: boolean;
  files: AssetFile[];
  /** 自動偵測到的問題 */
  issues: string[];
}

// <picture> 取第一個符合的 <source>，mob 的 media 是空字串（全部符合），必須排最後
const DEVICE_ORDER: Device[] = ['pc', 'pcpad', 'pad', 'mob'];
const COVERS: Record<Device, Array<'pc' | 'pad' | 'mob'>> = {
  pc: ['pc'],
  pad: ['pad'],
  mob: ['mob'],
  pcpad: ['pc', 'pad'],
};
const VIDEO_EXT = ['mp4'];
export const SIZE_WARN = 1024 * 1024;

const RE_NAME = /^(.+?)(?:_(pc|pad|mob|pcpad))?(@2x)?\.([a-z0-9]+)$/i;

export const formatSize = (n: number) =>
  n >= SIZE_WARN ? `${(n / SIZE_WARN).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

export function buildManifest(files: AssetFile[]): AssetEntry[] {
  const groups = new Map<string, AssetEntry & { hasBase: boolean }>();

  // 先處理非 webp，webp 才找得到要併入的 jpg/png
  const sorted = [...files].sort((a, b) => Number(a.path.endsWith('.webp')) - Number(b.path.endsWith('.webp')));

  for (const file of sorted) {
    const slash = file.path.lastIndexOf('/');
    const dir = file.path.slice('/img/'.length, slash);
    const name = file.path.slice(slash + 1);
    const review = dir.endsWith('_review');

    // _review 的檔名是設計端原檔名，不拆後綴，一檔一組
    const m = review ? null : name.match(RE_NAME);
    const stem = m ? m[1]! : name.replace(/\.[^.]+$/, '');
    const device = (m?.[2]?.toLowerCase() ?? null) as Device | null;
    const is2x = Boolean(m?.[3]);
    const ext = (m ? m[4]! : name.split('.').pop()!).toLowerCase();

    let key = `${dir}/${stem}.${ext}`;
    let isWebpVariant = false;
    if (ext === 'webp' && !review) {
      const base = ['jpg', 'png'].map((e) => `${dir}/${stem}.${e}`).find((k) => groups.has(k));
      if (base) {
        key = base;
        isWebpVariant = true;
      }
    }

    let g = groups.get(key);
    if (!g) {
      g = {
        src: `/img/${dir}/${stem}`,
        dir,
        stem,
        ext,
        kind: 'single',
        devices: [],
        has2x: false,
        hasWebp: false,
        files: [],
        issues: [],
        hasBase: false,
      };
      groups.set(key, g);
    }
    g.files.push(file);
    if (isWebpVariant) g.hasWebp = true;
    if (is2x) g.has2x = true;
    if (device && !g.devices.includes(device)) g.devices.push(device);
    if (!device) g.hasBase = true;
  }

  const entries = [...groups.values()].map(({ hasBase, ...g }) => {
    g.devices.sort((a, b) => DEVICE_ORDER.indexOf(a) - DEVICE_ORDER.indexOf(b));
    g.files.sort((a, b) => a.path.localeCompare(b.path));

    if (g.dir.endsWith('_review')) {
      g.kind = 'review';
      g.issues.push('待確認：交件中有疑慮、尚未正式命名的原始檔');
    } else if (VIDEO_EXT.includes(g.ext)) {
      g.kind = 'video';
    } else if (g.devices.length === 0) {
      g.kind = 'single';
    } else {
      const covered = new Set(g.devices.flatMap((d) => COVERS[d]));
      const missing = (['pc', 'pad', 'mob'] as const).filter((d) => !covered.has(d));
      const set = g.devices.join(',');
      if (missing.length) {
        g.kind = 'partial';
        g.issues.push(`缺 ${missing.join('、')} 版`);
      } else if (set === 'pc,pad,mob') {
        g.kind = 'rwd';
      } else if (set === 'pcpad,mob') {
        g.kind = 'pcpad';
      } else {
        g.kind = 'partial';
        g.issues.push(`裝置後綴組合重疊：${set}`);
      }
      if (hasBase) g.issues.push('同時有無後綴檔與裝置後綴檔');
    }

    for (const f of g.files) {
      if (f.size > SIZE_WARN) g.issues.push(`${f.path.split('/').pop()} ${formatSize(f.size)}，建議壓縮`);
    }
    return g;
  });

  // 英文版（主幹以 _en 結尾）與中文版的裝置組合要一致
  const bySrc = new Map(entries.map((e) => [`${e.dir}/${e.stem}.${e.ext}`, e]));
  for (const en of entries) {
    if (!en.stem.endsWith('_en')) continue;
    const zh = bySrc.get(`${en.dir}/${en.stem.slice(0, -3)}.${en.ext}`);
    if (!zh) {
      en.issues.push('找不到對應的中文版');
    } else if (zh.devices.join(',') !== en.devices.join(',')) {
      const show = (e: AssetEntry) => e.devices.join('/') || '不分裝置';
      en.issues.push(`與中文版裝置組合不同（中：${show(zh)}，英：${show(en)}）`);
    }
  }

  return entries.sort((a, b) => a.dir.localeCompare(b.dir) || a.stem.localeCompare(b.stem));
}

// --- 給元件用的 props / 程式碼 ---------------------------------------------------

export interface UpicBind {
  src: string;
  ext: string;
  usePrefix: boolean;
  use2x: boolean;
  webp: boolean;
  srcset: Device[];
  default: Device;
}

export function upicProps(e: AssetEntry): UpicBind {
  const noPrefix = e.kind === 'single' || e.kind === 'review';
  const srcset: Device[] = noPrefix ? ['mob'] : [...e.devices];
  return {
    // _review 的原檔名可能有空白（「 (1)」），會讓 srcset 斷錯，先編碼
    src: encodeURI(e.src),
    ext: e.ext,
    usePrefix: !noPrefix,
    use2x: e.has2x,
    webp: e.hasWebp,
    srcset,
    default: noPrefix ? 'mob' : (e.devices.includes('pcpad') ? 'pcpad' : e.devices[0]!),
  };
}

export function snippet(e: AssetEntry): string {
  if (e.kind === 'video') {
    const s = e.devices.length
      ? `{ mob: '${e.src}_mob', pad: '${e.src}_pad', pc: '${e.src}_pc' }`
      : `{ mob: '${e.src}', pad: '${e.src}', pc: '${e.src}' }`;
    return `<UVid :src="${s}" preload="metadata" />`;
  }
  const p = upicProps(e);
  const attrs = [`src="${e.src}"`];
  if (p.ext !== 'jpg') attrs.push(`ext="${p.ext}"`);
  if (!p.usePrefix) attrs.push(':use-prefix="false"');
  if (p.usePrefix && p.srcset.join(',') !== 'pc,pad,mob') attrs.push(`:srcset="[${p.srcset.map((d) => `'${d}'`).join(', ')}]"`);
  if (!p.usePrefix) attrs.push(`:srcset="['mob']"`);
  if (p.usePrefix && p.default !== 'pc') attrs.push(`default="${p.default}"`);
  if (!p.use2x) attrs.push(':use2x="false"');
  if (!p.webp) attrs.push(':webp="false"');
  attrs.push('alt=""');
  return `<UPic ${attrs.join(' ')} />`;
}
