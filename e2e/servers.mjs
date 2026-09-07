// L4a e2e: seed a deterministic fixture ~/.auctor (project at the commentary-
// points gate), boot the real dsh web host on a hermetic temp DSH_HOME with the
// plugin mounted from this checkout, and keep serving until Playwright kills us.
// Never touches the real ~/.dsh. No LLM needed: every UI state derives from
// file facts.
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.AUCTOR_E2E_PORT || 43123)
const HOME = mkdtempSync(join(tmpdir(), 'auctor-e2e-'))
const DSH_HOME = mkdtempSync(join(tmpdir(), 'auctor-e2e-dsh-'))
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function write(dir, rel, content) {
  const p = join(dir, rel)
  mkdirSync(join(dir, ...rel.split('/').slice(0, -1)), { recursive: true })
  writeFileSync(p, content)
}

const RUN_JSON = {
  schema_version: 'obv-1', mas_id: 'auctor', unit: '2026-09-05-001',
  created_at: new Date().toISOString(), status: 'running', trigger: 'ui', runtime: 'dsh',
  stages: [
    { index: 0, id: 'research-init', milestone: 'research', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
    { index: 1, id: 'research', milestone: 'research', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
    { index: 2, id: 'summary', milestone: 'research', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
    { index: 3, id: 'expert', milestone: 'expert', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
    { index: 4, id: 'questions', milestone: 'deep', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
    { index: 5, id: 'deep-research', milestone: 'deep', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
    { index: 6, id: 'points', milestone: 'points', status: 'gated', started_at: null, finished_at: new Date().toISOString() },
    { index: 7, id: 'outline', milestone: 'outline', status: 'waiting', started_at: null, finished_at: null },
    { index: 8, id: 'article', milestone: 'article', status: 'waiting', started_at: null, finished_at: null },
  ],
}

function seedFixture() {
  const id = '2026-09-05-001'
  const root = join(HOME, id)
  write(root, 'input/news-lead.md', 'Cuba holds 100 years of Fidel memorial activities\n')
  write(root, 'input/expert/prof-a.raw.md', 'Name: Prof A\nRole: Historian\n\nnotes\n')
  write(root, 'materials/index.md', '# Materials Index\n\n| ID | URL | Title | Source Type | Credibility |\n|---|---|---|---|---|\n| SRC-A-001 | https://example.com | Example | Article | High |\n')
  write(root, 'materials/SRC-A-001.md', '# [SRC-A-001] Example\n\n**Source URL**: https://example.com\n\nBody.\n')
  write(root, '01.research/A-event-overview/excerpts.md', '# Event Overview — Relevant Excerpts\n\n## [M-A-001] Fidel centennial\n\n**Source**: SRC-A-001\n**Relevance**: Key event facts\n\n> Excerpt content.\n')
  write(root, '01.research/index.json', JSON.stringify([{ id: 'A-event-overview', title: 'Event Overview', file: 'A-event-overview/excerpts.md', producer: '01.researcher' }]))
  write(root, '02.summary/initial-summary.md', '# Initial Event Summary\n\n## News Lead\n\nCuba holds Fidel centennial.\n\n## Contradictions and Tensions\n\n### Principal Contradiction\n\nMemory politics vs material need.\n\n- **Attribution:** A contested attribution that needs evidence.\n- A companion bullet.\n\n## Key Figures\n\n| Field | Value |\n|---|---|\n| Attendance | Thousands |\n| Events | 100+ |\n')
  write(root, '02.summary/index.json', JSON.stringify([{ id: 'summary', title: 'Initial Event Summary', file: 'initial-summary.md', producer: '02.summarizer' }]))
  write(root, '03.expert-insights/prof-a.md', '# Expert Insight: Prof A\n\n## Core Points\n\n1. The centennial is a political event.\n')
  write(root, '03.expert-insights/index.json', JSON.stringify([{ id: 'prof-a', title: 'Prof A', file: 'prof-a.md', producer: '11.expert-processor' }]))
  write(root, '04.research-questions/research-questions.md', '# Research Questions\n\n## Category A: Questions Inferred from Existing Research\n\n### Background\n\n1. What happened?\n\n## Category B: Gap Questions for Deep Research\n\n### Research Group Q1: Diplomacy\n\n**Priority**: High\n\n1. How do Latin American states respond?\n')
  write(root, '04.research-questions/index.json', JSON.stringify([{ id: 'questions', title: 'Research Questions', file: 'research-questions.md', producer: '12.question-generator' }]))
  write(root, '05.deep-research/Q1/excerpts.md', '# Diplomacy — Research Excerpts\n\n## Question: How do Latin American states respond?\n\n### [Q1-001] Regional statements\n\n**Source**: SRC-Q1-001\n\n> Statement content.\n')
  write(root, '05.deep-research/index.json', JSON.stringify([{ id: 'Q1', title: 'Diplomacy', file: 'Q1/excerpts.md', producer: '13.deep-researcher' }]))
  write(root, '06.commentary-points/commentary-points.md', '# Commentary Points\n\n## Overall Analytical Frame\n\nMemory politics inside US-Cuba relations.\n\n## Commentary Points\n\n### Point 1: Centennial as anticolonial symbol [CORE]\n\n**Claim**: The centennial mobilizes anti-imperialist memory.\n**Factual Supports**:\n- [M-A-001]: key facts\n**Reader Value**: Explains the symbolism.\n**Anticipated Criticism**: Dismissed as nostalgia.\n**Narrative Strategy**: Lead with the rally scene.\n')
  write(root, '06.commentary-points/index.json', JSON.stringify([{ id: 'points', title: 'Commentary Points', file: 'commentary-points.md', producer: '14.commentary-designer' }]))
  write(root, 'run.json', JSON.stringify(RUN_JSON, null, 2))
  write(root, 'run-log.md', '# Run Log — 2026-09-05-001\n\n## Run Metadata\n\n- **News Lead**: Cuba holds 100 years of Fidel memorial activities\n')
  write(HOME, 'index.json', JSON.stringify({
    projects: [
      { id: '2026-09-05-001', title: 'Fidel centennial commentary', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2026-09-05-002', title: 'Confirmed brief · research running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  }, null, 2))
}

function seedBriefFixture() {
  const id = '2026-09-05-002'
  const root = join(HOME, id)
  write(root, 'input/news-lead.md', 'Cuba holds 100 years of Fidel memorial activities\n')
  write(root, 'input/brief.md', 'Title: Fidel centennial brief\nSummary: Cuba nationwide 100-year memorial activities for Fidel Castro.\n')
  write(root, 'materials/index.md', '# Materials Index\n\n| ID | URL | Title | Source Type | Credibility |\n|---|---|---|---|---|\n')
  write(root, 'run.json', JSON.stringify({
    schema_version: 'obv-1', mas_id: 'auctor', unit: id,
    created_at: new Date().toISOString(), status: 'running', trigger: 'ui', runtime: 'dsh',
    stages: [
      { index: 0, id: 'brief', milestone: 'confirm', status: 'completed', started_at: null, finished_at: new Date().toISOString() },
      { index: 1, id: 'research-init', milestone: 'research', status: 'active', started_at: new Date().toISOString(), finished_at: null },
      { index: 2, id: 'research', milestone: 'research', status: 'active', started_at: new Date().toISOString(), finished_at: null },
      { index: 3, id: 'summary', milestone: 'research', status: 'waiting', started_at: null, finished_at: null },
      { index: 4, id: 'expert', milestone: 'expert', status: 'waiting', started_at: null, finished_at: null },
      { index: 5, id: 'questions', milestone: 'deep', status: 'waiting', started_at: null, finished_at: null },
      { index: 6, id: 'deep-research', milestone: 'deep', status: 'waiting', started_at: null, finished_at: null },
      { index: 7, id: 'points', milestone: 'points', status: 'waiting', started_at: null, finished_at: null },
      { index: 8, id: 'outline', milestone: 'outline', status: 'waiting', started_at: null, finished_at: null },
      { index: 9, id: 'article', milestone: 'article', status: 'waiting', started_at: null, finished_at: null },
    ],
  }, null, 2))
}

seedFixture()
seedBriefFixture()
execFileSync('dsh', ['--profile', 'web', '--help'], { env: { ...process.env, DSH_HOME }, stdio: 'ignore' })
// 坞先装（bundles 先于 auctor，register 发生在 auctor apply 之前，auctor 才入坞）
execFileSync('dsh', ['plugin', '--profile', 'web', 'add', join(ROOT, '..', 'dsh-app-dock')], { env: { ...process.env, DSH_HOME }, stdio: 'ignore' })
execFileSync('dsh', ['plugin', '--profile', 'web', 'add', ROOT], { env: { ...process.env, DSH_HOME }, stdio: 'ignore' })
console.log('fixture home:', HOME)

const dsh = spawn('dsh', ['--profile', 'web', '--no-open', '--port', String(PORT)], {
  env: { ...process.env, AUCTOR_HOME: HOME, DSH_HOME },
  stdio: ['ignore', 'inherit', 'inherit'],
})

const log = (m) => console.log('[e2e server] ' + m)
async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) { log('web host ready'); return }
    } catch { /* 未就绪，继续等 */ }
    await new Promise((r) => setTimeout(r, 1000))
  }
  log('FAIL: web host did not come up')
  dsh.kill()
  process.exit(1)
}
ready()

dsh.on('exit', (code) => {
  log('dsh exited ' + code)
  process.exit(code || 0)
})
process.on('SIGTERM', () => dsh.kill())
process.on('SIGINT', () => dsh.kill())
process.on('exit', () => {
  try { rmSync(DSH_HOME, { recursive: true, force: true }) } catch { /* 忽略 */ }
})

// 保持进程存活直到被 Playwright 终止；输出路径便于调试。
process.stdin.resume()
export { HOME }