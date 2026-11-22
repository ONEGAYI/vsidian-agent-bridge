// Codex Mermaid 编辑器页与主题目录的登记分离：开关只改变候选，
// 不重复装卸已打开的编辑器页面工厂。
import type { AddonEnableContext } from '../../types/vendor/host/addons/addonRegistry'
import { ADDON_ID, CODEX_THEME_DECLARATION } from './meta'

export function registerCodexEditor(enableCtx: AddonEnableContext): void {
  // 编辑器页入口：dist/editor.js（IIFE）装载 Codex 渲染提供者
  // （sdk.renderers.register + themeEnvironment 订阅，见 page-editor.ts）。
  // resources 以 dist/ 为 resourceUri 基址——缺此登记则 sdk.resourceUri
  // 恒 null，mermaid 独立产物无法装载、渲染恒降级「Mermaid 运行时不可用」
  // （issue #7）。基址收在产物所在目录：与入口所在目录重合，资源许可面
  // 零扩大；目录归基址，loader 常量只写文件名（mermaid.js）
  enableCtx.pages.registerEditor({ entry: 'dist/editor.js', resources: ['dist'] })
}

export function registerCodexTheme(enableCtx: AddonEnableContext) {
  // Codex 主题元数据登记（enable 注册按 addonId 整组替换；目录只增
  // 候选不自动切换——用户在「外观 → 主题」显式选择后生效）。普通 API
  // 拒绝（invalid-theme/duplicate-theme）不算组件故障：开发者日志留痕
  const themeResult = enableCtx.themes.register([CODEX_THEME_DECLARATION])
  if (!themeResult.ok) {
    console.warn(`[${ADDON_ID}] Codex 主题登记被拒绝（${themeResult.reason}）`)
  }
  return themeResult
}
