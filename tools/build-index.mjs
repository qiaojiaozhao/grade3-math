#!/usr/bin/env node
/* 扫描仓库，重新生成 GitHub Pages 的落地页 index.html。
 * 用法: npm run index
 *
 * 标题和摘要直接从文件里读，不用另外维护清单：
 *   - demos/*.html       标题取 <h1>，摘要取 <meta name="description">
 *   - docs/知识点/*.md    标题取 # 一级标题，摘要取「一句话口诀」那条引用
 *   - docs/题目/*.md      标题取 # 一级标题，摘要取题面第一句
 * 想自己写摘要，在文件顶部加一行 <!-- 摘要: ... --> 就会优先用它。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readDir = (d) =>
  fs.existsSync(path.join(ROOT, d))
    ? fs.readdirSync(path.join(ROOT, d)).sort((a, b) => a.localeCompare(b, 'zh'))
    : [];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function explicitSummary(text) {
  const m = text.match(/<!--\s*摘要:\s*(.+?)\s*-->/);
  return m ? m[1] : null;
}

function mdTitle(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

/** 知识点页的摘要就是口诀：`> **倒过去 1 份，差距缩小 2 份。**` */
function mdMotto(text) {
  const m = text.match(/^>\s*\*\*(.+?)\*\*\s*$/m);
  return m ? m[1].trim() : null;
}

/** 例题页的摘要取题面第一句，去掉 Markdown 记号 */
function mdProblem(text) {
  const block = text.split('\n').filter((l) => l.startsWith('> ') && !l.startsWith('> ```'));
  const line = block.map((l) => l.slice(2).trim()).find((l) => l.length > 6);
  if (!line) return null;
  return clip(line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`/g, ''), 70);
}

const animations = readDir('demos')
  .filter((f) => f.endsWith('.html'))
  .map((f) => {
    const text = fs.readFileSync(path.join(ROOT, 'demos', f), 'utf8');
    const h1 = text.match(/<h1>([\s\S]*?)<\/h1>/);
    const desc = text.match(/<meta\s+name="description"\s+content="(.*?)"/);
    const mp4 = f.replace(/\.html$/, '.mp4');
    return {
      href: `demos/${f}`,
      title: h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : f.replace(/\.html$/, ''),
      desc: desc ? desc[1] : '',
      mp4: fs.existsSync(path.join(ROOT, 'demos', mp4)) ? `demos/${mp4}` : null,
    };
  });

const collect = (dir, summarize) =>
  readDir(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
      return {
        href: `${dir}/${f}`,
        title: mdTitle(text, f.replace(/\.md$/, '')),
        desc: explicitSummary(text) || summarize(text) || '',
      };
    });

const points = collect('docs/知识点', mdMotto);
const problems = collect('docs/题目', mdProblem);

const card = (it, cls = '') =>
  `  <a class="card${cls}" href="${esc(it.href)}">
    <div class="t">${esc(it.title)}</div>
    <div class="d">${esc(it.desc)}</div>${
      it.mp4 ? `\n    <div class="m">也可以<span data-mp4="${esc(it.mp4)}">下载 mp4</span>直接发微信</div>` : ''
    }
  </a>`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>三年级奥数 · 看得懂的知识站</title>
<!-- 这个文件由 tools/build-index.mjs 生成，不要手改。加了新内容就跑 npm run index -->
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: radial-gradient(ellipse at top, #fff6e0 0%, #e7f3ff 55%, #d7ebff 100%);
    min-height: 100vh;
    color: #2b3a46;
    padding: 40px 20px 60px;
  }
  .wrap { max-width: 760px; margin: 0 auto; }
  header { text-align: center; margin-bottom: 32px; }
  h1 { font-size: 30px; color: #1f5f9e; margin-bottom: 10px; }
  .sub { font-size: 16px; color: #5b6b7a; line-height: 1.7; }

  h2 {
    font-size: 19px;
    color: #1f5f9e;
    margin: 32px 0 14px;
    padding-left: 12px;
    border-left: 5px solid #e0662c;
  }

  .card {
    display: block;
    background: #fff;
    border-radius: 16px;
    padding: 18px 22px;
    margin-bottom: 14px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 14px rgba(40,70,110,.10);
    transition: transform .15s, box-shadow .15s;
  }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(40,70,110,.16);
  }
  .card .t { font-size: 19px; font-weight: 800; color: #1f5f9e; margin-bottom: 6px; }
  .card .d { font-size: 15px; line-height: 1.7; color: #55636f; }
  .card .m { font-size: 13px; color: #8798a6; margin-top: 8px; }
  .card .m span { color: #e0662c; font-weight: 700; text-decoration: underline; }
  .card.play { border-left: 6px solid #e0662c; }
  .card.play .t::before { content: "▶ "; color: #e0662c; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid .card { margin-bottom: 0; }
  @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }

  .tip {
    background: #fff8ec;
    border-radius: 14px;
    padding: 16px 22px;
    font-size: 15px;
    line-height: 1.9;
    color: #6b5335;
    margin-top: 28px;
  }
  .tip b { color: #c0662c; }
  footer { text-align: center; margin-top: 36px; font-size: 13px; color: #8798a6; }
</style>
</head>
<body>
<div class="wrap">

  <header>
    <h1>三年级奥数 · 看得懂的知识站</h1>
    <p class="sub">浅奥六种母题，衣服可以换，骨头不能换。<br>先认出是哪一类，再看动画，再动笔算。</p>
  </header>

  <h2>互动动画</h2>
${animations.map((a) => card(a, ' play')).join('\n')}

  <h2>母题</h2>
  <div class="grid">
${points.map((p) => card(p)).join('\n')}
  </div>

  <h2>例题</h2>
${problems.map((p) => card(p)).join('\n')}

  <div class="tip">
    <b>怎么陪孩子用：</b>先让他猜这是哪道母题 → 点开动画看一遍 → 念一遍口诀 → 合上页面自己写算式 → 再换一身衣服讲给你听。<br>
    孩子卡住，多半不是不会算，而是脑子里<b>没有画面</b>。
  </div>

  <footer>完整母题地图在 GitBook 上：认出题 → 看骨架 → 换一身衣服。</footer>

</div>

<script>
// GitHub Pages 会把 .md 当文件下载，所以在 github.io 上把这些链接改指到
// 仓库的 Markdown 渲染页。本地直接双击打开时保持相对路径不动。
(function () {
  const host = location.hostname;
  if (!host.endsWith('.github.io')) return;

  const user = host.replace('.github.io', '');
  // 项目站点是 /<仓库名>/...，用户主站点（user.github.io）的仓库名就是域名本身
  const repo = location.pathname.split('/').filter(Boolean)[0] || host;

  const base = 'https://github.com/' + user + '/' + repo + '/blob/main/';
  document.querySelectorAll('a[href$=".md"]').forEach(function (a) {
    a.href = base + a.getAttribute('href');
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();

// 「下载 mp4」不能用嵌套的 <a>，所以做成点击拦截
document.querySelectorAll('[data-mp4]').forEach(function (el) {
  el.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    window.open(el.getAttribute('data-mp4'), '_blank');
  });
});
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(
  `✓ index.html 已生成：${animations.length} 个动画、${points.length} 道母题、${problems.length} 道例题`
);
