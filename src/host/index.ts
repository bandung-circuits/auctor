// dsh-auctor host。
// - 宿主只做确定性动作：脚手架项目目录、持久化索引、拼 prompt、回填会话 id、门标记、产物文件读写、运行判定。
// - 不做 agentLoop：会话由 CLIENT 经 dsh workspaces/sessions 服务创建与驱动（照 pomasa/pictor 的 driveSession 模式）。
// - 界面状态三源：run.json（orchestrator 按 OBV-03 维护）+ 文件事实 + 门标记文件；milestonesOf 是把三者折叠成六段里程碑视图的展示层。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, rmSync, statSync, cpSync, appendFileSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { ensureMcpSeed, loadMcpServers } from './mcp.js'

export const name = 'dsh-auctor'
export const inject = ['connection', 'webServer']

const THIS_FILE = fileURLToPath(import.meta.url)
const ROOT = resolve(dirname(THIS_FILE), '..') // lib/index.js → 包根

export interface ProjectRecord { id: string; title: string; createdAt: string; updatedAt: string; sessionId?: string }
export interface Milestone { key: string; status: string }
export type MilestoneKey = 'research' | 'expert' | 'deep' | 'points' | 'outline' | 'article'
const MILESTONE_KEYS: MilestoneKey[] = ['research', 'expert', 'deep', 'points', 'outline', 'article']

// ---------- 纯函数（L1 可测） ----------

export const now = (): string => new Date().toISOString()

export function firstLine(text: string, max = 80): string {
  const line = String(text || '').split(/\r?\n/).map((s) => s.trim()).find((s) => s.length > 0) || ''
  return line.length > max ? line.slice(0, max) + '…' : line
}

export function sanitizeSlug(name: string): string {
  const s = String(name || '').trim().toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return s || 'expert'
}

export function readJsonSafe<T = unknown>(file: string): T | null {
  try { return JSON.parse(readFileSync(file, 'utf8')) as T } catch { return null }
}

function fileExists(p: string): boolean { try { return statSync(p).isFile() } catch { return false } }
function dirHas(p: string): boolean { try { return readdirSync(p).length > 0 } catch { return false } }
const hasP = (root: string, rel: string) => fileExists(join(root, rel))
const dirHasP = (root: string, rel: string) => dirHas(join(root, rel))

function indexCount(root: string, rel: string): number {
  const arr = readJsonSafe(join(root, rel))
  return Array.isArray(arr) ? arr.length : 0
}

interface RunStage { id: string; status?: string }
interface RunJson { status?: string; stages?: RunStage[] }

function readRunJson(root: string): RunJson | null {
  return readJsonSafe<RunJson>(join(root, 'run.json'))
}

export function listFiles(root: string): string[] {
  const out: string[] = []
  const walk = (rel: string) => {
    let entries: string[] = []
    try { entries = readdirSync(join(root, rel)) } catch { return }
    for (const e of entries.sort()) {
      const child = rel ? `${rel}/${e}` : e
      let isFile = false
      try { isFile = statSync(join(root, child)).isFile() } catch { continue }
      if (isFile) out.push(child)
      else walk(child)
    }
  }
  walk('')
  return out.sort()
}

