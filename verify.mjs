// Auctor offline smoke：L1 纯函数 + L2 宿主集成（mock ctx 驱动）。
// 不模拟 agentLoop/真实网络：会话创建与驱动是 CLIENT 的职责（pomasa driveSession
// 模式），本文件只测宿主的文件事实、里程碑视图、门标记、路径白名单与运行判定。
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, _test } from './lib/index.js'

const ERRORS = []
async function check(name, fn) {
  try { await fn(); console.log('  ✓', name) } catch (e) { ERRORS.push({ name, e }); console.error('  ✗', name, '—', (e && e.stack) || e) }
}

function tmpDir() { return mkdtempSync(join(tmpdir(), 'auctor-verify-')) }

async function bootFake(dataDir) {
  let handler = null
  const running = new Map()
  const ctx = {
    get: (n) => {
      if (n === 'agents') return { get: (sid) => ({ status: running.get(sid) ? 'running' : 'idle' }) }
      if (n === 'subagents') return null
      return null
    },
    connection: { rpc: { handle: (_p, fn) => { handler = fn } } },
  }
  apply(ctx, { dataDir })
  const call = async (ep, payload) => { const r = await handler(ep, payload || {}); if (!r.ok) throw new Error(r.error.message); return r.value }
  const callErr = async (ep, payload) => {
    const r = await handler(ep, payload || {})
    if (r.ok) throw new Error('expected error, got ok')
    if (typeof (r.error && r.error.message) !== 'string') throw new Error('error.message not a string')
    return r.error.message
  }
  return { call, callErr, running, setRunning: (sid, v) => running.set(sid, v) }
}

const LEAD = 'Cuba holds 100 years of Fidel memorial activities'

// ---------- L1 纯函数 ----------
{
  console.log('L1 · pure helpers')
  await check('firstLine 取首个非空行并去首尾空白', () => {
    const s = _test.firstLine('  <p>hi</p>  \n\nsecond\n')
    if (s !== '<p>hi</p>') throw new Error('got ' + s)
  })
  await check('firstLine 超长截断加省略号', () => {
    const long = 'x'.repeat(100)
    const s = _test.firstLine(long, 80)
    if (s.length !== 81 || !s.endsWith('…')) throw new Error('len ' + s.length)
  })
  await check('sanitizeSlug 压空格转中杠、保中文', () => {
    const s = _test.sanitizeSlug('  Prof. 王 Wang / (II)  ')
    if (s !== 'prof-王-wang-ii') throw new Error('got ' + s)
  })
  await check('sanitizeSlug 空名回落 expert', () => {
    if (_test.sanitizeSlug('') !== 'expert') throw new Error('fallback failed')
  })
  await check('milestonesOf 空项目全 waiting', () => {
    const root = tmpDir()
    const ms = _test.milestonesOf(root)
    const core = ms.slice(1)
    if (core.length !== 6 || ms[0].key !== 'confirm' || core.some((m) => m.status !== 'waiting')) throw new Error(JSON.stringify(ms))
    rmSync(root, { recursive: true, force: true })
  })
  await check('milestonesOf summary 之后 expert gated', () => {
    const root = tmpDir()
    mkdirSync(join(root, '02.summary'), { recursive: true })
    writeFileSync(join(root, '02.summary', 'initial-summary.md'), 's')
    const core = _test.milestonesOf(root).slice(1)
    if (core[0].status !== 'done' || core[1].status !== 'gated' || core[3].status !== 'waiting') throw new Error(JSON.stringify(core))
    rmSync(root, { recursive: true, force: true })
  })
  await check('milestonesOf accepted 之后 article done', () => {
    const root = tmpDir()
    mkdirSync(join(root, '08.article'), { recursive: true })
    writeFileSync(join(root, '08.article', 'article.md'), 'a')
    let core = _test.milestonesOf(root).slice(1)
    if (core[5].status !== 'gated') throw new Error('article: ' + core[5].status)
    writeFileSync(join(root, '08.article', 'accepted.json'), '{}')
    core = _test.milestonesOf(root).slice(1)
    if (core[5].status !== 'done') throw new Error('after accept: ' + core[5].status)
    rmSync(root, { recursive: true, force: true })
  })
}

