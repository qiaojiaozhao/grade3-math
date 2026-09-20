# 三年级奥数 · 看得懂的知识站

每个知识点配一句能记住的口诀，每道例题尽量配一个可以点着看的动画。孩子卡住，多半不是不会算，而是脑子里没有画面。

给孩子看的内容在 [docs/](docs/README.md)，这份 README 是写给维护这个仓库的人的。

## 想再加一课

把题目、讲义照片或知识点名丢给 AI，让它照着 [AGENTS.md](AGENTS.md) 做。那份手册规定了固定流程：
找卡点 → 写知识点页 → 写例题页 → 做动画 → 质检 → 录视频 → 更新目录 → 推送。

自己动手写也可以，从 `模板/` 复制：

| 要加什么 | 从哪复制 | 放到哪 |
| --- | --- | --- |
| 知识点 | `模板/知识点模板.md` | `docs/知识点/<名字>.md` |
| 例题 | `模板/例题模板.md` | `docs/题目/<名字>.md` |
| 动画 | `模板/动画模板.html` | `demos/<例题名>-<知识点>.html` |

写完把新页面加进 `docs/SUMMARY.md`，再跑一次 `npm run index` 和 `npm run check`。

## 目录结构

```
docs/            GitBook 站点的内容，也只有这个目录会同步到 GitBook
  README.md      站点首页，写给家长和孩子
  SUMMARY.md     站点目录，手写
  .gitbook.yaml  告诉 GitBook 首页和目录是哪两个文件
  知识点/         一个知识点一页
  题目/           一道例题一页
demos/           互动动画 + 配套 mp4
  lib/           动画引擎：anim.css/js 是外壳和分幕调度，bars.css/js 是条形对比组件
模板/            新建页面从这里复制
tools/           命令脚本
gitbook-docs.yaml  GitBook 站点级 Git Sync 的结构文件，把 docs/ 映射成站点
index.html       GitHub Pages 落地页，由 npm run index 生成，别手改
AGENTS.md        给 AI 的操作手册
```

**为什么内容要单独放在 `docs/`：** Git Sync 是双向的，GitBook 会重写被同步目录里的
Markdown。只映射 `docs/`，根目录的 README、AGENTS.md、`模板/` 就不会被当成站点页面抓进去，
也不会被 GitBook 改写。

动画不用从零写。`demos/lib/` 里的引擎管掉了分幕、播放按钮、旁白气泡、补间动画，
新动画只写这道题特有的画面和台词。和差倍、平均数、盈亏这类题还能直接用现成的条形组件。

## 命令

新机器先跑一次 `npm run setup`（装依赖和 Chromium）。录视频还需要 `ffmpeg`，没有就 `brew install ffmpeg`。

| 命令 | 做什么 |
| --- | --- |
| `npm run shoot -- demos/x.html` | 逐幕截图质检：查超框、查旁白挡字、查报错 |
| `npm run record -- demos/x.html` | 录成 mp4，存在 html 旁边 |
| `npm run index` | 重新生成首页 `index.html` |
| `npm run check` | 查所有内部链接有没有断 |
| `npm run pdf -- 讲义.pdf` | 扫描版讲义转成图片 |

## 发布

同一套内容，两条发布线：

| | 负责什么 | 地址 |
| --- | --- | --- |
| **GitHub Pages** | 跑 `demos/` 里的互动动画 | <https://qiaojiaozhao.github.io/grade3-math/> |
| **GitBook** | 知识站本身：目录、讲解、搜索 | <https://smileyes.gitbook.io/smileyes-docs> |

之所以分两条线：GitBook 页面里不能直接运行仓库中的 HTML，动画必须另外托管，
所以 `docs/` 里的例题页用绝对地址链到 GitHub Pages 上的动画。

推到 `main` 之后 GitHub Pages 会自动更新。仓库里放了 `.nojekyll`，GitHub 不会拿 Jekyll
去处理这些文件，HTML 会原样提供。

### GitBook Git Sync

**仓库是唯一的源**，方向是 GitHub → GitBook：改仓库、推送，站点自动更新。不要在 GitBook
网页上直接改内容，那会和仓库打架。

在站点后台左侧点 **Git Sync**，配置是：

| 栏位 | 填什么 |
| --- | --- |
| Source repository | `qiaojiaozhao/grade3-math`，分支 `main` |
| Initial sync direction | **GitHub → GitBook**（小字是 *Content in GitHub will replace content in GitBook*） |
| Project directory | 留空，或填 `/` |
| Content mapping | 由仓库根目录的 `gitbook-docs.yaml` 决定，不用手填 |

方向这一栏要看清楚小字再点，别只看 **Swap direction** 这个按钮名——它只是「反过来」的意思，
具体当前是哪个方向，以那行小字为准。反了会用 GitBook 的内容覆盖仓库。

### 哪些东西不归仓库管

站点上这两处改了仓库也不会生效，只能在 GitBook 后台改：

| 想改什么 | 去哪改 |
| --- | --- |
| 发布页顶部显示的站名 | Site settings → General → **Site title** |
| 地址里的 `/smileyes-docs` 这段 | Settings → **Domain and URL** |

`gitbook-docs.yaml` 里的 `site.title` 只影响后台里显示的名字，不影响线上。改完 slug 记得回来更新上面那张表里的地址。
