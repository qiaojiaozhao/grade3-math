#!/usr/bin/env node
/* 把一个动画页面的完整自动播放录成 mp4，放在 html 旁边。
 *
 * 用法: npm run record -- demos/倒油问题-移多补少与差倍.html
 *
 * 做法是开一个真实的 Chromium 播一遍并录屏，所以补间动画是连续的，
 * 不是截图拼起来的幻灯片。录制时会隐藏播放按钮和底部提示 —— 视频里点不了，
 * 留着只会分散注意力。默认竖版 1080×1920，对齐微信视频号 9:16。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const input = process.argv[2];
if (!input) {
  console.error('用法: npm run record -- <动画 html 路径> [宽 高]');
  process.exit(1);
}
const htmlPath = path.resolve(ROOT, input);
if (!fs.existsSync(htmlPath)) {
  console.error(`找不到文件: ${htmlPath}`);
  process.exit(1);
}

const W = parseInt(process.argv[3] || '1080', 10);
const H = parseInt(process.argv[4] || '1920', 10);
const outPath = htmlPath.replace(/\.html$/, '.mp4');

const RECORD_CHROME = `
  html, body { background: #07080a !important; }
  .controls, .dots, .hint { display: none !important; }
`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anim-rec-'));

try {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: tmpDir, size: { width: W, height: H } },
  });
  // 录像从页面建立那一刻开始，记下时间，最后把开头的空白裁掉
  const tPage = Date.now();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.ANIM_HOLD = true; // 别自动播第一幕，等 playAll 统一从头开始
    const apply = () => document.body && document.body.classList.add('portrait');
    document.addEventListener('DOMContentLoaded', apply);
  });

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('file://' + htmlPath);
  await page.waitForFunction(() => typeof Anim !== 'undefined', null, { timeout: 15000 });
  await page.evaluate(() => document.body.classList.add('portrait'));
  await page.addStyleTag({ content: RECORD_CHROME });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight
  );
  if (overflow > 0) {
    console.warn(`⚠️  页面比画幅高 ${overflow}px，底部会被切掉。建议加高: npm run record -- ${input} ${W} ${H + overflow}`);
  }

  // 页面已经被 ANIM_HOLD 停在第一幕之前，只等图片和字体就位
  await page.waitForTimeout(400);

  const t0 = Date.now();
  // 从建页到点火这段是空白舞台，裁掉；留 0.3s 余量，宁多留一点也别切掉动画开头
  const leadSec = Math.max(0, (t0 - tPage) / 1000 - 0.3);
  // 不能 return 这个 Promise —— evaluate 会一直等到整段播完才返回，
  // 后面就没机会观察播放状态了。这里只管点火。
  await page.evaluate(() => { Anim.playAll(); });
  await page.waitForFunction(() => Anim.isPlaying(), null, { timeout: 15000 });
  console.log(`播放开始，共 ${await page.evaluate(() => Anim.sceneCount())} 幕`);

  await page.waitForFunction(() => !Anim.isPlaying(), null, { timeout: 15 * 60 * 1000 });
  console.log(`播放结束，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // 结尾多留 2 秒，别让最后一句话一闪而过
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();

  if (errors.length) {
    console.error('页面报错:\n  ' + errors.join('\n  '));
    process.exit(1);
  }

  const webm = fs.readdirSync(tmpDir).find((f) => f.endsWith('.webm'));
  if (!webm) throw new Error('没有生成录像文件');

  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-ss', leadSec.toFixed(2),
    '-i', path.join(tmpDir, webm),
    // 录课是高频动作，优先出片速度；veryfast 对屏幕动画体积影响很小。
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-movflags', '+faststart',
    outPath,
  ]);

  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`✓ ${path.relative(ROOT, outPath)}  ${W}×${H}  ${mb} MB`);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