// ---------- L2 宿主集成 ----------
{
  console.log('L2 · host integration (mock ctx)')
  const dir = tmpDir()
  const h = await bootFake(dir)

  await check('config.get 返回 dataRoot 且已种子 MCP', async () => {
    const c = await h.call('config.get')
    if (c.dataRoot !== dir) throw new Error('dataRoot mismatch')
    if (!c.mcpSeeded) throw new Error('mcp.servers.yml not seeded')
    if (!existsSync(join(dir, '.dsh', 'mcp.servers.yml'))) throw new Error('seed file missing')
  })

  await check('project.create 需要新闻线索', async () => {
    const msg = await h.callErr('project.create', {})
    if (!/新闻线索/.test(msg)) throw new Error(msg)
  })

  let rec
  await check('project.create 全量脚手架', async () => {
    rec = await h.call('project.create', { newsLead: LEAD, editorNotes: '角度：中古建交' })
    const pd = join(dir, rec.id)
    if (!/^\d{8}-\d{3}$/.test(rec.id)) throw new Error('id ' + rec.id)
    if (!rec.prompt.includes('input/brief.md')) throw new Error('prompt')
    for (const need of ['agents/00.orchestrator.md', 'references/domain/kritik/KR-01-marxist-framework.md', 'pomasa.json', 'input/news-lead.md', 'run.json', 'materials/index.md']) {
      if (!existsSync(join(pd, need))) throw new Error('missing ' + need)
    }
    if (readFileSync(join(pd, 'input', 'news-lead.md'), 'utf8').trim() !== LEAD) throw new Error('lead text')
  })

  await check('index.json 登记且宿主不建会话', async () => {
    const idx = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    if (idx.projects.length !== 1) throw new Error('project count')
    if (idx.projects[0].sessionId) throw new Error('host must not create session')
  })

  await check('prompt 无会话时附续做指令', async () => {
    const r = await h.call('project.prompt', { id: rec.id, message: '干下去' })
    if (r.live) throw new Error('should be cold')
    if (!r.prompt.includes('input/brief.md') || !r.prompt.includes('干下去')) throw new Error('compose failed')
  })

  await check('prompt 会话存活时直传消息', async () => {
    await h.call('project.attach', { id: rec.id, sessionId: 'sess-1' })
    h.setRunning('sess-1', true)
    const r = await h.call('project.prompt', { id: rec.id, message: '继续' })
    if (!r.live || r.prompt !== '继续') throw new Error('live compose failed: ' + r.live)
  })

  await check('prompt 会话闲置时重新附续做指令', async () => {
    h.setRunning('sess-1', false)
    const r = await h.call('project.prompt', { id: rec.id, message: '继续' })
    if (r.live || !r.prompt.includes('input/brief.md')) throw new Error('idle compose failed')
  })

  await check('pulse 跟随 agent 注册表', async () => {
    h.setRunning('sess-1', true)
    if (!(await h.call('project.pulse', { id: rec.id })).running) throw new Error('should run')
    h.setRunning('sess-1', false)
    if ((await h.call('project.pulse', { id: rec.id })).running) throw new Error('should idle')
  })

  const pd = join(dir, rec.id)
  await check('里程碑：summary → expert gated → 素材就位 active', async () => {
    mkdirSync(join(pd, '02.summary'), { recursive: true })
    writeFileSync(join(pd, '02.summary', 'initial-summary.md'), 's')
    let core = _test.milestonesOf(pd).slice(1)
    if (core[0].status !== 'done' || core[1].status !== 'gated') throw new Error(JSON.stringify(core))
    await h.call('project.submitExperts', { id: rec.id, experts: [{ name: 'Prof A', role: 'X', transcript: 't' }] })
    core = _test.milestonesOf(pd).slice(1)
    if (core[1].status !== 'active') throw new Error(JSON.stringify(core))
  })

  await check('submitExperts 落盘 + skip 标记', async () => {
    const f = join(pd, 'input', 'expert', 'prof-a.raw.md')
    if (!existsSync(f)) throw new Error('raw missing')
    if (!readFileSync(f, 'utf8').includes('Prof A')) throw new Error('content')
    await h.call('project.submitExperts', { id: rec.id, skip: true })
    if (!existsSync(join(pd, 'input', 'expert', 'skip.json'))) throw new Error('skip marker')
  })

  await check('里程碑：深度研究 → 要点门 → 提纲门 → 成稿门 → 定稿', async () => {
    mkdirSync(join(pd, '03.expert-insights'), { recursive: true })
    writeFileSync(join(pd, '03.expert-insights', 'prof-a.md'), 'i')
    writeFileSync(join(pd, '04.research-questions', 'research-questions.md'), 'q')
    mkdirSync(join(pd, '05.deep-research', 'Q1'), { recursive: true })
    writeFileSync(join(pd, '05.deep-research', 'Q1', 'excerpts.md'), 'd')
    writeFileSync(join(pd, '05.deep-research', 'index.json'), JSON.stringify([{ id: 'Q1', title: 'G1', file: 'Q1/excerpts.md' }]))
    let core = _test.milestonesOf(pd).slice(1)
    if (core[1].status !== 'done' || core[2].status !== 'done') throw new Error('deep: ' + JSON.stringify(core))
    writeFileSync(join(pd, '06.commentary-points', 'commentary-points.md'), 'p')
    core = _test.milestonesOf(pd).slice(1)
    if (core[3].status !== 'gated') throw new Error('points gated')
    writeFileSync(join(pd, '07.outline', 'outline.md'), 'o')
    core = _test.milestonesOf(pd).slice(1)
    if (core[3].status !== 'done' || core[4].status !== 'gated') throw new Error(JSON.stringify(core))
    writeFileSync(join(pd, '08.article', 'article.md'), 'a')
    core = _test.milestonesOf(pd).slice(1)
    if (core[4].status !== 'done' || core[5].status !== 'gated') throw new Error(JSON.stringify(core))
    await h.call('project.accept', { id: rec.id })
    core = _test.milestonesOf(pd).slice(1)
    if (core[5].status !== 'done') throw new Error('article after accept')
  })

  await check('saveArtifact 写回 + 非法路径拒绝', async () => {
    await h.call('project.saveArtifact', { id: rec.id, path: '06.commentary-points/commentary-points.md', content: '# edited\n' })
    if (readFileSync(join(pd, '06.commentary-points', 'commentary-points.md'), 'utf8') !== '# edited\n') throw new Error('not written')
    try { await h.call('project.saveArtifact', { id: rec.id, path: '../evil.md', content: 'x' }); throw new Error('traversal allowed') } catch (e) { if (e.message === 'traversal allowed') throw e }
    try { await h.call('project.saveArtifact', { id: rec.id, path: 'run.json', content: 'x' }); throw new Error('non-artifact allowed') } catch (e) { if (e.message === 'non-artifact allowed') throw e }
    try { await h.call('project.file', { id: rec.id, path: 'materials/../run.json' }); throw new Error('file traversal allowed') } catch (e) { if (e.message === 'file traversal allowed') throw e }
    try { await h.call('project.file', { id: rec.id, path: 'config.get' }); throw new Error('file non-path allowed') } catch (e) { if (e.message === 'file non-path allowed') throw e }
  })

  await check('project.get 全量视图', async () => {
    const g = await h.call('project.get', { id: rec.id })
    if (g.stage !== 'done') throw new Error('stage ' + g.stage)
    if (g.milestones.length !== 7) throw new Error('milestones')
    if (!g.texts.summary || !g.texts.points || !g.texts.article) throw new Error('texts')
    if (g.indexes.deep.length !== 1) throw new Error('deep index')
    if (g.counts.sources < 0) throw new Error('counts')
  })

  await check('project.list 视图', async () => {
    const l = await h.call('project.list')
    if (l.projects.length !== 1 || l.projects[0].stage !== 'done') throw new Error(JSON.stringify(l))
    if (!Array.isArray(l.projects[0].milestones)) throw new Error('milestones missing')
  })

  await check('rename 只动 index', async () => {
    await h.call('project.rename', { id: rec.id, title: '新标题' })
    const idx = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    if (idx.projects[0].title !== '新标题') throw new Error('not renamed')
    if (!existsSync(join(pd, 'input', 'news-lead.md'))) throw new Error('touched dir')
  })

  await check('delete 移除目录与索引', async () => {
    await h.call('project.delete', { id: rec.id })
    if (existsSync(pd)) throw new Error('dir left')
    const idx = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    if (idx.projects.length !== 0) throw new Error('index left')
  })

  rmSync(dir, { recursive: true, force: true })
}

if (ERRORS.length) {
  console.error(`\nverify FAILED: ${ERRORS.length} check(s)`)
  process.exit(1)
}
console.log('\nverify OK')