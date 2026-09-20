# 三年级奥数 · 看得懂的知识站

这里沉淀孩子学过的奥数知识点。每个知识点都配一句能记住的口诀和一张图；每道例题都配一个**可以点着看的动画**，让孩子先看明白，再动笔算。

## 怎么用

给孩子讲一道题时，建议按这个顺序：

1. 先读**例题**页的题面，让孩子自己想一分钟。
2. 点开页面里的**互动动画**，点「自动播放」，看油怎么倒过去。
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

每个动画还录了一份 47 秒的 mp4，方便直接发微信或投屏，文件和网页放在一起（`demos/*.mp4`）。

---

## 发布：怎么把它变成网站

同一套内容，两条发布线，都已上线：

| | 地址 | 负责什么 |
| --- | --- | --- |
| **GitBook** | <https://zhaos-organization-4.gitbook.io/san-nian-ji-ao-shu-kan-de-dong-de-zhi-shi-zhan/> | 知识站本身：目录、讲解、搜索 |
| **GitHub Pages** | <https://qiaojiaozhao.github.io/grade3-math/> | 跑 `demos/` 里的互动动画 |

之所以分两条线：GitBook 页面里不能直接运行仓库中的 HTML，动画必须另外托管，GitBook 的例题页通过链接指过去。

仓库里放了 `.nojekyll`，GitHub 不会拿 Jekyll 去处理这些文件，HTML 会原样提供。Pages 的来源是 `main` 分支根目录。

还剩最后一步，做完就变成「改仓库 → 自动同步到网站」。

### 接上 Git Sync

> **方向别选反。** 现在 GitBook 上的内容比仓库里的 Markdown 更新、更完整（用了步骤器、提示框、卡片），而且线上页面地址已经定下来了。所以初次同步要选 **GitBook → GitHub**，让 GitBook 把内容写进仓库。选反了会用仓库里的旧稿覆盖线上内容，页面地址也会跟着变。

1. 打开 [GitBook 站点后台](https://app.gitbook.com/o/1LnHUumneylpRhnARYHW/sites/site_rh5ao)，左侧点 **Git Sync**。
2. **Connect GitHub**，授权 GitBook 访问你的 GitHub 账号。如果列表里找不到仓库，去 GitBook 的 GitHub App 设置里把该仓库加进可访问范围。
3. **Source repository** 选 `qiaojiaozhao/grade3-math`，分支选 `main`。
4. **初次同步方向**保持 **GitBook → GitHub**。界面上的 *Swap direction* 是反向，别点。
5. **Content mapping** 里把空间映射到 `/docs`，不要映射仓库根目录——根目录留给 GitHub Pages 的 `index.html`、`demos/`、`.nojekyll`，两边互不干扰。
6. 点 **Sync**。同步完成后仓库里会多出 `docs/` 目录，里面是 GitBook 导出的规范 Markdown。

同步之后就是双向的：在 GitBook 里合并一个 change request 会自动提交到 GitHub；往 GitHub 推提交也会自动同步回 GitBook。

`docs/` 出现之后，根目录下现在这几个早期草稿就没用了，可以删掉，避免同一份内容有两处：`知识点/`、`题目/`、`模板/`、`SUMMARY.md`。`.gitbook.yaml` 也可以删——Git Sync 会在 `docs/` 下自己生成配置。

## 想再加一课

接上 Git Sync 之后，两种改法都行，改完都会自动同步：

- **在 GitBook 网页上写**：新建页面，写完合并 change request。
- **在本地写**：在 `docs/` 下加 Markdown，提交推送。动画（如果有）放进根目录的 `demos/`，在文里用 `https://qiaojiaozhao.github.io/grade3-math/demos/<文件名>` 链过去。
