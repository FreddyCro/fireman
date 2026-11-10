// resources 頁的素材清單：即時掃 public/img，dev 時新增檔案重新整理就看得到；
// generate 時由 prerender 抓一次寫進靜態頁。
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { buildManifest, type AssetFile } from '../../../app/utils/poc/resources/manifest';

const PUBLIC_DIR = join(process.cwd(), 'public');
const IMG_DIR = join(PUBLIC_DIR, 'img');
const MEDIA = /\.(jpe?g|png|webp|svg|gif|mp4)$/i;

function walk(dir: string, out: AssetFile[] = []): AssetFile[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (MEDIA.test(name)) out.push({ path: '/' + relative(PUBLIC_DIR, full).split(sep).join('/'), size: st.size });
  }
  return out;
}

export default defineEventHandler(() => buildManifest(walk(IMG_DIR)));
