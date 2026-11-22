import { describe, expect, it, vi } from 'vitest'
import type { AddonDefinition, AddonSettingsChangeEventData } from '../types/vendor/host/addons/addonRegistry'
import { addonDefinition } from '../src/extension'

vi.mock('vscode', () => ({ env: { language: 'zh-cn' } }))

const LINKS = 'paste.codexLinks'
const MATH = 'paste.katexInlineMath'
const THEME = 'appearance.codexMermaid'

function host({ old = false, values = {} }: { old?: boolean; values?: Record<string, boolean> } = {}) {
  const definitions: { key: string; default: boolean }[] = []
  const active = new Set<string>()
  const register = (id: string) => {
    if (active.has(id)) throw new Error(`Duplicate registration: ${id}`)
    active.add(id)
    return { ok: true as const, dispose: () => { active.delete(id) } }
  }
  const listeners = new Set<(e: AddonSettingsChangeEventData) => void>()
  const disposeCallbacks: (() => void)[] = []
  const settings = {
    registerDefinitions: vi.fn((defs: typeof definitions) => { definitions.push(...defs) }),
    get: () => ({ values: { ...Object.fromEntries(definitions.map(d => [d.key, d.default])), ...values }, sources: {} }),
    onChanged: (fn: (e: AddonSettingsChangeEventData) => void) => {
      listeners.add(fn)
      return { dispose: () => { listeners.delete(fn) } }
    },
  }
  let themeKnown = false
  const registerEditor = vi.fn(() => ({ themeKnown, candidate: active.has('codex') }))
  const ctx = {
    pages: { registerEditor },
    themes: { register: () => {
      themeKnown = true
      return register('codex')
    } },
    paste: { registerRules: vi.fn((rules: { id: string; output: { slots: { tex?: { inlineMath?: true } } } }[]) => {
      if (old && rules.some(r => r.output.slots.tex?.inlineMath)) {
        return { ok: false, reason: 'invalid-declaration', detail: 'unsupported output' }
      }
      return register(rules[0]!.id)
    }) },
    onDispose: (fn: () => void) => { disposeCallbacks.push(fn) },
  }
  const addon: AddonDefinition = addonDefinition
  addon.setup!({ settings } as never)
  return {
    definitions, active, registerEditor, registerRules: ctx.paste.registerRules, listeners,
    enable: () => addon.enable!(ctx as never),
    disable: () => { for (const callback of disposeCallbacks.splice(0)) callback() },
    change: (key: string, value: boolean) => {
      values[key] = value
      for (const listener of listeners) listener({ scope: 'workspace', keys: [key] })
    },
  }
}

describe('Agent Bridge 组件开关', () => {
  it('设置页注册三个独立且默认开启的布尔开关', () => {
    const h = host()
    expect(h.active.size).toBe(0)
    expect(h.definitions).toMatchObject([
      { key: LINKS, type: 'boolean', default: true },
      { key: MATH, type: 'boolean', default: true },
      { key: THEME, type: 'boolean', default: true },
    ])
  })

  it('设置变化只注册或撤销对应功能，关闭组件后不再响应', () => {
    const h = host({ values: { [THEME]: false } })
    h.enable()
    expect(h.active).toEqual(new Set(['codex-prompt-link', 'katex-inline-math']))
    expect(h.registerEditor).toHaveReturnedWith({ themeKnown: true, candidate: false })
    h.change(MATH, false)
    expect(h.active).toEqual(new Set(['codex-prompt-link']))
    h.change(THEME, true)
    expect(h.active).toEqual(new Set(['codex-prompt-link', 'codex']))
    h.change(LINKS, false)
    expect(h.active).toEqual(new Set(['codex']))
    h.change(MATH, true)
    h.change(THEME, false)
    expect(h.active).toEqual(new Set(['katex-inline-math']))
    expect(h.registerEditor).toHaveBeenCalledTimes(1)
    h.disable()
    expect(h.active.size).toBe(0)
    expect(h.listeners.size).toBe(0)
    h.change(LINKS, true)
    expect(h.active.size).toBe(0)
    h.enable()
    expect(h.active).toEqual(new Set(['codex-prompt-link', 'katex-inline-math']))
  })

  it('旧宿主拒绝公式规则时仍保留链接和主题', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const h = host({ old: true })
      h.enable()
      expect(h.active).toEqual(new Set(['codex-prompt-link', 'codex']))
      expect(h.registerRules).toHaveBeenCalledTimes(2)
      expect(warn).toHaveBeenCalledTimes(1)
    } finally { warn.mockRestore() }
  })
})
