#!/usr/bin/env node
/* 检查仓库里所有 Markdown 的内部链接是否指向真实文件。
 * 用法: npm run check
 *
 * 方括号占位（比如 ../知识点/[知识点A].md）是模板里的填空，会跳过。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

let checked = 0;
let broken = 0;

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g)) {
    const link = m[1];
    if (/^https?:\/\//.test(link)) continue;
    if (/[[【]/.test(link)) continue; // 模板里的填空占位，不是真链接
    checked++;
    const target = path.resolve(path.dirname(file), link);
    if (!fs.existsSync(target)) {
      broken++;
      console.error(`  ✗ ${rel} -> ${link}`);
    }
  }
}

// HTML 里引用的本地资源也顺带查一下，漏了会导致动画白屏
for (const dir of ['demos', '模板']) {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) continue;
  for (const name of fs.readdirSync(d)) {
    if (!name.endsWith('.html')) continue;
    const file = path.join(d, name);
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(?:src|href)="((?!https?:|#|data:)[^"]+)"/g)) {
      checked++;
      const raw = m[1].split(/[?#]/)[0];
      const target = path.resolve(path.dirname(file), raw);
      if (!fs.existsSync(target)) {
        broken++;
        console.error(`  ✗ ${path.relative(ROOT, file)} -> ${m[1]}`);
      }
    }
  }
}

if (broken === 0) {
  console.log(`✓ ${checked} 条链接全部有效`);
} else {
  console.error(`\n✗ ${checked} 条链接中有 ${broken} 条断链`);
  process.exit(1);
}
