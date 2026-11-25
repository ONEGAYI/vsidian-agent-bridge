# Vsidian Agent Bridge

把 AI 助手的富文本带进 [Vsidian](https://github.com/ONEGAYI/vsidian)（VSCode 里的类 Obsidian Markdown 编辑器）：从 Codex 复制的链接仍是链接，从反重力（Antigravity）复制的 KaTeX 行内和块公式仍可编辑。组件也提供 Codex Mermaid 主题。

## 在 Vsidian 里独立开关功能

打开「Vsidian 设置 → 第三方组件 → Vsidian Agent Bridge」。**Codex 链接还原**、**KaTeX 公式还原**和 **Codex Mermaid 主题**默认开启，可分别修改用户默认或覆盖当前工作区。主题开关只控制候选是否可用，不改变你的首选主题。

## 粘贴 Codex 内容，链接还是链接

从 Codex 聊天复制内容粘贴到 Vsidian，链接会被转成带转义符的字面文本，渲染后无法点击。装上本组件后，粘贴时自动还原为标准 Markdown 链接。

| | 粘贴进笔记的结果 |
| --- | --- |
| 不装组件 | `\[修复清单\](notes/fixes.md)`——字面文本，渲染后点不了 |
| 装上组件 | `[修复清单](notes/fixes.md)`——标准链接，渲染后可点击 |

还原发生在粘贴这一步，已经写进笔记的内容不会被二次改动。

## 粘贴反重力的公式

在 Vsidian 的实时预览模式下保留格式粘贴。来源带有原始 TeX 时，行内公式还原为 `$…$`，行间公式还原为独立的 `$$` 公式块。纯文本粘贴不会还原公式。

行内公式还原需要 Vsidian 1.8.0 或更高版本，块公式还原需要 1.9.0 或更高版本。更旧的宿主仍可用 Codex 链接还原、主题与设置页。

## Mermaid 图的 Codex 主题

Vsidian 的「设置 → 外观 → 主题」下拉里会多出一个 **Codex** 候选。安装只新增候选，不自动切换；选择之后，笔记里的 Mermaid 图按 Codex 配色渲染：

- 亮色画布纯白（`#ffffff`）、暗色画布深灰（`#181818`），跟随编辑器明暗自动切换——内置 default 主题没有这层暗色填充
- 流程图使用 ELK 布局、圆角矩形
- 覆盖流程图、时序图、类图、状态图、ER 图、甘特图、饼图；mindmap、时间线等其他图型仍按默认样式渲染
- 渲染引擎 mermaid 11.12.2 由组件自带打包，不联网加载

## 安装

前置：VSCode 1.82.3 或更新，Vsidian 1.1.0 或更新（未装 Vsidian 时组件不激活，也没有副作用）。

两个渠道任选其一：

1. **VSCode Marketplace**：按扩展 ID 搜索，或命令行执行：
   ```bash
   code --install-extension ONEGAYI.vsidian-codex-bridge
   ```
2. **GitHub Release**：从 [Releases](https://github.com/ONEGAYI/vsidian-agent-bridge/releases) 下载 VSIX，扩展面板「… → 从 VSIX 安装…」选择下载的文件。

安装后按提示重载窗口即生效。可以这样确认：

1. 从 Codex 聊天复制一段带链接的内容，粘贴到 Vsidian 笔记，链接应当可以点击；
2. 从反重力复制带公式的内容并保留格式粘贴。Vsidian 1.9.0 起，行间公式在源码中应由独立的 `$$` 行包裹；行内公式仍只用一对 `$`；
3. 「外观 → 主题」选择 Codex，打开一篇含 Mermaid 图的笔记并切到暗色模式，画布应当是深灰底色。

## 升级、停用与卸载

- Marketplace 安装的组件随发布自动更新；VSIX 渠道下载新版 VSIX 覆盖安装即可。各版本变化见 [CHANGELOG](CHANGELOG.md)。
- 原 **Vsidian Codex Bridge** 和 **Vsidian Agent Bridge** 共用安装 ID `ONEGAYI.vsidian-codex-bridge`，不需要重新安装或重新选择 Codex 主题。
- 停用或卸载组件，Vsidian 完全可用：粘贴回落内置转换，Mermaid 回落内置 default 主题。已选的 Codex 主题设置保留，组件恢复后自动回到 Codex 渲染。

## 版本兼容

| 组件版本 | 需要 Vsidian | 说明 |
| --- | --- | --- |
| 0.3.0–0.3.1 | ≥ 1.1.0 | 行内公式还原需要 Vsidian ≥ 1.8.0，块公式还原需要 ≥ 1.9.0 |
| 0.2.0 | ≥ 1.1.0 | 行内公式还原需要 Vsidian ≥ 1.8.0 |
| 0.1.x | ≥ 1.1.0 | Codex 链接还原与 Mermaid 主题，随 Vsidian 附加组件 API 1.1.0 发布 |

## 开发

```bash
npm install                          # 安装 devDependencies（无运行时依赖）
npm run compile                      # 构建三产物（宿主 / 页面 / mermaid 分块）+ 类型检查
npm test                             # 构建后运行 vitest 单元层
npm run vendor:check                 # 校验 SDK 类型快照无漂移
npm run package                      # 本地 VSIX 打包（含内容与体积红线检查）
npm run test:host                    # 宿主层静默验证（需 --host 指向 vsidian 构建产物仓）
node test/browser/smoke-mermaid.mjs  # 浏览器层冒烟（需 vsidian 主仓的 Playwright）
```

验证支持块公式槽的宿主时，在宿主层验证命令后加 `-- --host <Vsidian 工作树> --block-math-host`。

架构决策见 [docs/adr/](docs/adr/)，开发规范与任务台账见 [AGENTS.md](AGENTS.md)，发布流程见 [ADR-0004](docs/adr/0004-发布与分发形态.md)。

## License

MIT