export function milestonesOf(root: string): Milestone[] {
  const f = {
    summary: hasP(root, '02.summary/initial-summary.md'),
    insightsMd: dirHasP(root, '03.expert-insights'),
    questions: hasP(root, '04.research-questions/research-questions.md'),
    deepDir: dirHasP(root, '05.deep-research'),
    points: hasP(root, '06.commentary-points/commentary-points.md'),
    outline: hasP(root, '07.outline/outline.md'),
    article: hasP(root, '08.article/article.md'),
    accepted: hasP(root, '08.article/accepted.json'),
    expertProvided: dirHasP(root, 'input/expert'),
  }
  const rj = readRunJson(root)
  const st = (id: string): string | undefined => rj?.stages?.find((x) => x.id === id)?.status || undefined
  const isActive = (id: string) => st(id) === 'active'
  const isFailed = (...ids: string[]) => ids.some((id) => st(id) === 'failed' || st(id) === 'aborted')

  const mk = (key: MilestoneKey, status: string): Milestone => ({ key, status })

  const research = f.summary ? 'done'
    : isFailed('research', 'summary') ? 'failed'
      : (isActive('research') || isActive('summary') || dirHasP(root, '01.research')) ? 'active' : 'waiting'

  const expert = f.insightsMd ? 'done'
    : st('expert') === 'skipped' && !f.insightsMd ? 'skipped'
      : isFailed('expert') ? 'failed'
        : isActive('expert') ? 'active'
          : (f.summary && f.expertProvided) ? 'active'
            : f.summary ? 'gated' : 'waiting'

  const deep = (f.points || indexCount(root, '05.deep-research/index.json') > 0) ? 'done'
    : isFailed('questions', 'deep-research') ? 'failed'
      : (isActive('questions') || isActive('deep-research')) ? 'active'
        : (f.questions || f.deepDir) ? 'active' : 'waiting'

  const points = f.outline ? 'done'
    : isFailed('points') ? 'failed'
      : isActive('points') ? 'active'
        : f.points ? 'gated' : 'waiting'

  const outline = f.article ? 'done'
    : isFailed('outline') ? 'failed'
      : isActive('outline') ? 'active'
        : f.outline ? 'gated' : 'waiting'

  const article = f.accepted ? 'done'
    : isFailed('article') ? 'failed'
      : isActive('article') ? 'active'
        : f.article ? 'gated' : 'waiting'

  return [mk('research', research), mk('expert', expert), mk('deep', deep), mk('points', points), mk('outline', outline), mk('article', article)]
}

export function stageOf(root: string): string {
  const ms = milestonesOf(root)
  const first = ms.find((m) => m.status !== 'done')
  return first ? first.key : 'done'
}

// ---------- 阶段索引回退（index.json 缺失时列目录） ----------

function anglesOf(root: string, kind: 'research' | 'deep' | 'expert') {
  if (kind === 'research') {
    const fromIndex = readJsonSafe<Array<{ id: string; title?: string; file?: string }>>(join(root, '01.research/index.json'))
    if (Array.isArray(fromIndex) && fromIndex.length) return fromIndex
    try {
      return readdirSync(join(root, '01.research'))
        .filter((d) => fileExists(join(root, '01.research', d, 'excerpts.md')))
        .map((d) => ({ id: d, title: d, file: `${d}/excerpts.md` }))
    } catch { return [] }
  }
  if (kind === 'deep') {
    const fromIndex = readJsonSafe<Array<{ id: string; title?: string; file?: string }>>(join(root, '05.deep-research/index.json'))
    if (Array.isArray(fromIndex) && fromIndex.length) return fromIndex
    try {
      return readdirSync(join(root, '05.deep-research'))
        .filter((d) => fileExists(join(root, '05.deep-research', d, 'excerpts.md')))
        .map((d) => ({ id: d, title: d, file: `${d}/excerpts.md` }))
    } catch { return [] }
  }
  const fromIndex = readJsonSafe<Array<{ id: string; title?: string; file?: string }>>(join(root, '03.expert-insights/index.json'))
  if (Array.isArray(fromIndex) && fromIndex.length) return fromIndex
  try {
    return readdirSync(join(root, '03.expert-insights'))
      .filter((d) => d.endsWith('.md'))
      .map((d) => ({ id: d.replace(/\.md$/, ''), title: d.replace(/\.md$/, ''), file: d }))
  } catch { return [] }
}

function sourcesCount(root: string): number {
  try { return readdirSync(join(root, 'materials')).filter((d) => /^SRC-.*\.md$/.test(d)).length } catch { return 0 }
}

// ---------- run.json 骨架 ----------

