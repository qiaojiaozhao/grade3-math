#!/usr/bin/env node
/* 扫描仓库，重新生成 GitHub Pages 的落地页 index.html。
 * 用法: npm run index
 *
 * 落地页是「母题地图」：六张大卡片，口诀和动画挂在对应母题下面。
 * 讲解页链到 GitBook（.md 在 Pages 上会变成下载），动画留在本站。
 *
 * 标题和摘要仍然从文件里读：
 *   - demos/*.html       标题取 <h1>，摘要取 <meta name="description">
 *   - docs/知识点/*.md    口诀取「一句话口诀」那条引用
 *   - docs/题目/*.md      摘要取题面第一句
 * 新母题要在下面 MOTIFS 里加一行，才会出现在地图上。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = 'https://smileyes.gitbook.io/smileyes-docs';

const MOTIFS = [
  {
    file: '和差问题.md',
    name: '和差',
    slug: 'zhi-shi-dian/he-cha-wen-ti',
    mark: '和 + 差',
    ink: '#2f7a5b',
    paper: '#e8f6ee',
    demo: [],
  },
  {
    file: '和倍问题.md',
    name: '和倍',
    slug: 'zhi-shi-dian/he-bei-wen-ti',
    mark: '和 + 倍',
    ink: '#2c6fb3',
    paper: '#e7f1fb',
    demo: [],
  },
  {
    file: '差倍问题.md',
    name: '差倍',
    slug: 'zhi-shi-dian/cha-bei-wen-ti',
    mark: '差 + 倍',
    ink: '#c05621',
    paper: '#fff1e4',
    demo: ['倒油'],
  },
  {
    file: '移多补少.md',
    name: '移多补少',
    slug: 'zhi-shi-dian/yi-duo-bu-shao',
    mark: '倒过去就相等',
    ink: '#8a4ec7',
    paper: '#f3eaff',
    demo: ['倒油'],
  },
  {
    file: '假设法.md',
    name: '鸡兔同笼',
    slug: 'zhi-shi-dian/jia-she-fa',
    mark: '两种混在一起',
    ink: '#b45309',
    paper: '#fff6d8',
    demo: ['鸡兔'],
  },
  {
    file: '简单推理.md',
    name: '图形推理',
    slug: 'zhi-shi-dian/jian-dan-tui-li',
    mark: '图形代表数',
    ink: '#0f766e',
    paper: '#e6f7f4',
    demo: [],
  },
];

const PROBLEM_SLUG = {
  '倒油问题.md': 'li-ti/dao-you-wen-ti',
  '兄弟分糖.md': 'li-ti/xiong-di-fen-tang',
  '甲乙两堆书.md': 'li-ti/jia-yi-liang-dui-shu',
  '图形算式.md': 'li-ti/tu-xing-suan-shi',
  '鸡兔同笼.md': 'li-ti/ji-tu-tong-long',
};

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

const motifs = MOTIFS.map((cfg) => {
  const full = path.join(ROOT, 'docs/知识点', cfg.file);
  if (!fs.existsSync(full)) {
    console.error(`✗ MOTIFS 里的 ${cfg.file} 找不到`);
    process.exit(1);
  }
  const text = fs.readFileSync(full, 'utf8');
  const seen = new Set();
  const problems = linkedProblems(text)
    .filter((p) => (seen.has(p.file) ? false : seen.add(p.file)))
    .map((p) => {
      const pt = fs.readFileSync(path.join(ROOT, 'docs/题目', p.file), 'utf8');
      return {
        title: mdTitle(pt, p.title),
        href: PROBLEM_SLUG[p.file] ? `${BOOK}/${PROBLEM_SLUG[p.file]}` : `${BOOK}`,
        desc: mdProblem(pt),
      };
    });
  const demos = animations.filter((a) => cfg.demo.some((k) => a.file.includes(k)));
  return {
    ...cfg,
    motto: mdMotto(text),
    href: `${BOOK}/${cfg.slug}`,
    problems,
    demos,
  };
});

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
        <a class="btn primary" href="${BOOK}/ren-chu-mu-ti">我这道题是哪一类？</a>
        <a class="btn ghost" href="${BOOK}">打开完整讲解</a>
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
    ${animations.map(playCard).join('\n')}
  </div>

  <div class="sec">
    <h2>六种母题</h2>
    <p>点卡片看骨架，点下面的小标签看例题或动画。</p>
  </div>
  <div class="map">
    ${motifs.map(tile).join('\n')}
  </div>

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
console.log(`✓ 母题地图已生成：${motifs.length} 道母题、${animations.length} 个动画`);
