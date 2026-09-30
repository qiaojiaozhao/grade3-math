#!/usr/bin/env node
/* 扫描仓库，重新生成 GitHub Pages 的落地页 index.html。
 * 用法: npm run index
 *
 * 落地页是「母题地图」：按六个单元分区，每个单元下面是按课序排的母题卡片，
 * 口诀和动画挂在对应母题下面。讲解页链到 GitBook（.md 在 Pages 上会变成下载），动画留在本站。
 * GitBook 网址从 docs/SUMMARY.md 的分组 + PAGE_SLUG 里的拼音算出来。
 *
 * 标题和摘要仍然从文件里读：
 *   - demos/*.html       标题取 <h1>，摘要取 <meta name="description">
 *   - docs/知识点/*.md    口诀取「一句话口诀」那条引用
 *   - docs/题目/*.md      摘要取题面第一句
 * 新母题要在下面 MOTIFS 里加一行、PAGE_SLUG 里补拼音，才会出现在地图上。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = 'https://smileyes.gitbook.io/smileyes-docs';

// 六个单元，顺序就是学习顺序。name 必须和 docs/SUMMARY.md 里的「## 分组名」一模一样，
// slug 是 GitBook 给这个分组生成的网址段（分组名的拼音）。todo 是还没写成课、先在地图上占位的母题。
// course 是把整个单元串起来的系统课：file 在 docs/单元/ 下，demo 是动画文件名里的关键字。
const UNITS = [
  { no: '一', name: '画线段图', slug: 'hua-xian-duan-tu', pic: '两根条子比高矮', todo: ['归一'],
    course: { file: '画线段图系统课.md', demo: '一张图' } },
  { no: '二', name: '倒推与假设', slug: 'dao-tui-yu-jia-she', pic: '从结果倒着走，或先假设全是一种', todo: [] },
  { no: '三', name: '数清楚', slug: 'shu-qing-chu', pic: '画一条线数点和段，几个一组数有几组', todo: ['枚举'] },
  { no: '四', name: '巧算', slug: 'qiao-suan', pic: '先看数再动笔，找能凑整的好朋友', todo: ['巧填算符', '数字谜'] },
  { no: '五', name: '图形', slug: 'tu-xing', pic: '按顺序数，凹进去的边推出去', todo: ['巧求周长', '一笔画'] },
  { no: '六', name: '推理', slug: 'tui-li', pic: '一样多的可以换，条件多了画表', todo: ['奇偶'] },
];

// 奥数拔高系列：独立于六单元，跟着学而思三年级秋季的课走。课表在 home 页里，
// 讲次页是 docs/拔高/第N讲.md（网址段 di-N-jiang，不用进 PAGE_SLUG），动画是 demos/拔高第N讲-主题.html。
const BAGAO = { name: '奥数拔高', slug: 'ao-shu-ba-gao', home: '拔高/奥数拔高.md' };
const BAGAO_INK = [
  ['#b45309', '#fff6d8'], ['#0f766e', '#ccfbf1'], ['#1d4ed8', '#dbeafe'],
  ['#be185d', '#fce7f3'], ['#6d28d9', '#ede9fe'], ['#c2410c', '#ffedd5'],
];

// 已经写成课的母题，按单元里的课序排。demo 是动画文件名里的关键字。
const MOTIFS = [
  { unit: '画线段图', file: '和差问题.md', name: '和差', mark: '和 + 差', ink: '#2f7a5b', paper: '#e8f6ee', demo: ['大衣'] },
  { unit: '画线段图', file: '和倍问题.md', name: '和倍', mark: '和 + 倍', ink: '#2c6fb3', paper: '#e7f1fb', demo: [] },
  { unit: '画线段图', file: '差倍问题.md', name: '差倍', mark: '差 + 倍', ink: '#c05621', paper: '#fff1e4', demo: ['倒油'] },
  { unit: '画线段图', file: '移多补少.md', name: '移多补少', mark: '倒过去就相等', ink: '#8a4ec7', paper: '#f3eaff', demo: ['倒油'] },
  { unit: '画线段图', file: '年龄问题.md', name: '年龄', mark: '差不变', ink: '#c2410c', paper: '#ffedd5', demo: ['妈妈'] },
  { unit: '倒推与假设', file: '还原问题.md', name: '还原', mark: '从结果倒回去', ink: '#be185d', paper: '#fce7f3', demo: ['桃子'] },
  { unit: '倒推与假设', file: '假设法.md', name: '鸡兔同笼', mark: '两种混在一起', ink: '#b45309', paper: '#fff6d8', demo: ['鸡兔'] },
  { unit: '倒推与假设', file: '盈亏问题.md', name: '盈亏', mark: '一多一少', ink: '#be123c', paper: '#ffe4e6', demo: [] },
  { unit: '数清楚', file: '植树问题.md', name: '植树', mark: '两头都算', ink: '#3d8a4a', paper: '#e8f6ee', demo: ['握手'] },
  { unit: '数清楚', file: '买赠问题.md', name: '买赠', mark: '送的也要喝', ink: '#b45309', paper: '#fff7ed', demo: ['买五'] },
  { unit: '数清楚', file: '过火车问题.md', name: '过火车', mark: '车头进车尾出', ink: '#9a3412', paper: '#ffedd5', demo: ['过桥'] },
  { unit: '数清楚', file: '周期问题.md', name: '周期', mark: '余 0 是最后一个', ink: '#1d4ed8', paper: '#dbeafe', demo: ['彩灯'] },
  { unit: '数清楚', file: '重叠问题.md', name: '重叠', mark: '多的数了两遍', ink: '#0369a1', paper: '#e0f2fe', demo: ['书法'] },
  { unit: '巧算', file: '巧算问题.md', name: '巧算', mark: '先找好朋友', ink: '#0f766e', paper: '#ccfbf1', demo: ['凑整'] },
  { unit: '图形', file: '数线段数角.md', name: '数线段、数角', mark: '长的也要数', ink: '#4338ca', paper: '#e0e7ff', demo: ['五个点'] },
  { unit: '推理', file: '简单推理.md', name: '图形推理', mark: '图形代表数', ink: '#0f766e', paper: '#e6f7f4', demo: ['图形', '三种'] },
  { unit: '推理', file: '逻辑推理.md', name: '逻辑推理', mark: '打勾就叉掉一列', ink: '#6d28d9', paper: '#ede9fe', demo: ['红黄蓝'] },
];

// GitBook 页面网址 = 分组 slug + 文件名的拼音。新建页面要在这里补一行拼音，漏了会直接报错。
const PAGE_SLUG = {
  'README.md': '',
  '拔高/奥数拔高.md': 'ao-shu-ba-gao',
  '认出母题.md': 'ren-chu-mu-ti',
  '大纲.md': 'da-gang',
  '单元/画线段图.md': 'hua-xian-duan-tu',
  '单元/画线段图系统课.md': 'hua-xian-duan-tu-xi-tong-ke',
  '单元/倒推与假设.md': 'dao-tui-yu-jia-she',
  '单元/数清楚.md': 'shu-qing-chu',
  '单元/巧算.md': 'qiao-suan',
  '单元/图形.md': 'tu-xing',
  '单元/推理.md': 'tui-li',
  '知识点/和差问题.md': 'he-cha-wen-ti',
  '知识点/和倍问题.md': 'he-bei-wen-ti',
  '知识点/差倍问题.md': 'cha-bei-wen-ti',
  '知识点/移多补少.md': 'yi-duo-bu-shao',
  '知识点/年龄问题.md': 'nian-ling-wen-ti',
  '知识点/还原问题.md': 'huan-yuan-wen-ti',
  '知识点/假设法.md': 'jia-she-fa',
  '知识点/盈亏问题.md': 'ying-kui-wen-ti',
  '知识点/植树问题.md': 'zhi-shu-wen-ti',
  '知识点/买赠问题.md': 'mai-zeng-wen-ti',
  '知识点/过火车问题.md': 'guo-huo-che-wen-ti',
  '知识点/周期问题.md': 'zhou-qi-wen-ti',
  '知识点/重叠问题.md': 'chong-die-wen-ti',
  '知识点/巧算问题.md': 'qiao-suan-wen-ti',
  '知识点/数线段数角.md': 'shu-xian-duan-shu-jiao',
  '知识点/简单推理.md': 'jian-dan-tui-li',
  '知识点/逻辑推理.md': 'luo-ji-tui-li',
  '题目/兄弟分糖.md': 'xiong-di-fen-tang',
  '题目/大衣裤子和鞋.md': 'da-yi-ku-zi-he-xie',
  '题目/甲乙两堆书.md': 'jia-yi-liang-dui-shu',
  '题目/倒油问题.md': 'dao-you-wen-ti',
  '题目/妈妈和小明.md': 'ma-ma-he-xiao-ming',
  '题目/一筐桃子.md': 'yi-kuang-tao-zi',
  '题目/鸡兔同笼.md': 'ji-tu-tong-long',
  '题目/分苹果.md': 'fen-ping-guo',
  '题目/联欢会握手.md': 'lian-huan-hui-wo-shou',
  '题目/买五送一.md': 'mai-wu-song-yi',
  '题目/过桥.md': 'guo-qiao',
  '题目/彩灯.md': 'cai-deng',
  '题目/书法和绘画.md': 'shu-fa-he-hui-hua',
  '题目/凑整.md': 'cou-zheng',
  '题目/五个点.md': 'wu-ge-dian',
  '题目/图形算式.md': 'tu-xing-suan-shi',
  '题目/三种图形.md': 'san-zhong-tu-xing',
  '题目/红黄蓝衣服.md': 'hong-huang-lan-yi-fu',
};

/** 读 SUMMARY.md，算出每个 docs 页面在 GitBook 上的网址 */
function bookUrls() {
  const groupSlug = Object.fromEntries([...UNITS, BAGAO].map((u) => [u.name, u.slug]));
  const slugOf = (file) => {
    if (file in PAGE_SLUG) return PAGE_SLUG[file];
    const lecture = file.match(/^拔高\/第(\d+)讲\.md$/);
    if (lecture) return `di-${lecture[1]}-jiang`;
    fail(`PAGE_SLUG 里缺 ${file} 的拼音`);
  };
  const urls = {};
  let group = null;
  for (const line of fs.readFileSync(path.join(ROOT, 'docs/SUMMARY.md'), 'utf8').split('\n')) {
    const g = line.match(/^##\s+(.+?)\s*$/);
    if (g) {
      group = g[1];
      if (!(group in groupSlug)) fail(`SUMMARY.md 的分组「${group}」不在 UNITS 里`);
      continue;
    }
    const item = line.match(/^\s*\*\s+\[[^\]]*\]\(([^)]+)\)/);
    if (!item) continue;
    const file = decodeURI(item[1]);
    const parts = [group && groupSlug[group], slugOf(file)].filter(Boolean);
    urls[file] = parts.length ? `${BOOK}/${parts.join('/')}` : BOOK;
  }
  return urls;
}

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

