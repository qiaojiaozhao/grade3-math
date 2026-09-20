# 三年级奥数 · 看得懂的知识站

这里沉淀孩子学过的奥数知识点。每个知识点都配一句能记住的口诀和一张图；每道例题都尽量配一个**可以点着看的动画**，让孩子先看明白，再动笔算。

## 怎么用

给孩子讲一道题时，建议按这个顺序：

1. 先读**例题**页的题面，让孩子自己想一分钟。
2. 点开页面里的**互动动画**，点「自动播放」，看一遍。
3. 回到**知识点**页，把这道题用到的口诀念一遍。
4. 合上页面，让孩子自己把算式写一遍，再用页面末尾的验算对答案。

关键是第 2 步：孩子卡住，多半不是不会算，而是脑子里没有画面。

## 已经覆盖的知识点

| 知识点 | 一句话口诀 | 配套例题 |
| --- | --- | --- |
| [移多补少](知识点/移多补少.md) | 倒过去 1 份，差距缩小 2 份 | [倒油问题](题目/倒油问题.md) |
| [差倍问题](知识点/差倍问题.md) | 差 ÷ (倍数 − 1) = 1 份 | [倒油问题](题目/倒油问题.md) |
| [简单推理](知识点/简单推理.md) | 两个算式摆一起，划掉一样多的 | [图形算式](题目/图形算式.md) |

## 互动动画

动画是独立的网页，在线打开或本地双击都行：

- 倒油问题：看油流过去 —— [在线打开](https://qiaojiaozhao.github.io/grade3-math/demos/%E5%80%92%E6%B2%B9%E9%97%AE%E9%A2%98-%E7%A7%BB%E5%A4%9A%E8%A1%A5%E5%B0%91%E4%B8%8E%E5%B7%AE%E5%80%8D.html) ｜ [本地文件](demos/倒油问题-移多补少与差倍.html)

每个动画还录了一份 mp4，方便直接发微信或投屏，文件和网页放在一起（`demos/*.mp4`）。

---

## 想再加一课

把题目、讲义照片或知识点名丢给 AI，让它照着 [AGENTS.md](AGENTS.md) 做。那份手册规定了固定流程：
找卡点 → 写知识点页 → 写例题页 → 做动画 → 质检 → 录视频 → 更新目录 → 推送。

自己动手写也可以，从 `模板/` 复制：

| 要加什么 | 从哪复制 | 放到哪 |
| --- | --- | --- |
| 知识点 | `模板/知识点模板.md` | `知识点/<名字>.md` |
| 例题 | `模板/例题模板.md` | `题目/<名字>.md` |
| 动画 | `模板/动画模板.html` | `demos/<例题名>-<知识点>.html` |

### 目录结构

```
知识点/          一个知识点一页
题目/            一道例题一页
demos/           互动动画 + 配套 mp4
  lib/           动画引擎：anim.css/js 是外壳和分幕调度，bars.css/js 是条形对比组件
模板/            新建页面从这里复制
tools/           命令脚本
index.html       GitHub Pages 落地页，由 npm run index 生成，别手改
SUMMARY.md       GitBook 目录，手写
AGENTS.md        给 AI 的操作手册
```

动画不用从零写。`demos/lib/` 里的引擎管掉了分幕、播放按钮、旁白气泡、补间动画，
新动画只写这道题特有的画面和台词。和差倍、平均数、盈亏这类题还能直接用现成的条形组件。

### 命令

新机器先跑一次 `npm run setup`（装依赖和 Chromium）。录视频还需要 `ffmpeg`，没有就 `brew install ffmpeg`。

| 命令 | 做什么 |
| --- | --- |
| `npm run shoot -- demos/x.html` | 逐幕截图质检：查超框、查旁白挡字、查报错 |
| `npm run record -- demos/x.html` | 录成 mp4，存在 html 旁边 |
| `npm run index` | 重新生成首页 `index.html` |
| `npm run check` | 查所有内部链接有没有断 |
| `npm run pdf -- 讲义.pdf` | 扫描版讲义转成图片 |

---

## 发布

同一套内容，两条发布线，都已上线：

| | 地址 | 负责什么 |
| --- | --- | --- |
| **GitBook** | <https://zhaos-organization-4.gitbook.io/san-nian-ji-ao-shu-kan-de-dong-de-zhi-shi-zhan/> | 知识站本身：目录、讲解、搜索 |
| **GitHub Pages** | <https://qiaojiaozhao.github.io/grade3-math/> | 跑 `demos/` 里的互动动画 |

之所以分两条线：GitBook 页面里不能直接运行仓库中的 HTML，动画必须另外托管，GitBook 的例题页通过链接指过去。

推到 `main` 之后 GitHub Pages 会自动更新。仓库里放了 `.nojekyll`，GitHub 不会拿 Jekyll 去处理这些文件，HTML 会原样提供。

### GitBook 还没接上 Git Sync

现在 GitBook 上的页面是早先用 API 单独写上去的，和仓库里的 Markdown 是两份，得手工对齐。接上 Git Sync 之后就只维护仓库这一份。

> **初次同步的方向别选反。** 两边内容各有各的新：GitBook 上用了步骤器、提示框这些富排版；
> 仓库里则多了「简单推理」和「图形算式」两页，GitBook 上还没有。
> 所以要先选 **GitBook → GitHub** 把线上内容拉进 `docs/`，人工合并完再切成 GitHub → GitBook。
> 一上来就选 GitHub → GitBook，会用仓库里的版本盖掉线上的富排版，页面地址也会跟着变。

1. 打开 [GitBook 站点后台](https://app.gitbook.com/o/1LnHUumneylpRhnARYHW/sites/site_rh5ao)，左侧点 **Git Sync**。
2. **Connect GitHub**，授权 GitBook 访问你的 GitHub 账号。如果列表里找不到仓库，去 GitBook 的 GitHub App 设置里把该仓库加进可访问范围。
3. **Source repository** 选 `qiaojiaozhao/grade3-math`，分支选 `main`。
4. **初次同步方向**保持 **GitBook → GitHub**。界面上的 *Swap direction* 是反向，这一步别点。
5. **Content mapping** 里把空间映射到 `/docs`，不要映射仓库根目录——根目录留给 GitHub Pages 的 `index.html`、`demos/`、`.nojekyll`，两边互不干扰。
6. 点 **Sync**。同步完成后仓库里会多出 `docs/` 目录，里面是 GitBook 导出的规范 Markdown。
7. 把 `知识点/` 和 `题目/` 里比线上新的内容合进 `docs/`，确认无误后再在 GitBook 里切换成 GitHub → GitBook，从此以仓库为准。

第 7 步做完之前，`知识点/`、`题目/`、`SUMMARY.md` 还是主稿，别删。
