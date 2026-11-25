// Codex Mermaid 运行时包装（票 #3）：形态迁移自内核 src/webview/
// mermaidEntry.ts（vsidian@301d2c16）对 mermaid 的 render 包装——每张图先
// 恢复站点配置、再按 mermaid 自身识别结果叠加 Codex 预设。
//
// 图内显式配置优先（票面口径）：包装层把源码逐字节透传给 mermaid.render，
// 不做任何改写或剥离——frontmatter（init 配置）、classDef 与 style 由
// mermaid 自身解析并覆盖站点配置（「预设不改写源码」，上游原口径）。
//
// 与上游的差异：明暗由调用方显式传入（dark 参数——页面侧持有
// themeEnvironment 的事实），不像上游从 baseConfig.theme 推断。
//
// 共享串行队列（PR #5 审查 P1，形态对齐内核 mermaidRender.ts 的外层
// renderQueue）：mermaid 的站点配置是**全局单例**（initialize 落地到
// mermaid 内部 siteConfig，render 在内部异步阶段消费它）——若 initialize
// 与 render 各自排队外立即执行，一屏多图并发 mount 时后图的叠加配置会
// 覆盖前图尚未消费完的配置（审查实证：并发 sequence→flowchart→pie 中间
// 流程图丢失 Codex 圆角 themeCSS；并发三张 pie（dark/dark/light）第二张
// 输出明色背景）。因此 initialize、detectType、render 在同一队列中按
// 「恢复基线 → 叠加预设 → 渲染完成」整段串行——mount、主题重绘与
// exportSvg 全部路径共用本包装 API，均被覆盖；队列吞掉已结算任务的重
// 复拒绝，单个任务失败不阻断后续排队。
import { buildCodexMermaidConfig } from './theme'

/** 包装所需的 mermaid 能力面（真实实现来自 npm mermaid；测试注入 mock） */
export interface CodexMermaidLike {
  initialize(config: Record<string, unknown>): void
  detectType(code: string): string
  render(id: string, code: string): Promise<{ svg: string }>
}

/** 暴露给页面装载层的包装 API 面 */
export interface CodexMermaidApi {
  initialize(config: Record<string, unknown>): void
  render(id: string, code: string, dark: boolean): Promise<{ svg: string }>
}

const CSS_STRING = String.raw`"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'`
const CSS_IDENTIFIER = String.raw`(?:[\w\u0080-\uffff-]|\\(?:[\da-fA-F]{1,6}(?:\r\n|[ \t\r\n\f])?|[^\r\n\f]))+`
const CSS_RULE_HEAD = new RegExp(String.raw`(?:^|[{}])(?:${CSS_STRING}|[^'"{}])*(?=\{)`, 'g')
const CSS_ID_SELECTOR = new RegExp(
  String.raw`(\[\s*id\s*=\s*)(${CSS_STRING}|${CSS_IDENTIFIER})|#(${CSS_IDENTIFIER})|${CSS_STRING}`, 'g',
)
const CSS_URL = new RegExp(String.raw`url\(\s*(${CSS_STRING}|(?:\\[\s\S]|[^'")\\])*)\s*\)|${CSS_STRING}`, 'gi')

function unescapeCss(value: string): string {
  return value.replace(/\\(?:([\da-f]{1,6})(?:\r\n|[ \t\r\n\f])?|([^\r\n\f]))/gi,
    (_match, hex: string | undefined, char: string) => {
      if (hex === undefined) return char
      const point = Number.parseInt(hex, 16)
      return point === 0 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)
        ? '\ufffd' : String.fromCodePoint(point)
    })
}

