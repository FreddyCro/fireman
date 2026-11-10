#!/usr/bin/env node
/**
 * 設計交件素材 → public/img/<section>/ 的正規化搬移。
 *
 *   node scripts/assets/normalize.mjs <交件目錄>            # dry-run：只印計畫
 *   node scripts/assets/normalize.mjs <交件目錄> --apply    # 複製到 public/img
 *   node scripts/assets/normalize.mjs <交件目錄> --move     # 複製後刪除來源
 *
 * 規則見 architecture/assets-naming.md。重點：
 *   firefighter_p02_title0101_en_pc1106.svg → no-trapped/title0101_en_pc.svg
 *   ・頁碼 pNN 換成 section 資料夾，firefighter_ 前綴與日期 1106 拿掉。
 *   ・pcpadmob（三尺寸共用）→ 無後綴；padmob → 複製成 _pad 與 _mob（UPic 沒有 padmob）。
 *   ・同一組素材同時有 pcpadmob 與其他裝置版、檔名帶「 (1)」、或目標撞名但內容不同
 *     → 原檔名放進 <section>/_review/，等人工確認（resources 頁會列出）。
 *   ・目標撞名且內容相同 → 視為重複，略過。
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const SECTIONS = {
  '01': 'hero',
  '02': 'no-trapped',
  '03': 'violation',
  '04': 'manpower',
  '05': 'ending',
};
const UI_DIR = 'ui';
const DEST_ROOT = 'public/img';
const DEVICES = ['pcpadmob', 'pcpad', 'padmob', 'pc', 'pad', 'mob'];

// firefighter_p02_title0101_en_pc1106.svg / firefighter_p03_pic0105a_pcpad1106 (1).jpg
const RE_PAGE = new RegExp(
  `^firefighter_p(\\d{2})_(.+?)_(${DEVICES.join('|')})(\\d{4})?( \\(\\d+\\))?\\.([a-z0-9]+)$`,
  'i',
);
// button_card_click_left_pacpadmob.svg（設計端拼錯的 pacpadmob 也收）
const RE_SHARED = /^(button_.+?)_(?:pa?cpadmob)(\d{4})?\.([a-z0-9]+)$/i;
// firefighter_story1-1_loop_pc1110.jpg → hero/story1-1_loop_pc.jpg（hero 分鏡插畫，沒有頁碼）
const RE_STORY = new RegExp(
  `^firefighter_(story\\d+-\\d+_.+?)_(${DEVICES.join('|')})(\\d{4})?( \\(\\d+\\))?\\.([a-z0-9]+)$`,
  'i',
);
const STORY_SECTION = 'hero';

const args = process.argv.slice(2);
const srcDir = args.find((a) => !a.startsWith('--'));
const MOVE = args.includes('--move');
const APPLY = MOVE || args.includes('--apply');
if (!srcDir) {
  console.error('用法：node scripts/assets/normalize.mjs <交件目錄> [--apply | --move]');
  process.exit(1);
}

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};
const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');
const rel = (p) => relative('.', p).split(sep).join('/');

/** @type {{src:string, section:string, stem:string, device:string|null, ext:string, copy:boolean}[]} */
const entries = [];
const unknown = [];
const warnings = [];
/** @type {{src:string, date:string|undefined}[]} */
const dates = [];

for (const src of walk(srcDir)) {
  const name = basename(src);
  const folder = basename(dirname(src)).toLowerCase();
  let m = name.match(RE_PAGE);
  if (m) {
    const [, page, stem, device, date, copy, ext] = m;
    const section = SECTIONS[page];
    if (!section) {
      unknown.push(`${rel(src)}（未對應的頁碼 p${page}）`);
      continue;
    }
    const d = device.toLowerCase();
    dates.push({ src, date });
    // 交件資料夾（PC/PAD/MOB/PCPADMOB）要涵蓋檔名後綴的裝置
    if (['pc', 'pad', 'mob', 'pcpadmob'].includes(folder) && !folder.includes(d) && !d.includes(folder)) {
      warnings.push(`${rel(src)}：放在 ${folder.toUpperCase()}/ 但後綴是 ${d}`);
    }
    entries.push({ src, section, stem, device: d, ext: ext.toLowerCase(), copy: Boolean(copy) });
    continue;
  }
  m = name.match(RE_STORY);
  if (m) {
    const [, stem, device, date, copy, ext] = m;
    dates.push({ src, date });
    entries.push({ src, section: STORY_SECTION, stem, device: device.toLowerCase(), ext: ext.toLowerCase(), copy: Boolean(copy) });
    continue;
  }
  m = name.match(RE_SHARED);
  if (m) {
    entries.push({ src, section: UI_DIR, stem: m[1], device: 'pcpadmob', ext: m[3].toLowerCase(), copy: false });
    continue;
  }
  unknown.push(rel(src));
}

// --- 分組並決定目標檔名 -------------------------------------------------------

