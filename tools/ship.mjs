#!/usr/bin/env node
/* 一课做完的收尾一条龙：质检截图 + 录 mp4 同时跑，然后重建首页、查链接。
 *
 * 用法: npm run ship -- demos/一筐桃子-还原问题.html
 *       npm run ship -- demos/一筐桃子-还原问题.html --no-record   # 只质检不录
 *
 * shoot 和 record 各开一个 Chromium、互不依赖，所以并行。串着跑要 30 多秒，
 * 并行只要最慢的那个（录像）的时间。任何一步失败都会以非零退出，别带病推送。
 */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const noRecord = args.includes('--no-record');
const input = args.find((a) => !a.startsWith('--'));
if (!input) {
  console.error('用法: npm run ship -- <动画 html 路径> [--no-record]');
  process.exit(1);
}

function run(label, script, extra = []) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', script), ...extra], {
      cwd: ROOT,
      env: process.env,
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => {
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`\n── ${label}  ${code === 0 ? '✓' : '✗'}  ${sec}s ──`);
      process.stdout.write(out.replace(/^\n+/, ''));
      resolve(code === 0);
    });
  });
}

const tAll = Date.now();

const jobs = [run('质检截图 shoot', 'shoot.mjs', [input])];
if (!noRecord) jobs.push(run('录制 record', 'record.mjs', [input]));
const results = await Promise.all(jobs);

let ok = results.every(Boolean);
if (ok) {
  ok = (await run('重建首页 index', 'build-index.mjs')) && ok;
  ok = (await run('查链接 check', 'check-links.mjs')) && ok;
}

const total = ((Date.now() - tAll) / 1000).toFixed(1);
if (!ok) {
  console.error(`\n✗ 有步骤失败，共用 ${total}s。修好再推。`);
  process.exit(1);
}
console.log(`\n✓ 全部通过，共用 ${total}s。看一眼 .shots/ 里的 sheet.png，然后 git add -A && git commit && git push`);
