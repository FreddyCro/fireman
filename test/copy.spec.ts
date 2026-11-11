// 中英文文案（app/locales/{zh,en}/）：中文為主，英文只能有中文有的 key（缺的執行時用中文補），英文不能殘留中文
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = (lang: string) => resolve(__dirname, '../app/locales', lang);
const load = (lang: string, file: string) => JSON.parse(readFileSync(resolve(dir(lang), file), 'utf8'));
const files = readdirSync(dir('zh')).filter((f) => f.endsWith('.json'));

/** 物件的 key 結構（陣列只比「是陣列」，長度可以不同，例如標題斷行數） */
const shape = (v: unknown): unknown =>
  Array.isArray(v)
    ? 'array'
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]))
      : typeof v;

/** 所有字串值，_ 開頭的備註 key 除外 */
const strings = (v: unknown, path = ''): [string, string][] =>
  typeof v === 'string'
    ? [[path, v]]
    : v && typeof v === 'object'
      ? Object.entries(v)
          .filter(([k]) => !k.startsWith('_'))
          .flatMap(([k, x]) => strings(x, `${path}.${k}`))
      : [];

describe('文案中英對照', () => {
  it('英文與中文的檔案相同', () => {
    expect(readdirSync(dir('en')).filter((f) => f.endsWith('.json')).sort()).toEqual([...files].sort());
  });

  it.each(files)('%s 英文沒有中文以外的 key、型別一致', (file) => {
    expect(shape(load('zh', file))).toMatchObject(shape(load('en', file)) as object);
  });

  it.each(files)('%s 英文不用空字串佔位（缺翻譯就不要填，讓中文補上）', (file) => {
    const zhStrings = new Map(strings(load('zh', file)));
    // 陣列是整段替換、不逐項補中文，陣列裡的空字串是刻意的（例如英文不用中文 SVG），不檢查
    const blanks = strings(load('en', file)).filter(
      ([path, s]) => s === '' && zhStrings.get(path) && !/\.\d+(\.|$)/.test(path),
    );
    expect(blanks).toEqual([]);
  });

  it.each(files)('%s 英文沒有殘留中文', (file) => {
    const leftovers = strings(load('en', file)).filter(([, s]) => /\p{Script=Han}/u.test(s));
    expect(leftovers).toEqual([]);
  });

  it.each(['zh', 'en'])('%s：hero 殉職名單筆數與人數一致', (lang) => {
    const hero = load(lang, 'section-hero.json');
    expect(hero.roll.names).toHaveLength(Number.parseInt(hero.count.number));
  });
});
