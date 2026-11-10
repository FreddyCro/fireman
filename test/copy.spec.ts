// 中英文文案（app/locales/{zh,en}/）：兩邊檔案與結構要一致，英文不能殘留中文
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

  it.each(files)('%s 中英文結構一致', (file) => {
    expect(shape(load('en', file))).toEqual(shape(load('zh', file)));
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