const SEED_STAGES = [
  { index: 0, id: 'research-init', milestone: 'research', status: 'waiting', started_at: null, finished_at: null },
  { index: 1, id: 'research', milestone: 'research', status: 'waiting', started_at: null, finished_at: null },
  { index: 2, id: 'summary', milestone: 'research', status: 'waiting', started_at: null, finished_at: null },
  { index: 3, id: 'expert', milestone: 'expert', status: 'waiting', started_at: null, finished_at: null },
  { index: 4, id: 'questions', milestone: 'deep', status: 'waiting', started_at: null, finished_at: null },
  { index: 5, id: 'deep-research', milestone: 'deep', status: 'waiting', started_at: null, finished_at: null },
  { index: 6, id: 'points', milestone: 'points', status: 'waiting', started_at: null, finished_at: null },
  { index: 7, id: 'outline', milestone: 'outline', status: 'waiting', started_at: null, finished_at: null },
  { index: 8, id: 'article', milestone: 'article', status: 'waiting', started_at: null, finished_at: null },
]

function writeSeedRunJson(dir: string, unit: string) {
  const f = join(dir, 'run.json')
  if (existsSync(f)) return
  writeJsonAtomic(f, { schema_version: 'obv-1', mas_id: 'auctor', unit, created_at: now(), status: 'queued', trigger: 'ui', runtime: 'dsh', runtime_session_id: null, stages: SEED_STAGES })
}

function writeJsonAtomic(file: string, value: unknown) {
  const tmp = file + '.tmp'
  writeFileSync(tmp, JSON.stringify(value, null, 2))
  renameSync(tmp, file)
}

// ---------- 产物路径校验 ----------

const ARTIFACT_TOP = ['01.research', '02.summary', '03.expert-insights', '04.research-questions', '05.deep-research', '06.commentary-points', '07.outline', '08.article']
const READABLE_TOP = [...ARTIFACT_TOP, 'materials', 'input']

function safeArtifactPath(dir: string, rel: string, tops: string[]): string | null {
  if (typeof rel !== 'string') return null
  if (rel.includes('..') || rel.startsWith('/') || rel.includes('\\')) return null
  const seg = rel.split('/')
  if (!tops.includes(seg[0])) return null
  const joined = join(dir, rel)
  if (!joined.startsWith(dir)) return null
  if (!fileExists(joined)) return null
  return joined
}

// ---------- apply ----------

