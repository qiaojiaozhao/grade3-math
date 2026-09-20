#!/usr/bin/env node
/**
 * 把生成的角色图去掉白底、裁到内容边界、缩到合适大小。
 *
 *   npm run cutout -- <图片> [输出路径] [--max=320]
 *
 * 图片生成工具给的都是白底大图，直接拿去当角色会带一圈白框，
 * 而且每张图里角色的位置都不一样，没法在 CSS 里对齐。
 * 这里统一处理成「贴边、透明底」的小图，动画里用 background-position: bottom
 * 就能让不同角色踩在同一条地平线上。
 *
 * 用 Playwright 的 canvas 来读写像素，没有额外依赖。
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const maxArg = args.find((a) => a.startsWith('--max='));
const MAX = maxArg ? parseInt(maxArg.split('=')[1], 10) : 320;
const files = args.filter((a) => !a.startsWith('--'));

const src = files[0];
if (!src) {
  console.error('用法：npm run cutout -- <图片> [输出路径] [--max=320]');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`找不到 ${src}`);
  process.exit(1);
}
const out = files[1] || src.replace(/\.png$/i, '') + '-cut.png';

const dataUrl = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();

const result = await page.evaluate(async ({ dataUrl, MAX }) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;

  // 离纯白多远。纯白是 0，越有颜色越大。
  // T0 以下当背景抹掉，T1 以上当实心保留，中间那条窄带按比例给半透明，
  // 这样矢量图的抗锯齿边不会留一圈白毛边。
  const T0 = 10;
  const T1 = 34;

  for (let i = 0; i < px.length; i += 4) {
    const d = Math.max(255 - px[i], 255 - px[i + 1], 255 - px[i + 2]);
    if (d <= T0) {
      px[i + 3] = 0;
    } else if (d < T1) {
      const a = (d - T0) / (T1 - T0);
      // 反预乘：像素 = a*原色 + (1-a)*白，把原色还原出来，否则边缘发白
      for (let k = 0; k < 3; k++) {
        px[i + k] = Math.max(0, Math.min(255, (px[i + k] - 255 * (1 - a)) / a));
      }
      px[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(data, 0, 0);

  // 找出还剩下的内容的外接框
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (px[(y * c.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { error: '整张图都被当成背景抹掉了' };

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const scale = Math.min(1, MAX / Math.max(w, h));

  const o = document.createElement('canvas');
  o.width = Math.round(w * scale);
  o.height = Math.round(h * scale);
  const octx = o.getContext('2d');
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height);

  return { png: o.toDataURL('image/png'), w: o.width, h: o.height, srcW: w, srcH: h };
}, { dataUrl, MAX });

await browser.close();

if (result.error) {
  console.error('✗ ' + result.error);
  process.exit(1);
}

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(result.png.split(',')[1], 'base64'));

const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`✓ ${out}  ${result.w}×${result.h}  ${kb} KB  （原内容 ${result.srcW}×${result.srcH}）`);
