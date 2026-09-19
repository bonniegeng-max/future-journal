# 维护者手册（不进 ClawHub 发布包）

> 本文件只面向 skill 维护者。记录发布包边界、闸门和踩过的坑。

## 发布包边界（重要）

**ClawHub 发布包只包含：**

```
SKILL.md
README.md
skill-card.md
LICENSE
assets/index.html
references/DESIGN.md
scripts/today.js
scripts/check-prompts.js
```

**发布包不包含：**

| 排除项 | 原因 |
|---|---|
| `MAINTAINING.md` | 维护者手册，本来就是仓库内文档 |
| `scripts/test-journal.js` | **依赖 jsdom 的开发期工具**，不是给装了 skill 的人用的 |
| `.git/`、`.monitoring/`、`node_modules/` | 常规排除 |

### 为什么 test-journal.js 不能进包

两个独立的理由，任一条都足够：

1. **它引用包里不存在的东西。** 包内没有 `node_modules/jsdom`，
   使用者跑它会直接报模块找不到；而 SKILL.md 一旦提到它，就构成
   「声称与实际不符」——这正是扫描器最容易判 `suspicious` 的那一类。
2. **维护者工具进发布包被判过 `suspicious / DO_NOT_INSTALL`。**
   同作者的 `priority-coach` 0.2.1 就把迭代监控脚本（含网络抓取能力）打进了发布包，
   0.2.2 起改为「只留仓库、不进包」。

> 通用规则：**凡是「改这个仓库的人用的」脚本，一律不进发布包。**
> `test-journal.js` 是 QA 工具，属于这一类。

## 发布流程

从**干净的暂存目录**发布，不要在仓库根直接发：

```bash
# 1. 在仓库外建一个干净目录
rm -rf ../future-journal-publish && mkdir -p ../future-journal-publish/scripts
cp SKILL.md README.md skill-card.md LICENSE ../future-journal-publish/
cp -R assets references ../future-journal-publish/
cp scripts/today.js scripts/check-prompts.js ../future-journal-publish/scripts/

# 2. 复查暂存目录里没有多余文件
find ../future-journal-publish -type f | sort

# 3. 发布前先跑本机私有发布闸门（脚本路径见用户级记忆，不写进本文件）
bash "$PUBLISH_GUARD/scan.sh" ../future-journal-publish

# 4. 发布
cd ../future-journal-publish
npx clawhub@latest skill publish . --slug future-journal --version <新版本> --changelog "..."
```

## 发布前检查清单

- [ ] `node scripts/check-prompts.js` 退出码 0
- [ ] `node scripts/test-journal.js` 退出码 0（32+ 条断言全过）
- [ ] 跑本机私有发布闸门（路径见用户级记忆），退出码 0 或 3
- [ ] 发布目录里**没有** `test-journal.js` / `MAINTAINING.md`
- [ ] 发布目录里**没有** `_skillhub_meta.json`（市场安装的第三方 skill 带这个文件，
      里面的 `iconLocalPath` 是本机绝对路径，会泄露路径）
- [ ] README / skill-card / LICENSE 的版本与许可证名称三处一致
- [ ] 页面里**没有硬编码的 `endpoint` / `publishableKey`**（见下）
- [ ] 线上页面仍是可用的（发布 skill 不等于发布页面，两件事）

## ⚠️ 不要把同步配置串写死进页面

看起来最顺手的「优化」是把 `endpoint` / `publishableKey` 内嵌进 `assets/index.html`，
这样使用者就不用粘贴了。**绝对不要。**

这个页面是要分发给别人的资产。一旦写死，任何装了这个 skill 的人打开页面都会连上
**同一个后端**——虽然按用户隔离、彼此看不到内容，但陌生人会在号主的环境里注册账号、
消耗号主的配额。作者自己用着舒服的代价，是所有人的数据都涌向同一个人的账上。

配置串必须由使用者自备（localStorage `fj-cfg` 或设置页粘贴）。
号主自己那份配置串文件放在**仓库目录外面**，这样它永远不会被提交、也不会随 skill 分发。

## 页面发布与 skill 发布是两个独立的动作

| 动作 | 命令 / 工具 | 影响 |
|---|---|---|
| 发布 skill | `clawhub skill publish` | 别人能安装这个 skill |
| 发布页面 | Agent 平台的 Sites / 发布能力 | 线上多一个可访问网址 |

改了 `assets/index.html` 但只发了 skill，线上页面**不会**跟着变。

## 页面发布目录 = `assets/`（已收口，别再改回去）

线上页面的发布目录是 **`assets/`**，入口 `assets/index.html`。
所以线上**只暴露一个页面文件**，仓库里的其他东西不会跟着上公网：

```
/            → assets/index.html （手账本体）
/SKILL.md              ← 不公开
/references/DESIGN.md  ← 不公开
/scripts/*.js          ← 不公开
```

### 改回去会怎样（这就是当初的坑）

早先发布目录是整个仓库根，于是 `/SKILL.md`、`/references/DESIGN.md`、`/scripts/*.js`
在线上都公开可读（当时实测 HTTP 200）。那些内容本来就要随 skill 公开，所以当时无害；
**但这是一个静默的陷阱 —— 以后往仓库里放任何文件，都会自动变成公网可见。**

收口手法就两步，已经做了：

1. 把 `assets/index.html` 改名为 `assets/index.html`（这样发布目录的根就是页面本身）
2. 发布时把 directory 指向 `future-journal/assets`，而不是仓库根

网址**没有变**：`https://future-journal.app.workbuddy.host/` 现在直接就是手账，
不再需要根路径跳转页。

## 授权发布时的协作提醒

- 页面的重新发布**需要当次明确同意**，之前对话里的同意不延续
- 改了页面内容之后要重新问一次，不能沿用上一轮的授权
- 发布后**逐字节复核**线上文件与本地是否一致，不要只信「发布成功」的返回
