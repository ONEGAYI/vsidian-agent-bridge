import * as vscode from 'vscode'
import type { AddonDefinition, AddonEnableContext, AddonRegistrationHandle, AddonSettingsContextApi } from '../types/vendor/host/addons/addonRegistry'
import type { VsidianHostExports } from './host-api'
import { registerCodexPasteRules, registerKatexPasteRules } from './paste-rules'
import { ADDON_ID } from './codex/meta'
import { registerCodexEditor, registerCodexTheme } from './codex/host-enable'

/** 本扩展 ID（publisher.name，装载器按此核对入口身份） */
const SELF_ID = ADDON_ID
/** Vsidian 本体扩展 ID */
const HOST_ID = 'onegayi.vsidian'
const MERMAID_THEME_KEY = 'appearance.codexMermaid'

const features = [
  {
    key: 'paste.codexLinks',
    zh: 'Codex 链接还原',
    en: 'Restore Codex links',
    register: (ctx: AddonEnableContext) => registerCodexPasteRules(ctx.paste),
  },
  {
    key: 'paste.katexInlineMath',
    zh: 'KaTeX 公式还原（含反重力）',
    en: 'Restore KaTeX math (including Antigravity)',
    register: (ctx: AddonEnableContext) => registerKatexPasteRules(ctx.paste),
  },
  {
    key: MERMAID_THEME_KEY,
    zh: '提供 Codex Mermaid 主题',
    en: 'Offer the Codex Mermaid theme',
    register: registerCodexTheme,
  },
]

let settings: AddonSettingsContextApi
export const addonDefinition: AddonDefinition = {
  setup(ctx) {
    settings = ctx.settings
    const language = vscode.env.language.startsWith('zh') ? 'zh' : 'en'
    settings.registerDefinitions(features.map(({ key, ...feature }) => ({
      key,
      type: 'boolean',
      default: true,
      title: feature[language],
    })))
  },
  enable(ctx) {
    // undefined 表示宿主拒绝登记：仍记录已尝试，避免无关设置变化时重复登记。
    const registrations = new Map<string, AddonRegistrationHandle | undefined>()
    // 即使初始关闭，也先让宿主识别主题专用提供者。撤回候选后该身份在本代次
    // 仍保留，页面提供者不会参与普通 Mermaid 自动接管。
    const theme = registerCodexTheme(ctx)
    registrations.set(MERMAID_THEME_KEY, theme.ok ? theme : undefined)
    const syncFeatures = () => {
      const { values } = settings.get()
      for (const { key, register } of features) {
        if (values[key] === true) {
          if (!registrations.has(key)) {
            const result = register(ctx)
            registrations.set(key, result.ok ? result : undefined)
          }
        } else {
          registrations.get(key)?.dispose()
          registrations.delete(key)
        }
      }
    }
    const listener = settings.onChanged(syncFeatures)
    ctx.onDispose(() => {
      listener.dispose()
      for (const registration of registrations.values()) registration?.dispose()
    })
    syncFeatures()
    if (theme.ok) registerCodexEditor(ctx)
  },
}

async function activate(_context: vscode.ExtensionContext): Promise<void> {
  const ext = vscode.extensions.getExtension<VsidianHostExports>(HOST_ID)
  if (!ext) {
    // 开发者向诊断信息（非用户可见通知）
    throw new Error(`${SELF_ID}: host extension ${HOST_ID} not found`)
  }
  const host = await ext.activate()
  const result = host.registerAddon({ id: SELF_ID }, addonDefinition)
  if (!result.ok) {
    throw new Error(`${SELF_ID}: registerAddon rejected (${result.reason})`)
  }
}

function deactivate(): void {}

// VSCode 扩展宿主契约：activate/deactivate 经 module.exports 公布。不用
// ESM export——esbuild CJS bundle 会把无 bundle 内消费者的入口导出消除为
// 死代码（0&&module.exports=...），显式赋值是可靠保留形态（蓝本实测坑，
// 见 ADR-0001）。
module.exports = { activate, deactivate }
