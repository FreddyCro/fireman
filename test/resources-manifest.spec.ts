import { describe, expect, it } from 'vitest';
import { buildManifest, snippet, upicProps } from '../app/utils/poc/resources/manifest';

const f = (path: string, size = 1000) => ({ path, size });
const byStem = (list: ReturnType<typeof buildManifest>, stem: string) => list.find((e) => e.stem === stem)!;

describe('buildManifest', () => {
  it('三斷點各一張 → rwd，裝置由大到小排', () => {
    const [e] = buildManifest([f('/img/a/t_mob.svg'), f('/img/a/t_pc.svg'), f('/img/a/t_pad.svg')]);
    expect(e).toMatchObject({ src: '/img/a/t', kind: 'rwd', devices: ['pc', 'pad', 'mob'], issues: [] });
  });

  it('pcpad ＋ mob → pcpad，UPic 的 mob source 排最後、default 是 pcpad', () => {
    const [e] = buildManifest([f('/img/a/p_mob.jpg'), f('/img/a/p_pcpad.jpg')]);
    expect(e!.kind).toBe('pcpad');
    expect(upicProps(e!)).toMatchObject({ srcset: ['pcpad', 'mob'], default: 'pcpad', usePrefix: true });
  });

  it('無後綴 → single，usePrefix false', () => {
    const [e] = buildManifest([f('/img/a/bg.png')]);
    expect(e!.kind).toBe('single');
    expect(snippet(e!)).toBe(`<UPic src="/img/a/bg" ext="png" :use-prefix="false" :srcset="['mob']" :use2x="false" :webp="false" alt="" />`);
  });

  it('缺裝置 → partial 並列出缺哪個', () => {
    const [e] = buildManifest([f('/img/a/x_pcpad.jpg')]);
    expect(e!.kind).toBe('partial');
    expect(e!.issues).toContain('缺 mob 版');
  });

  it('_en 主幹不會被誤拆成裝置後綴，且與中文版比對裝置組合', () => {
    const list = buildManifest([
      f('/img/a/t_pc.svg'), f('/img/a/t_pad.svg'),
      f('/img/a/t_en_pc.svg'), f('/img/a/t_en_pad.svg'), f('/img/a/t_en_mob.svg'),
    ]);
    expect(byStem(list, 't_en').devices).toEqual(['pc', 'pad', 'mob']);
    expect(byStem(list, 't').issues).toContain('缺 mob 版');
    expect(byStem(list, 't_en').issues[0]).toMatch(/與中文版裝置組合不同/);
  });

  it('webp 與 @2x 併入同名 jpg', () => {
    const [e, ...rest] = buildManifest([
      f('/img/a/p.jpg'), f('/img/a/p@2x.jpg'), f('/img/a/p.webp'), f('/img/a/p@2x.webp'),
    ]);
    expect(rest).toHaveLength(0);
    expect(e).toMatchObject({ kind: 'single', has2x: true, hasWebp: true });
  });

  it('單獨的 webp 自成一組', () => {
    const [e] = buildManifest([f('/img/hero/1-1.webp')]);
    expect(e).toMatchObject({ ext: 'webp', hasWebp: false });
  });

  it('_review 不拆後綴、標成待確認，含空白的檔名會被編碼', () => {
    const [e] = buildManifest([f('/img/v/_review/x_pcpad1106 (1).jpg')]);
    expect(e).toMatchObject({ kind: 'review', stem: 'x_pcpad1106 (1)' });
    expect(upicProps(e!).src).toBe('/img/v/_review/x_pcpad1106%20(1)');
  });

  it('超過 1 MB 提醒壓縮', () => {
    const [e] = buildManifest([f('/img/a/big.png', 2 * 1024 * 1024)]);
    expect(e!.issues).toContain('big.png 2.0 MB，建議壓縮');
  });
});
