# Changelog

本文件记录面向用户的版本变更，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)：每个版本一个 `## [<版本号>] - <日期>` 段落，条目按「新功能 / 改进 / 修复 / 已知限制」归类；能为版本代言的大主题以**粗体主题组**呈现——主题行括注影响范围与编号，下挂多条短条目（一条只讲一件事），发布前的验收轮修复并入所属主题组、不单列。开发中的新条目先记入顶部 `## Unreleased - 开发中` 段（本仓无自动转正工具，发版提交人工把它转正为版本段并补日期）。`scripts/release.mjs` 的 release 子命令提取最新版本段作为 GitHub Release 的发布说明，并校验其版本号与 `package.json` 的 `version` 一致；已有发布标签的版本段落随 tag 定案，不得回填或删改。

## Unreleased - 开发中

## [0.3.0] - 2026-11-23

从反重力（Antigravity）复制的行间公式，粘贴到 Vsidian 后可保留为可编辑的公式块。

### 新功能

**粘贴还原块公式**（[Bridge #11](https://github.com/ONEGAYI/vsidian-agent-bridge/pull/11)、[Vsidian #707](https://github.com/ONEGAYI/vsidian/pull/707)）

- 保留格式粘贴时，反重力等来源的 KaTeX 行间公式会还原成独立的 `$$` 块，多行 TeX 保持原样。
- 行内公式和块公式共用「KaTeX 公式还原」开关；原扩展可直接升级，不需要重新安装或设置。

> **宿主兼容性**：块公式还原需要 Vsidian 1.9.0 或更高版本；行内公式仍从 1.8.0 起可用。Codex 链接还原、主题与设置不受影响。

## [0.2.0] - 2026-11-22

Vsidian Codex Bridge 更名为 Vsidian Agent Bridge。新版可在粘贴时还原反重力的行内公式，也可以分别开关每项组件能力。

### 新功能

**粘贴反重力的行内公式**（[Bridge #10](https://github.com/ONEGAYI/vsidian-agent-bridge/pull/10)、[Vsidian #694](https://github.com/ONEGAYI/vsidian/pull/694)）

- 在 Live 编辑模式保留格式粘贴时，从反重力等来源的 KaTeX HTML 读取 TeX 注解，还原成 Markdown 的 `$…$` 行内公式。
- 纯文本粘贴和块级公式仍走原有路径。若富文本会破坏相邻公式或导致阅读视图吞掉新正文，保留剪贴板原有纯文本与换行。

**三个独立开关**（[Bridge #10](https://github.com/ONEGAYI/vsidian-agent-bridge/pull/10)）

- 从「Vsidian 设置 → 第三方组件 → Vsidian Agent Bridge」分别控制 Codex 链接还原、KaTeX 行内公式还原和 Codex Mermaid 主题。三项默认开启。
- 可以修改用户默认值，也可以只覆盖当前工作区。关闭主题开关不会改写已选主题。

### 改进

- 扩展显示名与仓库改为 Vsidian Agent Bridge；安装 ID `ONEGAYI.vsidian-codex-bridge` 和 Codex 主题 ID 不变，原扩展可直接升级。

> **宿主兼容性**：行内公式还原需要 Vsidian 1.8.0 或更高版本。旧宿主仍可使用 Codex 链接还原、Mermaid 主题和组件设置。

## [0.1.2] - 2026-10-24

维护版：README 重写为面向用户的门面说明，宿主验证套件随平台探针修复（vsidian v1.5.0）完成断言回原；无运行时行为变更。

### 改进

- README 由实施期工程文档（能力规划表、实施决策、vendor 锚与兼容口径）重写为面向用户门面：粘贴还原「装 / 不装」行为对照表、Mermaid Codex 主题亮暗画布与 ELK 布局特征介绍、双渠道安装与人工验证、升级 / 停用 / 卸载说明；工程细节下沉 docs/adr/ 与 AGENTS.md（#9）。

### 修复

- 宿主验证套件的接管断言按 vsidian#629 分桶语义回原（vsidian v1.5.0 起 `addonSvg` 独立分桶）：断言回到「真实几何 + 组件 SVG 在场 + 内置未接管」三条件合成，装载链端到端验证恢复；入口自检宿主产物含 `addonSvg`，旧宿主构建秒拒并给出可行动报错。发布时序约束（依赖修复随 vsidian v1.5.0 发行）已满足（#9，关联 vsidian#644）。
- 修复 0.1.1 发版提交遗留的 CI 踩红：真实文件契约用例此前钉死首版版本段的取值，版本段轮替即红；改为钉形态（最新段带 ISO 日期、段体非空、首版主题组全文保留），版本一致性由提取器自身校验（#9）。

## [0.1.1] - 2026-10-21

修复版：解除 Codex 主题选中后 Mermaid 图恒不可用的装载阻断，宿主套件断言面同步修复（评审轮发现旧断言只在渲染失败时可通过）。

### 修复

- 修复选中 Codex 主题后所有 Mermaid 图恒显示「Mermaid 运行时不可用」的问题：编辑器页登记此前缺少资源基址（`resources`），平台不提供 `resourceUri`、mermaid 独立产物无法装载；现以产物所在目录 `dist/` 为基址登记（与入口所在目录重合，资源许可面零扩大），装载链恢复（#7）。
- 宿主验证套件的接管断言在「组件真渲染出 SVG」场景恒假、在「渲染失败错误占位」场景反而通过（假绿）——已适配为可区分形态；根因是 Vsidian 侧 `paint.renderers` 探针两处语义缺陷（`builtinSvg` 误计组件 SVG、`width` 代表元素落到 `display:none` 节点），已开票 vsidian#629 跟踪，平台修复后断言回到原形态（#7）。

## [0.1.0] - 2026-10-16

首个版本：为 [Vsidian](https://github.com/ONEGAYI/vsidian) 桥接 Codex 生态——粘贴时还原 Codex 聊天链接，并以渲染提供者重新提供 Mermaid Codex 主题（亮暗色板 + ELK 布局）。发布形态为 GitHub Release VSIX 与 VSCode Marketplace 双通道；组件停用或卸载时 Vsidian 完全可用（回落内置转换与 default 主题）。

### 新功能

**粘贴还原：Codex 聊天链接（#2 / PR #5）**

- 保留格式粘贴 Codex 聊天内容时，剪贴板里的 `data-prompt-link-*` span（label + href 双属性）还原为标准 Markdown 链接，修复「链接被改写为 `\[...\](...)` 字面文本」的问题。
- href 口径与宿主一致：空格以 `%20` 编码、`:行号` 后缀明文透传——普通链接点击可落到目标行（宿主 #534 行号锚点解析）。
- 兼容宿主历史变体形态（单 `data-prompt-link-url` 属性）。

**Mermaid Codex 主题（#3 / PR #5）**

- 以渲染提供者身份重新提供 Codex 预设：亮暗双套色板 + 流程图 ELK 布局（elk.layered），覆盖流程、时序、类、状态、ER、甘特六类图型；色板与配置自内核逐值迁移（独立契约测试对拍）。
- 亮暗随宿主明暗状态联动；快照、导出背景与图内显式配置优先于主题默认。
- Mermaid 运行时自带打包（版本对齐上游本体版本线 mermaid 11.12.2），以 esm 分块产物按需装载——ELK 等重依赖独立分块懒加载，不进页面主产物。
- 安装只新增主题候选（Vsidian 设置「外观 → 主题」出现 **Codex**），不自动切换，选择归用户。

**工程与发布基建（#1 / #4 / PR #5）**

- 发布形态：推 `v*` 标签自动创建 GitHub Release 附 VSIX；Marketplace 发布为可选双开关（`VSCE_PAT` 密钥 + `MARKETPLACE_PUBLISH` 变量），从 Release 下载同一份 VSIX 发布——两渠道同一份字节。
- VSIX 打包带内容红线：必需清单（dist 三产物 + mermaid 分块非空）、禁止模式与白名单双保险、体积双线阈值、解包 manifest 冒烟。
- CI（push / PR）：构建 + 类型检查 + 单元契约测试 + vendor 类型快照防漂移 + VSIX 打包上传。
- vendor SDK 类型快照锚定 vsidian@`80dfc285`（附加组件 API 1.1.0 发行提交）——首次发布即对齐发行版 API 1.1.0（api 声明 `^1.1.0`，candidate 1.0.0 面全量转正无破坏性变更），升级走显式 re-vendor（不追逐 main）。
- 真宿主安装验证走静默通道：独立桌面内起 VSCode 1.82.3（engines 下界），四层断言（激活 / 主题候选 / 组件渲染选路 / 停用回落），宿主窗口不出现在用户桌面。

### 已知限制

- VSIX 安装态（`--install-extension`）的自动化回归未覆盖（开发装载路径已覆盖；安装态差异由 README 手动验证清单承载）。
- Mermaid 渲染缓存（LRU + SVG 克隆改写）未迁移，首版从简（决策见 ADR-0003）。
- Marketplace 图标未设置：本仓暂无图标资产，Marketplace 页面使用默认占位（决策见 ADR-0004）。

<!-- 变更链接
0.2.0: https://github.com/ONEGAYI/vsidian-agent-bridge/compare/v0.1.2...v0.2.0
0.3.0: https://github.com/ONEGAYI/vsidian-agent-bridge/compare/v0.2.0...v0.3.0
0.1.1: https://github.com/ONEGAYI/vsidian-codex-bridge/compare/v0.1.0...v0.1.1
0.1.0: https://github.com/ONEGAYI/vsidian-codex-bridge/commits/v0.1.0
-->
