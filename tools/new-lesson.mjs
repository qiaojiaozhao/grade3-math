#!/usr/bin/env node
/* 从模板起一课：母题页、例题页、动画页三个文件一次建好，名字和互相之间的链接都填上。
 *
 * 用法: npm run new -- <母题名> <例题名>
 *   例: npm run new -- 还原问题 一筐桃子
 *
 * 会生成（已存在的不会覆盖）：
 *   docs/知识点/<母题名>.md           母题已存在就跳过——那是旧骨头换衣服，去原页加一题
 *   docs/题目/<例题名>.md
 *   demos/<例题名>-<母题名>.html      模板里的 ../demos/ 已改成 lib/
 *
 * 剩下的填空仍然是【方括号】，写完用 npm run check 兜底。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const [motif, problem] = process.argv.slice(2);
if (!motif || !problem) {
  console.error('用法: npm run new -- <母题名> <例题名>');
  process.exit(1);
}

const demoName = `${problem}-${motif}.html`;

const targets = [
  {
    from: '模板/知识点模板.md',
    to: `docs/知识点/${motif}.md`,
    fill: (s) => s.replaceAll('【母题名】', motif),
    skipNote: '母题页已存在：这是旧骨头换衣服，去这页的「换一身衣服」里加一题，别新建母题',
  },
  {
    from: '模板/例题模板.md',
    to: `docs/题目/${problem}.md`,
    fill: (s) =>
      s
        .replaceAll('【例题名】', problem)
        .replaceAll('【母题名】', motif)
        .replaceAll('【文件名】.html', encodeURI(demoName)),
  },
  {
    from: '模板/动画模板.html',
    to: `demos/${demoName}`,
    fill: (s) =>
      s
        .replaceAll('../demos/lib/', 'lib/')
        .replace(/<!-- 复制这个文件到 demos\/.*?-->\n/, '')
        .replaceAll('【题目名】', problem),
  },
];

let created = 0;
for (const t of targets) {
  const dest = path.join(ROOT, t.to);
  if (fs.existsSync(dest)) {
    console.log(`· 跳过 ${t.to}${t.skipNote ? `\n    ${t.skipNote}` : '（已存在）'}`);
    continue;
  }
  const src = fs.readFileSync(path.join(ROOT, t.from), 'utf8');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, t.fill(src));
  created++;
  console.log(`✓ 新建 ${t.to}`);
}

console.log(`
接下来（${created} 个新文件）：
  1. 先做一遍题，写下孩子会在哪一步想错 —— 口诀、动画、「容易错在哪」都对着它写
  2. 填掉三个文件里所有【方括号】，删掉 HTML 注释
  3. 挂进目录：docs/SUMMARY.md、docs/README.md、docs/认出母题.md、docs/大纲.md
     新母题还要在 tools/build-index.mjs 的 MOTIFS 加一行
  4. npm run ship -- demos/${demoName}
  5. 看 .shots/${path.basename(demoName, '.html')}/sheet.png，全对了就 git add -A && git commit && git push
`);
