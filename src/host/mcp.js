// Auctor workspace-MCP：读取/播种 ~/.auctor/.dsh/mcp.servers.yml 并挂载到 dsh。
// YAML 解析器截取自 pomasa-studio (MIT) src/host/core/mcp-servers.js，只消费种子文件可表达的子集。
import fs from 'node:fs'
import { join } from 'node:path'

const SERVER_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/

function stripComment(line) {
  const i = line.indexOf('#')
  if (i > 0 && /\s/.test(line[i - 1])) return line.slice(0, i)
  return line
}

function parseScalar(raw) {
  let s = raw.trim()
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) return s.slice(1, -1)
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) return s.slice(1, -1)
  if (s.startsWith('!!js ')) {
    const m = s.match(/^!!js\s+process\.env\.([A-Za-z_][A-Za-z0-9_]*)\s*$/)
    if (m) return process.env[m[1]] ?? ''
    throw new Error(`unsupported !!js expression: ${s.slice(0, 40)}`)
  }
  return s
}

function parseFlowArray(raw) {
  const s = raw.trim()
  if (!s.startsWith('[') || !s.endsWith(']')) return null
  const inner = s.slice(1, -1)
  if (!inner.trim()) return []
  return inner.split(',').map((x) => parseScalar(x)).filter((x) => x !== '')
}

function parseServersYaml(text) {
  const lines = text.split(/\r?\n/)
  const servers = {}
  let current = null
  let currentSection = null

  const assign = (key, value) => {
    if (!current) return
    if (currentSection) {
      if (!current[currentSection]) current[currentSection] = {}
      current[currentSection][key] = value
    } else current[key] = value
  }

  for (const raw of lines) {
    const line = stripComment(raw)
    if (!line.trim()) continue
    if (/^\s*#/.test(line)) continue
    const indent = line.match(/^\s*/)[0].length
    const content = line.trim()
    if (indent === 0) {
      if (content === 'servers:') { current = null; currentSection = null; continue }
      continue
    }
    if (indent === 2) {
      if (!content.endsWith(':')) continue
      const name = content.slice(0, -1).trim().replace(/["']/g, '')
      if (!name || !SERVER_NAME_PATTERN.test(name)) continue
      servers[name] = {}
      current = servers[name]
      currentSection = null
      continue
    }
    if (!current) continue
    const sep = content.indexOf(':')
    if (sep < 0 || content.startsWith('- ')) continue
    const key = content.slice(0, sep).trim()
    const rest = content.slice(sep + 1).trim()
    if (key === 'env' || key === 'headers') { currentSection = key; current[key] = {}; continue }
    if (rest === '') continue
    if (key === 'args') { const arr = parseFlowArray(rest); if (arr) current[key] = arr; continue }
    assign(key, parseScalar(rest))
  }
  return servers
}

function toMcpConfig(name, def) {
  if (!def || typeof def !== 'object') return { serverName: name, error: 'empty server entry' }
  const transport = String(def.transport || '')
  if (transport === 'stdio') {
    if (!def.command) return { serverName: name, error: 'stdio server needs command' }
    return { serverName: name, config: { serverName: name, transport: 'stdio', command: String(def.command), args: Array.isArray(def.args) ? def.args.map(String) : [], env: (def.env && typeof def.env === 'object') ? def.env : {} } }
  }
  if (transport === 'streamable-http') {
    if (!def.url) return { serverName: name, error: 'streamable-http server needs url' }
    return { serverName: name, config: { serverName: name, transport: 'streamable-http', url: String(def.url), headers: (def.headers && typeof def.headers === 'object') ? def.headers : {} } }
  }
  return { serverName: name, error: `unsupported transport: ${transport || '(missing)'}` }
}

export function readMcpServerConfigs(file) {
  if (!fs.existsSync(file)) return []
  const parsed = parseServersYaml(fs.readFileSync(file, 'utf8'))
  const out = []
  for (const name of Object.keys(parsed)) {
    const r = toMcpConfig(name, parsed[name])
    if (r.config) out.push({ serverName: name, config: r.config })
    else console.error(`[auctor] MCP server "${name}" skipped: ${r.error}`)
  }
  return out
}

const SEED_YAML = `# ~/.auctor workspace MCP (请填你自己的凭证；可对照 ~/.pomasa/.dsh/mcp.servers.yml)。
# 由 Auctor 插件在 dsh 启动时自动加载。
# 凭证优先走环境变量（!!js process.env.XXX），也可直接填写。
servers:
  serper-search:
    transport: stdio
    command: uvx
    args: ["--with", "mcp<2.0", "serper-mcp-server"]
    env:
      SERPER_API_KEY: "!!js process.env.SERPER_API_KEY"
  oxylabs:
    transport: stdio
    command: uvx
    args: ["oxylabs-mcp"]
    env:
      OXYLABS_USERNAME: "!!js process.env.OXYLABS_USERNAME"
      OXYLABS_PASSWORD: "!!js process.env.OXYLABS_PASSWORD"
  crawl4ai:
    transport: stdio
    command: uvx
    args: ["--from", "crawl4ai-search-mcp==0.1.1", "crawl4ai-search"]
`

/** 种子文件不存在时写样例（环境变量占位，不含真实凭证）。 */
export function ensureMcpSeed(base) {
  const file = join(base, '.dsh', 'mcp.servers.yml')
  if (!fs.existsSync(file)) {
    fs.mkdirSync(join(base, '.dsh'), { recursive: true })
    fs.writeFileSync(file, SEED_YAML)
  }
  return fs.existsSync(file) ? file : null
}

/** 把 .dsh/mcp.servers.yml 里的服务器逐个挂上 dsh（best-effort，不阻塞启动）。 */
export async function loadMcpServers(ctx, base) {
  let configs
  try {
    configs = readMcpServerConfigs(join(base, '.dsh', 'mcp.servers.yml'))
  } catch (e) {
    return { ok: false, error: 'mcp config unreadable: ' + String((e && e.message) || e) }
  }
  if (!configs.length) return { ok: true, loaded: [] }

  let mcpClient
  try {
    mcpClient = await import('@deepseek-ai/dsh-mcp-client')
  } catch (e) {
    return { ok: false, error: '@deepseek-ai/dsh-mcp-client not resolvable: ' + String((e && e.message) || e) }
  }

  const loaded = []
  for (const { serverName, config } of configs) {
    try {
      if (typeof ctx.plugin === 'function') ctx.plugin(mcpClient, config)
      else await mcpClient.apply(ctx, config)
      loaded.push(serverName)
    } catch (e) {
      console.error(`[auctor] MCP server "${serverName}" failed to mount:`, (e && e.stack) || e)
    }
  }
  return { ok: true, loaded }
}