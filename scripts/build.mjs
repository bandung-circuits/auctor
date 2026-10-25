// dsh-auctor — build. 宿主经 esbuild 私有模块构建到 lib/，client 文本拼接注入 window.__ModuleLoader__。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { build } from 'esbuild'

mkdirSync('lib', { recursive: true })

await build({
  entryPoints: ['src/host/index.ts', 'src/host/mcp.js'],
  outdir: 'lib',
  bundle: false,
  format: 'esm',
  platform: 'node',
  target: 'node20',
})

// markdown-it 内联包：把 md-api.mjs（含 markdown-it + footnote 插件）打成独立 IIFE，
// 注入到 client factory 顶部成为 __auctorMd 全局，供渲染器调用（client 不做二次解析）。
const mdResult = await build({
  entryPoints: ['scripts/md-api.mjs'],
  bundle: true,
  format: 'iife',
  globalName: '__auctorMd',
  write: false,
  platform: 'browser',
  target: 'es2018',
  minify: true,
})
const mdText = mdResult.outputFiles[0].text

const body = readFileSync('src/client/index.js', 'utf8')
const wrapped = `// dsh-auctor — Client half (browser)。由 scripts/build.mjs 生成，请修改 src/client/index.js。
window.__ModuleLoader__.load({
  id: "dsh-auctor",
  factory: (require) => {
${mdText}
${body}
    return { inject, apply }
  }
})
`
writeFileSync('lib/client.js', wrapped)