export function apply(ctx: any, config: any = {}) {
  const base: string = config.dataDir || process.env.AUCTOR_HOME || join(homedir(), '.auctor')
  mkdirSync(base, { recursive: true })

  const INDEX_JSON = join(base, 'index.json')
  const ensureIndex = () => { if (!existsSync(INDEX_JSON)) writeJsonAtomic(INDEX_JSON, { projects: [] }) }
  ensureIndex()

  const readProjects = (): ProjectRecord[] => (readJsonSafe<{ projects?: ProjectRecord[] }>(INDEX_JSON)?.projects) ?? []
  const saveProjects = (list: ProjectRecord[]) => writeJsonAtomic(INDEX_JSON, { projects: list })
  const findProject = (id: string) => readProjects().find((p) => p.id === id)
  const projectDir = (id: string) => join(base, String(id))
  const logError = (tag: string, e: unknown) => {
    try { appendFileSync(join(base, 'host-error.log'), `${new Date().toISOString()} ${tag} ${e instanceof Error ? e.stack || e.message : String(e)}\n`) } catch { /* ignore */ }
  }
  const nextProjectId = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const n = readProjects().filter((p) => p.id.startsWith(today)).length + 1
    return `${today}-${String(n).padStart(3, '0')}`
  }
  const touch = (id: string) => {
    const list = readProjects()
    const p = list.find((x) => x.id === id)
    if (p) { p.updatedAt = now(); saveProjects(list) }
  }

  const isAgentAlive = async (sid: string): Promise<boolean | null> => {
    if (!sid) return null
    const agents = ctx.get?.('agents')
    const a = agents?.get?.(sid)
    if (a && a.status === 'running') return true
    const subs = ctx.get?.('subagents')
    if (subs?.listChildren) {
      try {
        const rows = await subs.listChildren(sid)
        if (Array.isArray(rows) && rows.some((r) => r?.activity === 'running')) return true
      } catch { /* ignore */ }
    }
    return a?.status ? a.status === 'running' : null
  }

  const createProject = (newsLead: string, editorNotes: string): ProjectRecord => {
    const id = nextProjectId()
    const dir = projectDir(id)
    for (const sub of ['materials', 'input', ...ARTIFACT_TOP]) mkdirSync(join(dir, sub), { recursive: true })
    if (existsSync(join(ROOT, 'agents'))) cpSync(join(ROOT, 'agents'), join(dir, 'agents'), { recursive: true })
    if (existsSync(join(ROOT, 'references'))) cpSync(join(ROOT, 'references'), join(dir, 'references'), { recursive: true })
    if (existsSync(join(ROOT, 'pomasa.json'))) cpSync(join(ROOT, 'pomasa.json'), join(dir, 'pomasa.json'))
    writeFileSync(join(dir, 'input', 'news-lead.md'), newsLead + '\n', 'utf8')
    if (editorNotes) writeFileSync(join(dir, 'input', 'editor-notes.md'), editorNotes + '\n', 'utf8')
    writeSeedRunJson(dir, id)
    if (!fileExists(join(dir, 'materials', 'index.md'))) {
      writeFileSync(join(dir, 'materials', 'index.md'), '# Materials Index\n\n| ID | URL | Title | Source Type | Credibility |\n|---|---|---|---|---|\n', 'utf8')
    }
    const record: ProjectRecord = { id, title: firstLine(newsLead), createdAt: now(), updatedAt: now() }
    const list = readProjects()
    list.unshift(record)
    saveProjects(list)
    return record
  }

  const readText = (p: string): string => { try { return readFileSync(p, 'utf8') } catch { return '' } }

  const initialPrompt = (dir: string): string => {
    const hasSummary = fileExists(join(dir, '02.summary/initial-summary.md'))
    const head = `You are the Auctor project session for "${basename(dir)}". Agents blueprints under agents/, references (including the kritik framework under references/domain/kritik/), and pomasa.json are mounted here. Project state is read from run.json and the filesystem. Artifacts already on disk are ground truth: never regenerate or rewrite them unless the user explicitly asks. All reads and writes are confined to this project directory.`
    const branch = !hasSummary
      ? 'The initial research and summary are not done. Read input/news-lead.md (and input/editor-notes.md if it exists and is non-empty), then execute agents/00.orchestrator.md strictly and run Group 00 through the initial summary without stopping.'
      : 'The initial summary is done. Check input/expert/: if transcript files exist, execute agents/10.orchestrator.md strictly and advance through expert processing, question generation and deep research straight to the commentary-points gate; if input/expert/skip.json exists, skip experts; if neither exists, report the current state and wait for instructions. Thereafter follow agents/10.orchestrator.md for the commentary points, outline and article gates.'
    return [head, branch, 'Gates (expert material, commentary points, outline approval, article review) stop for human decision; every other stage runs straight through.', 'Read the relevant orchestrator blueprint and follow it exactly.'].join('\n\n')
  }

  const composePrompt = async (record: ProjectRecord, message: string): Promise<{ prompt: string; live: boolean }> => {
    const live = record.sessionId ? await isAgentAlive(record.sessionId) : null
    if (live === true) return { prompt: message, live: true }
    return { prompt: initialPrompt(projectDir(record.id)) + '\n\n' + message, live: false }
  }

  const projectViewModel = async (p: ProjectRecord) => {
    const dir = projectDir(p.id)
    const running = p.sessionId ? (await isAgentAlive(p.sessionId)) === true : false
    return { ...p, stage: stageOf(dir), milestones: milestonesOf(dir), running }
  }

  const handle = async (endpoint: string, payload: any): Promise<unknown> => {
    switch (endpoint) {
      case 'config.get':
        return { dataRoot: base, mcpSeeded: existsSync(join(base, '.dsh', 'mcp.servers.yml')) }

      case 'project.list':
        return { projects: await Promise.all(readProjects().map(projectViewModel)) }

      case 'project.get': {
        const id = String(payload?.id || '')
        const record = findProject(id)
        if (!record) throw new Error(`project.get: 未知项目 ${id}`)
        const dir = projectDir(id)
        return {
          record,
          running: record.sessionId ? (await isAgentAlive(record.sessionId)) === true : false,
          stage: stageOf(dir),
          milestones: milestonesOf(dir),
          runJson: readJsonSafe(join(dir, 'run.json')),
          files: listFiles(dir),
          texts: {
            newsLead: readText(join(dir, 'input', 'news-lead.md')),
            editorNotes: readText(join(dir, 'input', 'editor-notes.md')),
            runLog: readText(join(dir, 'run-log.md')),
            summary: readText(join(dir, '02.summary', 'initial-summary.md')),
            questions: readText(join(dir, '04.research-questions', 'research-questions.md')),
            points: readText(join(dir, '06.commentary-points', 'commentary-points.md')),
            outline: readText(join(dir, '07.outline', 'outline.md')),
            article: readText(join(dir, '08.article', 'article.md')),
            articleMetadata: readText(join(dir, '08.article', 'article-metadata.md')),
            materialsIndex: readText(join(dir, 'materials', 'index.md')),
          },
          indexes: { research: anglesOf(dir, 'research'), expert: anglesOf(dir, 'expert'), deep: anglesOf(dir, 'deep') },
          counts: { sources: sourcesCount(dir), insights: anglesOf(dir, 'expert').length, deepGroups: anglesOf(dir, 'deep').length },
        }
      }

      case 'project.file': {
        const id = String(payload?.id || '')
        const path = String(payload?.path || '')
        const record = findProject(id)
        if (!record) throw new Error(`project.file: 未知项目 ${id}`)
        const full = safeArtifactPath(projectDir(id), path, READABLE_TOP)
        if (!full) throw new Error('project.file: 非法路径')
        return { content: readText(full) }
      }

      case 'project.pulse': {
        const id = String(payload?.id || '')
        const record = findProject(id)
        if (!record) throw new Error(`project.pulse: 未知项目 ${id}`)
        const running = record.sessionId ? await isAgentAlive(record.sessionId) : null
        return { running: running === true }
      }

      case 'project.create': {
        const newsLead = String(payload?.newsLead || '').trim()
        if (!newsLead) throw new Error('project.create: 需要新闻线索')
        const record = createProject(newsLead, String(payload?.editorNotes || '').trim())
        return { id: record.id, title: record.title, stage: 'research', prompt: initialPrompt(projectDir(record.id)) }
      }

      case 'project.attach': {
        const id = String(payload?.id || '')
        const sessionId = String(payload?.sessionId || '')
        const list = readProjects()
        const p = list.find((x) => x.id === id)
        if (!p) throw new Error(`project.attach: 未知项目 ${id}`)
        p.sessionId = sessionId || undefined
        saveProjects(list)
        return { ok: true }
      }

      case 'project.prompt': {
        const id = String(payload?.id || '')
        const message = String(payload?.message || '')
        const record = findProject(id)
        if (!record) throw new Error(`project.prompt: 未知项目 ${id}`)
        touch(id)
        const { prompt, live } = await composePrompt(record, message)
        return { ok: true, prompt, sessionId: record.sessionId || null, live }
      }

      case 'project.submitExperts': {
        const id = String(payload?.id || '')
        const record = findProject(id)
        if (!record) throw new Error(`project.submitExperts: 未知项目 ${id}`)
        const dir = projectDir(id)
        mkdirSync(join(dir, 'input', 'expert'), { recursive: true })
        if (payload?.skip) {
          writeJsonAtomic(join(dir, 'input', 'expert', 'skip.json'), {})
          return { ok: true, count: 0, skip: true }
        }
        const experts = Array.isArray(payload?.experts) ? payload.experts : []
        let count = 0
        for (const e of experts) {
          if (!e || typeof e !== 'object') continue
          const name = String(e.name || 'expert').trim()
          const role = String(e.role || '').trim()
          const transcript = String(e.transcript || '').trim()
          if (!transcript) continue
          const slug = sanitizeSlug(name)
          writeFileSync(join(dir, 'input', 'expert', `${slug}.raw.md`), `Name: ${name}\nRole: ${role}\n\n${transcript}\n`, 'utf8')
          count++
        }
        touch(id)
        return { ok: true, count }
      }

      case 'project.saveArtifact': {
        const id = String(payload?.id || '')
        const path = String(payload?.path || '')
        const content = String(payload?.content ?? '')
        const record = findProject(id)
        if (!record) throw new Error(`project.saveArtifact: 未知项目 ${id}`)
        if (content.length > 2_000_000) throw new Error('project.saveArtifact: 内容过大')
        const full = safeArtifactPath(projectDir(id), path, ARTIFACT_TOP)
        if (!full) throw new Error('project.saveArtifact: 非法路径')
        writeFileSync(full, content, 'utf8')
        touch(id)
        return { ok: true }
      }

      case 'project.accept': {
        const id = String(payload?.id || '')
        const record = findProject(id)
        if (!record) throw new Error(`project.accept: 未知项目 ${id}`)
        const dir = projectDir(id)
        mkdirSync(join(dir, '08.article'), { recursive: true })
        writeJsonAtomic(join(dir, '08.article', 'accepted.json'), { at: now(), title: record.title })
        touch(id)
        return { ok: true }
      }

      case 'project.rename': {
        const id = String(payload?.id || '')
        const title = String(payload?.title || '').trim()
        if (!title) throw new Error('project.rename: 需要标题')
        const list = readProjects()
        const p = list.find((x) => x.id === id)
        if (!p) throw new Error(`project.rename: 未知项目 ${id}`)
        p.title = title
        p.updatedAt = now()
        saveProjects(list)
        return { ok: true }
      }

      case 'project.delete': {
        const id = String(payload?.id || '')
        const list = readProjects()
        const p = list.find((x) => x.id === id)
        if (!p) throw new Error(`project.delete: 未知项目 ${id}`)
        try { rmSync(projectDir(id), { recursive: true, force: true }) } catch { /* ignore */ }
        saveProjects(list.filter((x) => x.id !== id))
        return { ok: true, id }
      }

      default:
        throw new Error('dsh-auctor: 未知端点 ' + endpoint)
    }
  }

  const connection = ctx.connection || ctx.get?.('connection')
  if (connection && connection.rpc && connection.rpc.handle) {
    connection.rpc.handle('/auctor', async (endpoint: string, cp: any) => {
      try {
        return { ok: true, value: await handle(endpoint, cp || {}) }
      } catch (e) {
        logError(`rpc:${endpoint}`, e)
        return { ok: false, error: { code: 'internal', message: String((e as Error)?.message || e), details: {} } }
      }
    }, { authority: 'loopback' })
  }

  const webServer = ctx.webServer || ctx.get?.('webServer')
  if (webServer && webServer.register) {
    webServer.register({
      kind: 'exact',
      path: '/auctor/diag',
      method: 'POST',
      handler: async (req: any, res: any) => {
        let body = ''
        req.on?.('data', (c: any) => { body += c })
        req.on?.('end', () => {
          try { appendFileSync(join(base, 'diag.jsonl'), JSON.stringify({ t: Date.now(), ...JSON.parse(body || '{}') }) + '\n') } catch { /* ignore */ }
          res.writeHead?.(204)
          res.end?.()
        })
      },
    })
    webServer.register({
      kind: 'exact',
      path: '/auctor/asset/meme.jpg',
      handler: (_req: unknown, res: any) => {
        try {
          const buf = readFileSync(join(ROOT, 'assets', 'meme.jpg'))
          res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' })
          res.end(buf)
        } catch {
          res.writeHead(404, { 'content-type': 'text/plain' })
          res.end('not found')
        }
      },
    })
  }

  // 工作区 MCP 种子 + 挂载（best-effort，不阻塞启动）。
  try { ensureMcpSeed(base) } catch { /* ignore */ }
  loadMcpServers(ctx, base).catch(() => { /* best-effort */ })

  return { dataRoot: base }
}

// L1 离线单测句柄
export const _test = { firstLine, sanitizeSlug, milestonesOf, stageOf, listFiles, readJsonSafe, MILESTONE_KEYS }