const readDir = (d) =>
  fs.existsSync(path.join(ROOT, d))
    ? fs.readdirSync(path.join(ROOT, d)).sort((a, b) => a.localeCompare(b, 'zh'))
    : [];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function mdTitle(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function mdMotto(text) {
  const m = text.match(/^>\s*\*\*(.+?)\*\*\s*$/m);
  return m ? m[1].trim() : '';
}

function mdProblem(text) {
  const block = text.split('\n').filter((l) => l.startsWith('> ') && !l.startsWith('> ```'));
  const line = block.map((l) => l.slice(2).trim()).find((l) => l.length > 6);
  if (!line) return '';
  return clip(line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`/g, ''), 42);
}

function linkedProblems(text) {
  const out = [];
  for (const m of text.matchAll(/\[([^\]]+)\]\(\.\.\/题目\/([^)]+\.md)\)/g)) {
    out.push({ title: m[1], file: m[2] });
  }
  return out;
}

const animations = readDir('demos')
  .filter((f) => f.endsWith('.html'))
  .map((f) => {
    const text = fs.readFileSync(path.join(ROOT, 'demos', f), 'utf8');
    const h1 = text.match(/<h1>([\s\S]*?)<\/h1>/);
    const desc = text.match(/<meta\s+name="description"\s+content="(.*?)"/);
    const mp4 = f.replace(/\.html$/, '.mp4');
    return {
      file: f,
      href: `demos/${encodeURI(f)}`,
      title: h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : f.replace(/\.html$/, ''),
      desc: desc ? desc[1] : '',
      mp4: fs.existsSync(path.join(ROOT, 'demos', mp4)) ? `demos/${encodeURI(mp4)}` : null,
    };
  });

const pageUrls = bookUrls();
const urlOf = (file) => pageUrls[file] || fail(`${file} 没挂进 docs/SUMMARY.md`);

const motifs = MOTIFS.map((cfg) => {
  const full = path.join(ROOT, 'docs/知识点', cfg.file);
  if (!fs.existsSync(full)) fail(`MOTIFS 里的 ${cfg.file} 找不到`);
  if (!UNITS.some((u) => u.name === cfg.unit)) fail(`${cfg.file} 的单元「${cfg.unit}」不在 UNITS 里`);
  const text = fs.readFileSync(full, 'utf8');
  const seen = new Set();
  const problems = linkedProblems(text)
    .filter((p) => (seen.has(p.file) ? false : seen.add(p.file)))
    .map((p) => {
      const pt = fs.readFileSync(path.join(ROOT, 'docs/题目', p.file), 'utf8');
      return {
        title: mdTitle(pt, p.title),
        href: urlOf(`题目/${p.file}`),
        desc: mdProblem(pt),
      };
    });
  const demos = animations.filter((a) => cfg.demo.some((k) => a.file.includes(k)));
  return {
    ...cfg,
    motto: mdMotto(text),
    href: urlOf(`知识点/${cfg.file}`),
    problems,
    demos,
  };
});

const units = UNITS.map((u) => ({
  ...u,
  href: urlOf(`单元/${u.name}.md`),
  courseHref: u.course ? urlOf(`单元/${u.course.file}`) : null,
  courseDemos: u.course ? animations.filter((a) => a.file.includes(u.course.demo)) : [],
  motifs: motifs.filter((m) => m.unit === u.name),
}));

// 拔高课表：从 home 页「| 第 N 讲 | 主题 | 主要内容 | 状态 |」读，写好的讲次第一格是链接
const lectures = fs
  .readFileSync(path.join(ROOT, 'docs', BAGAO.home), 'utf8')
  .split('\n')
  .map((l) => l.match(/^\|\s*\[?第 (\d+) 讲\]?(?:\(([^)]+)\))?\s*\|\s*([^|]+?)\s*\|/))
  .filter(Boolean)
  .map(([, n, link, topic]) => {
    const no = Number(n);
    if (!link) return { no, topic, done: false };
    const file = `拔高/${decodeURI(link)}`;
    if (!fs.existsSync(path.join(ROOT, 'docs', file))) fail(`${BAGAO.home} 课表链到的 ${file} 找不到`);
    const [ink, paper] = BAGAO_INK[(no - 1) % BAGAO_INK.length];
    return {
      no, topic, done: true, ink, paper,
      mark: `第 ${no} 讲`,
      name: topic,
      motto: mdMotto(fs.readFileSync(path.join(ROOT, 'docs', file), 'utf8')),
      href: urlOf(file),
      problems: [],
      demos: animations.filter((a) => a.file.startsWith(`拔高第${no}讲-`)),
    };
  });
const bagaoHref = urlOf(BAGAO.home);
const upcoming = lectures.filter((l) => !l.done);

// 「先看动画」按单元排：系统课的动画在前，母题按课序在后，拔高讲次最后；同一个动画只出现一次
const orderedAnimations = [
  ...new Set([
    ...units.flatMap((u) => [...u.courseDemos, ...u.motifs.flatMap((m) => m.demos)]),
    ...lectures.flatMap((l) => l.demos || []),
    ...animations,
  ]),
];

const bagaoSection = () => `
<section class="unit">
  <div class="unit-head">
    <span class="unit-no">拔高</span>
    <h3>${esc(BAGAO.name)}</h3>
    <span class="unit-pic">跟着学而思三年级秋季的课，一讲一个动画</span>
    <span class="unit-links"><a class="unit-go" href="${esc(bagaoHref)}">课表 →</a></span>
  </div>
  <div class="map">
    ${lectures.filter((l) => l.done).map(tile).join('\n')}
    ${upcoming.length ? `<div class="tile todo"><div class="tile-main"><div class="tile-mark">还没上</div><p class="motto">${upcoming.slice(0, 4).map((l) => `第 ${l.no} 讲 ${esc(l.topic)}`).join('、')}${upcoming.length > 4 ? `，一共还有 ${upcoming.length} 讲` : ''}</p></div></div>` : ''}
  </div>
</section>`;

const unitSection = (u) => `
<section class="unit">
  <div class="unit-head">
    <span class="unit-no">第${u.no}单元</span>
    <h3>${esc(u.name)}</h3>
    <span class="unit-pic">${esc(u.pic)}</span>
    <span class="unit-links">
      ${u.courseHref ? `<a class="unit-go" href="${esc(u.courseHref)}">系统课 →</a>` : ''}
      <a class="unit-go" href="${esc(u.href)}">单元导读 →</a>
    </span>
  </div>
  <div class="map">
    ${u.motifs.map(tile).join('\n')}
    ${u.todo.length ? `<div class="tile todo"><div class="tile-main"><div class="tile-mark">还在写</div><p class="motto">${u.todo.map(esc).join('、')}</p></div></div>` : ''}
  </div>
</section>`;

const tile = (m) => `
<article class="tile" style="--ink:${m.ink};--paper:${m.paper}">
  <a class="tile-main" href="${esc(m.href)}">
    <div class="tile-mark">${esc(m.mark)}</div>
    <h3>${esc(m.name)}</h3>
    <p class="motto">${esc(m.motto)}</p>
  </a>
  <div class="tile-foot">
    ${m.problems
      .map(
        (p) =>
          `<a class="chip" href="${esc(p.href)}">${esc(p.title)}</a>`
      )
      .join('')}
    ${m.demos
      .map(
        (d) =>
          `<a class="chip play" href="${esc(d.href)}">看动画</a>` +
          (d.mp4
            ? `<a class="chip quiet" href="${esc(d.mp4)}">mp4</a>`
            : '')
      )
      .join('')}
  </div>
</article>`;

const playCard = (a) => `
<a class="show" href="${esc(a.href)}">
  <span class="go">播放</span>
  <strong>${esc(a.title)}</strong>
  <span>${esc(a.desc)}</span>
</a>`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>浅奥母题地图</title>
<meta name="description" content="三年级浅奥六种母题。衣服可以换，骨头不能换。">
<!-- 这个文件由 tools/build-index.mjs 生成，不要手改。加了新内容就跑 npm run index -->
<link rel="icon" href="demos/assets/鸡.png">
<style>
  :root {
    --sky: #dbebff;
    --cream: #fff7e8;
    --paper: #fffdf8;
    --ink: #2a3340;
    --soft: #5c6b7a;
    --brand: #1f5f9e;
    --accent: #e0662c;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
    color: var(--ink);
    background:
      radial-gradient(900px 420px at 12% -10%, #ffe8b0 0%, transparent 60%),
      radial-gradient(800px 380px at 100% 0%, #cfe4ff 0%, transparent 55%),
      linear-gradient(180deg, var(--cream) 0%, var(--sky) 70%, #e4f0ff 100%);
    min-height: 100vh;
  }
  .page { max-width: 1080px; margin: 0 auto; padding: 36px 22px 72px; }

  .hero {
    display: flex;
    align-items: center;
    gap: 28px;
    background: var(--paper);
    border-radius: 28px;
    padding: 32px 36px;
    box-shadow: 0 18px 40px #1f4a7a14, 0 2px 0 #fff inset;
    margin-bottom: 28px;
  }
  .hero-copy { flex: 1; min-width: 0; }
  .cast {
    flex: 0 0 200px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    gap: 4px;
  }
  .cast img { width: 96px; height: auto; background: none; }
  .eyebrow {
    display: inline-block;
    font-size: 13px; font-weight: 800; letter-spacing: .12em;
    color: var(--accent);
    background: #ffe8d4;
    border-radius: 999px;
    padding: 4px 12px;
    margin-bottom: 12px;
  }
  h1 { font-size: 40px; line-height: 1.2; color: var(--brand); letter-spacing: .02em; }
  .lead { margin-top: 12px; font-size: 18px; line-height: 1.75; color: var(--soft); max-width: 34em; }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
  .btn {
    display: inline-flex; align-items: center;
    height: 42px; padding: 0 18px;
    border-radius: 999px;
    font-size: 15px; font-weight: 800;
    text-decoration: none;
  }
  .btn.primary { background: var(--accent); color: #fff; }
  .btn.ghost { background: #eef5ff; color: var(--brand); }

  .sec { margin: 34px 0 12px; display: flex; align-items: baseline; gap: 12px; }
  .sec h2 { font-size: 22px; color: var(--brand); }
  .sec p { font-size: 14px; color: var(--soft); }

  .shows { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .show {
    display: grid; gap: 8px;
    background: #fff;
    border-radius: 22px;
    padding: 22px 24px 20px;
    text-decoration: none; color: inherit;
    box-shadow: 0 10px 28px #1f4a7a12;
    border: 1px solid #ffffffaa;
    transition: transform .15s, box-shadow .15s;
  }
  .show:hover { transform: translateY(-3px); box-shadow: 0 16px 34px #1f4a7a18; }
  .show .go {
    width: max-content;
    background: var(--accent); color: #fff;
    font-size: 12px; font-weight: 800; letter-spacing: .08em;
    border-radius: 999px; padding: 3px 10px;
  }
  .show strong { font-size: 20px; color: var(--brand); }
  .show span { font-size: 14px; line-height: 1.65; color: var(--soft); }

  .map {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .tile {
    background: var(--paper);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 12px 28px #1f4a7a10;
    display: flex; flex-direction: column;
    min-height: 250px;
    outline: 3px solid transparent;
    transition: transform .15s, outline-color .15s;
  }
  .tile:hover { transform: translateY(-3px); outline-color: var(--ink); }
  .tile-main {
    flex: 1;
    display: block;
    padding: 22px 22px 12px;
    text-decoration: none;
    color: inherit;
    background: linear-gradient(180deg, var(--paper) 40%, var(--paper));
  }
  .tile-mark {
    font-size: 12px; font-weight: 800; letter-spacing: .08em;
    color: var(--ink);
    background: var(--paper);
    border: 1.5px solid color-mix(in srgb, var(--ink) 28%, white);
    display: inline-block;
    border-radius: 999px;
    padding: 3px 10px;
    margin-bottom: 12px;
  }
  .tile h3 { font-size: 28px; color: var(--ink); margin-bottom: 10px; }
  .motto {
    font-size: 16px; line-height: 1.65; font-weight: 700;
    color: #3a4654;
  }
  .tile-foot {
    display: flex; flex-wrap: wrap; gap: 8px;
    padding: 0 18px 18px;
  }
  .chip {
    font-size: 13px; font-weight: 800;
    text-decoration: none;
    color: var(--ink);
    background: var(--paper);
    border: 1.5px solid color-mix(in srgb, var(--ink) 22%, white);
    border-radius: 999px;
    padding: 5px 11px;
  }
  .chip.play { background: var(--ink); color: #fff; border-color: var(--ink); }
  .chip.quiet { color: #6b7784; }

  .unit { margin-bottom: 30px; }
  .unit-head {
    display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 14px;
    text-decoration: none; color: inherit;
    padding: 0 4px 12px;
  }
  .unit-no {
    font-size: 13px; font-weight: 800; letter-spacing: .08em;
    color: #fff; background: var(--brand);
    border-radius: 999px; padding: 3px 11px;
  }
  .unit-head h3 { font-size: 24px; color: var(--brand); }
  .unit-pic { font-size: 15px; color: var(--soft); }
  .unit-links { margin-left: auto; display: flex; gap: 16px; }
  .unit-go { font-size: 14px; font-weight: 800; color: var(--accent); text-decoration: none; }
  .unit-go:hover { text-decoration: underline; }
  .tile.todo {
    --ink: #8a96a3; --paper: #f3f5f7;
    min-height: 0;
    border: 2px dashed #cfd6dd;
    box-shadow: none;
  }
  .tile.todo:hover { transform: none; outline-color: transparent; }
  .tile.todo .motto { color: #7d8b98; }

  .how {
    margin-top: 36px;
    background: #fff8ec;
    border-radius: 22px;
    padding: 22px 26px;
    color: #6b5335;
    font-size: 15px; line-height: 1.9;
  }
  .how b { color: #c0662c; }
  footer {
    text-align: center; margin-top: 28px;
    font-size: 13px; color: #7d8b98;
  }
  footer a { color: var(--brand); }

  @media (max-width: 880px) {
    .map, .shows { grid-template-columns: 1fr 1fr; }
    h1 { font-size: 32px; }
    .cast { flex-basis: 160px; }
    .cast img { width: 80px; }
  }
  @media (max-width: 560px) {
    .map, .shows { grid-template-columns: 1fr; }
    .hero { padding: 28px 22px; flex-direction: column; align-items: flex-start; }
    .cast { display: none; }
  }
</style>
</head>
<body>
<div class="page">

  <header class="hero">
    <div class="hero-copy">
      <div class="eyebrow">三年级 · 浅奥</div>
      <h1>母题地图</h1>
      <p class="lead">看起来题很多，骨架只有这几种。<b>衣服可以换，骨头不能换。</b>先认出是哪一类，再看动画，再动笔。</p>
      <div class="actions">
        <a class="btn primary" href="${urlOf('认出母题.md')}">我这道题是哪一类？</a>
        <a class="btn ghost" href="${urlOf('大纲.md')}">三年级还有哪些</a>
        <a class="btn ghost" href="${esc(bagaoHref)}">奥数拔高 · 跟着学而思</a>
      </div>
    </div>
    <div class="cast" aria-hidden="true">
      <img src="demos/assets/鸡.png" alt="">
      <img src="demos/assets/兔.png" alt="">
    </div>
  </header>

  <div class="sec">
    <h2>先看动画</h2>
    <p>卡住多半不是不会算，是脑子里没有画面。</p>
  </div>
  <div class="shows">
    ${orderedAnimations.map(playCard).join('\n')}
  </div>

  <div class="sec">
    <h2>六个单元，按顺序学</h2>
    <p>每个单元是一种画法。点单元名看这一单元怎么学，点卡片看母题，点小标签看例题或动画。</p>
  </div>
  ${units.map(unitSection).join('\n')}

  <div class="sec">
    <h2>往上走一格</h2>
    <p>母题学完，跟着学而思的课拔高。上完一讲，回家看这一讲的动画。</p>
  </div>
  ${bagaoSection()}


  <div class="how">
    <b>怎么陪孩子用：</b>让他先猜这是哪道母题 → 有动画就看一遍 → 把口诀念出来 → 合上页面自己写算式 → 再换一身衣服讲给你听。
  </div>

  <footer>
    讲解在 <a href="${BOOK}">GitBook</a>，动画在这一页。加新课之后跑 <code>npm run index</code>。
  </footer>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(`✓ 母题地图已生成：${units.length} 个单元、${motifs.length} 道母题、${animations.length} 个动画`);