const groups = new Map();
for (const e of entries) {
  const key = `${e.section}/${e.stem}.${e.ext}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(e);
}

/** @type {{src:string, dest:string, kind:'ok'|'review'|'dup', note?:string}[]} */
const plan = [];
const claimed = new Map(); // dest → src

function claim(e, destName, note) {
  const dest = `${DEST_ROOT}/${e.section}/${destName}`;
  const prev = claimed.get(dest);
  if (prev) {
    if (md5(prev) === md5(e.src)) return plan.push({ src: e.src, dest, kind: 'dup', note: `與 ${rel(prev)} 內容相同` });
    return toReview(e, `與 ${rel(prev)} 搶同一個檔名 ${destName}`);
  }
  if (existsSync(dest) && md5(dest) !== md5(e.src)) {
    return toReview(e, `public 已有不同內容的 ${destName}`);
  }
  claimed.set(dest, e.src);
  plan.push({ src: e.src, dest, kind: 'ok', note });
}

function toReview(e, note) {
  plan.push({ src: e.src, dest: `${DEST_ROOT}/${e.section}/_review/${basename(e.src)}`, kind: 'review', note });
}

for (const items of groups.values()) {
  // 明確的單一裝置版先認領，padmob 展開的副本才不會搶走它們的檔名
  const order = { pc: 0, pad: 1, mob: 2, pcpad: 3, pcpadmob: 4, padmob: 5 };
  items.sort((a, b) => Number(a.copy) - Number(b.copy) || order[a.device] - order[b.device]);
  const hasShared = items.some((e) => e.device === 'pcpadmob' && !e.copy);

  for (const e of items) {
    const { stem, ext, device } = e;
    if (e.copy) {
      // 「 (1)」副本和正本一模一樣就直接丟掉，不同才需要人看
      const twin = items.find((x) => !x.copy && x.device === e.device);
      if (twin && md5(twin.src) === md5(e.src)) {
        plan.push({ src: e.src, dest: '（略過）', kind: 'dup', note: `與 ${basename(twin.src)} 內容相同` });
      } else {
        toReview(e, '檔名帶「 (n)」，疑似重複下載的版本');
      }
    } else if (device === 'pcpadmob') {
      claim(e, `${stem}.${ext}`);
    } else if (hasShared) {
      toReview(e, `同組已有 pcpadmob（三尺寸共用）版本，這個 ${device} 版不知道該用哪個`);
    } else if (device === 'padmob') {
      claim(e, `${stem}_pad.${ext}`, 'padmob 拆成 _pad');
      claim(e, `${stem}_mob.${ext}`, 'padmob 拆成 _mob');
    } else {
      claim(e, `${stem}_${device}.${ext}`);
    }
  }
}

// --- 交叉檢查 ----------------------------------------------------------------

// 日期跟同批多數不同 → 可能是舊版混進來
const dateCount = {};
for (const { date } of dates) if (date) dateCount[date] = (dateCount[date] ?? 0) + 1;
const mainDate = Object.entries(dateCount).sort((a, b) => b[1] - a[1])[0]?.[0];
for (const { src, date } of dates) {
  if (mainDate && date !== mainDate) warnings.push(`${rel(src)}：日期 ${date ?? '（無）'}，同批其他檔是 ${mainDate}，是否為舊版？`);
}

// 不同素材內容完全相同（可能是刻意重用，也可能是交錯檔）
const byHash = new Map();
for (const p of plan) {
  if (p.kind !== 'ok') continue;
  const h = md5(p.src);
  if (!byHash.has(h)) byHash.set(h, new Set());
  byHash.get(h).add(p.src);
}
for (const srcs of byHash.values()) {
  if (srcs.size > 1) warnings.push(`內容相同：${[...srcs].map((s) => basename(s)).join('、')}`);
}

// --- 輸出 --------------------------------------------------------------------

plan.sort((a, b) => a.dest.localeCompare(b.dest));
const label = { ok: '  ', review: '⚠️', dup: '⏭️' };
for (const p of plan) {
  console.log(`${label[p.kind]} ${rel(p.src).replace(rel(srcDir) + '/', '')}  →  ${p.dest}${p.note ? `  （${p.note}）` : ''}`);
}
for (const w of warnings) console.log(`⚠️ ${w}`);
for (const u of unknown) console.log(`❓ 無法辨識：${u}`);

const count = (k) => plan.filter((p) => p.kind === k).length;
console.log(
  `\n來源 ${entries.length + unknown.length} 檔｜輸出 ${count('ok')}（含 padmob 拆檔）｜待確認 ${count('review')}｜重複略過 ${count('dup')}｜無法辨識 ${unknown.length}`,
);

if (!APPLY) {
  console.log('\n（dry-run，未寫入任何檔案。加 --apply 複製、--move 複製後刪除來源）');
  process.exit(0);
}

for (const p of plan) {
  if (p.kind === 'dup') continue;
  mkdirSync(dirname(p.dest), { recursive: true });
  copyFileSync(p.src, p.dest);
}
if (MOVE) {
  // 只刪除已搬走或確認重複的來源；無法辨識的留在原處
  const done = new Set(plan.map((p) => p.src));
  for (const src of done) rmSync(src);
}
console.log(`\n已${MOVE ? '搬移' : '複製'}完成。`);
