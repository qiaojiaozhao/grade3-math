#!/usr/bin/env node
/* 把扫描版讲义 PDF 渲染成图片，方便逐页看清题目。
 *
 * 用法: npm run pdf -- ~/Downloads/数学培优.pdf [输出目录] [放大倍数]
 *
 * 扫描件里没有文字层，直接读 PDF 只会得到空白，必须先转成图片。
 */
import fs from 'node:fs';
import path from 'node:path';
import * as mupdf from 'mupdf';

const input = process.argv[2];
if (!input) {
  console.error('用法: npm run pdf -- <pdf 路径> [输出目录] [放大倍数]');
  process.exit(1);
}

const pdfPath = path.resolve(input.replace(/^~/, process.env.HOME || '~'));
if (!fs.existsSync(pdfPath)) {
  console.error(`找不到文件: ${pdfPath}`);
  process.exit(1);
}

const outDir = path.resolve(process.argv[3] || path.join(path.dirname(pdfPath), '讲义图片'));
const scale = parseFloat(process.argv[4] || '3'); // 3 倍足够看清手写批注

fs.mkdirSync(outDir, { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), 'application/pdf');
const pages = doc.countPages();
console.log(`${path.basename(pdfPath)} 共 ${pages} 页`);

for (let i = 0; i < pages; i++) {
  const pix = doc.loadPage(i).toPixmap(
    mupdf.Matrix.scale(scale, scale),
    mupdf.ColorSpace.DeviceRGB,
    false,
    true
  );
  const out = path.join(outDir, `page${String(i + 1).padStart(2, '0')}.png`);
  fs.writeFileSync(out, pix.asPNG());
  console.log(`  第 ${i + 1} 页 -> ${out}  ${pix.getWidth()}×${pix.getHeight()}`);
}