/** Mermaid 的 arrowhead 等 ID 会跨图重复；根 SVG 已使用调用方的渲染 ID。 */
function scopeSvgIds(svg: string, renderId: string): string {
  const markup = /<style>[\s\S]*?<\/style>|<[A-Za-z](?:[^">]|"[^"]*")*>/g
  const ids = new Map<string, string>()
  for (const [part] of svg.matchAll(markup)) {
    if (part.startsWith('<style>')) continue
    const id = part.match(/\sid="([^"]+)"/)?.[1]
    if (id !== undefined && id !== renderId && !ids.has(id)) {
      ids.set(id, `${renderId}-ref-${ids.size}`)
    }
  }
  const scopeId = (id: string) => ids.get(id) ?? id
  const scopeSelectors = (selector: string) => selector.replace(CSS_ID_SELECTOR,
    (match, prefix: string, attrValue: string | undefined, hashId: string | undefined) => {
      if (hashId !== undefined) {
        const id = ids.get(unescapeCss(hashId))
        return id === undefined ? match : `#${id}`
      }
      if (attrValue === undefined) return match // 其他选择器的字符串值原样保留
      const quote = /^['"]/.test(attrValue) ? attrValue[0] : ''
      const id = ids.get(unescapeCss(quote ? attrValue.slice(1, -1) : attrValue))
      return id === undefined ? match : `${prefix}${quote}${id}${quote}`
    })
  const scopeUrls = (value: string) => value.replace(CSS_URL, (match, arg: string | undefined) => {
    if (arg === undefined) return match // CSS 字符串不是 url() 引用
    const reference = arg.trim().replace(/^(['"]|&quot;)([\s\S]*)\1$/, '$2')
    const hash = reference.lastIndexOf('#')
    if (hash < 0) return match
    const id = ids.get(unescapeCss(reference.slice(hash + 1)))
    const address = reference.slice(0, hash)
    // arrowMarkerAbsolute 也会指向本页；外部 SVG 同名的片段不属于本图。
    if (id === undefined || (address && unescapeCss(address) !== window.location.href.split('#', 1)[0])) return match
    return match.replace(reference, () => `${address}#${id}`)
  })
  return svg.replace(markup, (part) => {
    // 只改样式选择器和 url 引用，保留颜色值与图中文字。
    if (part.startsWith('<style>')) {
      return scopeUrls(part.replace(CSS_RULE_HEAD, scopeSelectors))
    }
    return part.replace(
      /(\s)(id|href|xlink:href|aria-labelledby|aria-describedby|marker(?:-start|-mid|-end)?|clip-path|fill|filter|mask|stroke|style)="([^"]*)"/g,
      (_attr, space: string, name: string, value: string) => {
        if (name === 'id') value = scopeId(value)
        else if (name === 'href' || name === 'xlink:href') {
          if (value.startsWith('#')) value = `#${scopeId(value.slice(1))}`
        } else if (name.startsWith('aria-')) value = value.replace(/\S+/g, scopeId)
        else value = scopeUrls(value)
        return `${space}${name}="${value}"`
      },
    )
  })
}

/** 包装真实 mermaid：站点配置基线 + 逐图叠加 Codex 预设 */
export function createCodexMermaidApi(mermaid: CodexMermaidLike): CodexMermaidApi {
  let baseConfig: Record<string, unknown> = {}
  /** 共享串行队列尾：所有配置变更与渲染按入队顺序整段串行 */
  let queueTail: Promise<unknown> = Promise.resolve()

  function enqueue<T>(task: () => Promise<T> | T): Promise<T> {
    const run = queueTail.then(task)
    // 队列尾吞掉已结算任务的拒绝：单任务失败不阻断后续排队（上游同款）
    queueTail = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  return {
    initialize(config) {
      baseConfig = config // 基线立即生效（后续 render 恢复最新基线）
      void enqueue(() => {
        mermaid.initialize(config)
      }).catch((e: unknown) => {
        // initialize 的 mermaid 侧失败不影响后续 render 的恢复路径；包装层
        // 无降级口径可走（该入口本就 void），保守记录不吞声
        console.warn('[codex-mermaid] initialize 排队执行失败', e)
      })
    },
    render(id, code, dark) {
      return enqueue(async () => {
        // 每张图先恢复站点配置（上一张图的预设不泄漏到本张），再按
        // detectType 结果叠加 Codex 预设；白名单外类型（mindmap 等）
        // buildCodexMermaidConfig 返回 undefined——只恢复、不叠加。
        // suppressErrorRendering 强制开启（包装层私有标志，非站点配置
        // 语义）：mermaid 解析/绘制失败默认向 document.body 插入错误图
        // 临时根（d<id>）再 reject——组件的错误口径是自处理降级（错误
        // 信息 + 源码进本容器，见 renderer），错误图 SVG 是残留物（PR #5
        // 审查 P2）；开启后 mermaid 在 throw 前自行移除临时根
        mermaid.initialize({ ...baseConfig, suppressErrorRendering: true })
        const config = buildCodexMermaidConfig(mermaid.detectType(code), dark)
        if (config) {
          mermaid.initialize({ ...baseConfig, ...config, suppressErrorRendering: true })
        }
        const { svg } = await mermaid.render(id, code)
        return { svg: scopeSvgIds(svg, id) }
      })
    },
  }
}
