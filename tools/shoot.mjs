#!/usr/bin/env node
/* 逐幕截图，用来检查动画有没有排版问题。做完动画先跑这个，再录视频。
 *
 * 用法: npm run shoot -- demos/倒油问题-移多补少与差倍.html
 * 截图默认落在 .shots/<动画名>/ （已 gitignore）。
 *
 * 会自动报三类问题：
 *   - 页面比画幅高，录视频时底部会被切掉
 *   - 旁白气泡压住了舞台里的文字标签
 *   - 页面有 JS 报错
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const input = process.argv[2];
if (!input) {
  console.error('用法: npm run shoot -- <动画 html 路径> [宽 高]');
  process.exit(1);
}
const htmlPath = path.resolve(ROOT, input);
if (!fs.existsSync(htmlPath)) {
  console.error(`找不到文件: ${htmlPath}`);
  process.exit(1);
}

const W = parseInt(process.argv[3] || '1280', 10);
const H = parseInt(process.argv[4] || '800', 10);
const outDir = path.join(ROOT, '.shots', path.basename(htmlPath, '.html'));

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + htmlPath);
await page.waitForFunction(() => typeof Anim !== 'undefined', null, { timeout: 15000 });
await page.addStyleTag({ content: '.controls{display:none!important}.hint{display:none!important}' });

const layout = await page.evaluate(() => ({
  overflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  scenes: Anim.sceneCount(),
}));

let problems = 0;
if (layout.overflow > 0) {
  problems++;
  console.warn(`⚠️  页面比画幅高 ${layout.overflow}px，录视频时底部会被切掉`);
}
console.log(`${path.basename(htmlPath)}  ${W}×${H}  共 ${layout.scenes} 幕`);

for (let i = 0; i < layout.scenes; i++) {
  await page.evaluate((n) => Anim.goto(n), i);
  await page.waitForTimeout(900); // 等这一幕的头几个动作演完再拍

  // 旁白气泡是绝对定位的，文字一多就会往下长，压住舞台里的标签
  const overlap = await page.evaluate(() => {
    const s = document.querySelector('.speech');
    if (!s) return 0;
    const box = s.getBoundingClientRect();
    const labels = [...document.querySelectorAll('.barrel .name, .bar-name, .bar-value')];
    if (!labels.length) return 0;
    return Math.round(Math.max(...labels.map((l) => box.bottom - l.getBoundingClientRect().top)));
  });

  const shot = path.join(outDir, `scene${i + 1}.png`);
  await page.screenshot({ path: shot });

  if (overlap > 0) {
    problems++;
    console.error(`  第 ${i + 1} 幕  ✗ 旁白压住标签 ${overlap}px`);
  } else {
    console.log(`  第 ${i + 1} 幕  ✓`);
  }
}

await browser.close();

if (errors.length) {
  problems += errors.length;
  console.error('页面报错:\n  ' + errors.join('\n  '));
}

console.log(`截图在 ${path.relative(ROOT, outDir)}/`);
if (problems) {
  console.error(`\n✗ 有 ${problems} 处问题要处理`);
  process.exit(1);
}
console.log('✓ 没发现排版问题');
