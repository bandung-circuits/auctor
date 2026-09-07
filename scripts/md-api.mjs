// 客户端 Markdown 引擎（markdown-it），由 scripts/build.mjs 内联打包注入 __auctorMd。
// 纯 JS、零运行时依赖；渲染标准 HTML，交由客户端 dangerouslySetInnerHTML 注入。
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'

export function createMarkdown() {
  const md = new MarkdownIt({
    html: false,       // 原始 HTML 一律转义，杜绝 XSS
    linkify: false,
    typographer: false,
  })
  md.use(footnote)
  return md
}