#!/usr/bin/env node
/* 奥数拔高系列：上完一讲，起一页。讲次页、动画页一次建好，并挂进目录。
 *
 * 用法: npm run bagao -- <第几讲>
 *   例: npm run bagao -- 1
 * 主题和本讲大纲从 docs/拔高/奥数拔高.md 的「课表」里读。
 *
 * 会生成（已存在的不会覆盖）：
 *   docs/拔高/第<N>讲.md                 讲次页
 *   demos/拔高第<N>讲-<主题>.html        动画页，模板里的 ../demos/ 已改成 lib/
 * 并自动改两处目录：
 *   docs/SUMMARY.md 的「## 奥数拔高」分组插一行（按讲次排）
 *   docs/拔高/奥数拔高.md 课表里这一讲：讲次改成链接，状态改成 ✅ + 看动画
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GROUP = '奥数拔高';
const HOME = 'docs/拔高/奥数拔高.md';
const PAGES = 'https://qiaojiaozhao.github.io/grade3-math/demos/';

const no = Number(process.argv[2]);
if (!Number.isInteger(no) || no < 1) {
  console.error('用法: npm run bagao -- <第几讲>\n  例: npm run bagao -- 1');
  process.exit(1);
}

const homeFile = path.join(ROOT, HOME);
const homeLines = fs.readFileSync(homeFile, 'utf8').split('\n');
const rowAt = homeLines.findIndex((l) => new RegExp(`^\\|\\s*\\[?第 ${no} 讲\\]?[^|]*\\|`).test(l));
if (rowAt < 0) {
  console.error(`${HOME} 的课表里没有第 ${no} 讲，先把这一讲加进课表`);
  process.exit(1);
}
const [, topic, outline, , handout] = homeLines[rowAt].split('|').map((c) => c.trim()).slice(1);

const page = `拔高/第${no}讲.md`;
const demoName = `拔高第${no}讲-${topic}.html`;
const demoUrl = PAGES + encodeURI(demoName);

const targets = [
  {
    from: '模板/拔高讲次模板.md',
    to: `docs/${page}`,
    fill: (s) =>
      s
        .replaceAll('【课表】', path.basename(HOME, '.md'))
        .replaceAll('【N】', String(no))
        .replaceAll('【主题】', topic)
        .replaceAll('【主要内容】', outline)
        .replaceAll('「【讲义】」', handout ? `「${handout}」` : '')
        .replaceAll('【文件名】.html', encodeURI(demoName)),
  },
  {
    from: '模板/动画模板.html',
    to: `demos/${demoName}`,
    fill: (s) =>
      s
        .replaceAll('../demos/lib/', 'lib/')
        .replace(/<!-- 复制这个文件到 demos\/.*?-->\n/, '')
        .replaceAll('【题目名】', `第${no}讲 ${topic}`),
  },
];

let created = 0;
for (const t of targets) {
  const dest = path.join(ROOT, t.to);
  if (fs.existsSync(dest)) {
    console.log(`· 跳过 ${t.to}（已存在）`);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, t.fill(fs.readFileSync(path.join(ROOT, t.from), 'utf8')));
  created++;
  console.log(`✓ 新建 ${t.to}`);
}

function insertIntoSummary() {
  const file = path.join(ROOT, 'docs/SUMMARY.md');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const head = lines.findIndex((l) => l.trim() === `## ${GROUP}`);
  if (head < 0) throw new Error(`docs/SUMMARY.md 里找不到「## ${GROUP}」分组`);
  let end = head + 1;
  while (end < lines.length && !lines[end].startsWith('## ')) end++;
  while (end > head + 1 && lines[end - 1].trim() === '') end--;
  let at = end;
  for (let i = head + 1; i < end; i++) {
    const m = lines[i].match(/\(拔高\/第(\d+)讲\.md\)/);
    if (!m) continue;
    if (Number(m[1]) === no) return console.log('· SUMMARY.md 里已有这一讲');
    if (Number(m[1]) > no && at === end) at = i;
  }
  lines.splice(at, 0, `* [第 ${no} 讲 ${topic}](${page})`);
  fs.writeFileSync(file, lines.join('\n'));
  console.log(`✓ 挂进 docs/SUMMARY.md 的「${GROUP}」`);
}

function markDoneInHome() {
  const cells = homeLines[rowAt].split('|').slice(1, -1).map((c) => c.trim());
  cells[0] = `[第 ${no} 讲](第${no}讲.md)`;
  cells[3] = `✅ [看动画](${demoUrl})`;
  homeLines[rowAt] = `| ${cells.join(' | ')} |`;
  fs.writeFileSync(homeFile, homeLines.join('\n'));
  console.log(`✓ ${HOME} 课表里第 ${no} 讲改成 ✅`);
}

insertIntoSummary();
markDoneInHome();

console.log(`
接下来（${created} 个新文件，第 ${no} 讲「${topic}」）：
  1. 对着讲义把例题做一遍，写下孩子会在哪一步想错 —— 口诀、动画、「容易错在哪」都对着它写
  2. 填掉 docs/${page} 和 demos/${demoName} 里所有【方括号】，删掉 HTML 注释
  3. 这一讲不做动画：删掉动画文件和讲次页「先看动画」一节，课表里的「看动画」改成「✅」
  4. npm run ship -- demos/${demoName}
  5. 看 .shots/${path.basename(demoName, '.html')}/sheet.png，全对了就提交：git commit -m "奥数拔高第 ${no} 讲：${topic}"
`);
