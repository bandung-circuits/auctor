// dsh-auctor — Client half (browser)。
// 工作台形态照 pictor：footer 按钮开 shell.overlay 面板，左栏项目列表、右栏
// 六段流水线。GUI 只做两件事：查看信息、规整输入；一切行为交给项目会话。
// 会话由 CLIENT 经 dsh workspaces/sessions 服务创建与驱动（driveSession 模式）。
const inject = ['slots', 'connection', 'workspaces', 'sessions']
const React = require('react')
const h = React.createElement

const RPC = '/auctor'

// ---------- I18N ----------

const I18N = {
  zh: {
    appName: 'Auctor',
    newProject: '新建项目', newNav: '新建', newsLeadLabel: '新闻线索（一句话或网址）', newsLeadHint: '例如：Cuba hold 100 years of Fidel memorial activities',
    editorNotesLabel: '编辑注记（可选）', editorNotesHint: '你的初步判断、想切入的角度；留空亦可',
    create: '创建并开始', creating: '创建中…', createFailed: '创建失败',
    emptyNav: '暂无项目', newFirst: '从一条新闻线索开始你的评论。', newFirstHint: '点左上角「新建项目」，Auctor 会跑完快速研究与摘要，然后等你提供专家访谈素材。',
    stageResearch: '快速研究', stageExpert: '专家素材', stageDeep: '深度研究', stagePoints: '评论要点', stageOutline: '提纲', stageArticle: '成稿',
    stWaiting: '等待', stActive: '进行中', stGated: '待你决定', stDone: '完成', stFailed: '失败', stSkipped: '跳过',
    runningMarker: '运行中', refreshHint: '会话已停，去讨论面板发一句话续跑',
    summaryTitle: '初始摘要', anglesTitle: '十角度研究', anglesHint: '展开查看各角度的摘录（材料库在下方）',
    noAngles: '研究进行中，角度尚未落盘',
    expertGateTitle: '专家访谈素材', expertGateHint: '把访谈转录（或笔记）逐位提交。此后系统会自动跑完专家结构、问题生成与深度研究，直达评论要点门。',
    expertGateDone: '专家素材已处理，深度研究已自动推进。',
    expertName: '姓名', expertRole: '身份/头衔', expertTranscript: '访谈原文（转录或笔记）', addExpert: '添加一位专家', submitExperts: '完成素材，开始深度分析', skipExperts: '跳过专家访谈', skipConfirm: '确定跳过专家访谈？跳过即不再从专家处获取信息。',
    deepQuestions: '研究问题', deepGroups: '深度研究分组', deepHint: '问题生成与深研全自动。若想改动研究问题，去讨论面板说一句。',
    noDeep: '深度研究尚未产出。',
    pointsTitle: '评论要点', pointsHint: '审读这几条论点。可逐处编辑后「保存定稿」；想换方向就在讨论面板里说。', confirmPoints: '确认要点，生成提纲',
    outlineTitle: '文章提纲', outlineHint: '审读章节结构。可编辑后「保存定稿」；想换结构在讨论面板里说。', confirmOutline: '确认提纲，开始写作',
    articleTitle: '成稿', articleHint: '这是可发布的初稿。可接受定稿，或在讨论面板发起修订。', acceptArticle: '定稿收口', acceptedMsg: '已收口。',
    edit: '编辑', saveDraft: '保存编辑', saved: '已保存', downloading: '下载中…',
    downloadMd: '下载 Markdown', viewAll: '查看全部', materialTitle: '材料库', materialHint: 'materials/ 收录本项目的全部原文来源。',
    discussion: '讨论', discussHint: '给项目会话一句话：补充背景、要求调研究问题、换个方向重做要点/提纲/文章。你的决策会在同一会话继续。',
    discussPlaceholder: 'e.g. 把要点 3 换成侧重债务条款的博弈…', send: '发送',
    rename: '改名', deleteProject: '删除项目', delConfirm: '彻底删除项目「{t}」？项目目录与会话都将移除。',
    namePlaceholder: '项目标题', loading: '加载中…', error: '出错',
    gates: '四道门', markers: '阶段条可点击回看；修改已完成的上游产物后，下游需要你在讨论面板发起重做。',
  },
  en: {
    appName: 'Auctor', newProject: 'New project', newNav: 'New', newsLeadLabel: 'News lead (one sentence or a URL)', newsLeadHint: 'e.g. Cuba hold 100 years of Fidel memorial activities',
    editorNotesLabel: 'Editor notes (optional)', editorNotesHint: 'Your initial observations or angles',
    create: 'Create & start', creating: 'Creating…', createFailed: 'Create failed',
    emptyNav: 'No projects', newFirst: 'Start a commentary from one news lead.', newFirstHint: 'Click "New project" top-left. Auctor runs quick research and summary, then waits for your expert material.',
    stageResearch: 'Research', stageExpert: 'Experts', stageDeep: 'Deep research', stagePoints: 'Points', stageOutline: 'Outline', stageArticle: 'Article',
    stWaiting: 'Waiting', stActive: 'Running', stGated: 'Your call', stDone: 'Done', stFailed: 'Failed', stSkipped: 'Skipped',
    runningMarker: 'running', refreshHint: 'Session is idle. Send a line in the discussion panel to resume.',
    summaryTitle: 'Initial summary', anglesTitle: '10-angle research', anglesHint: 'Expand each angle to read its excerpts (materials below).',
    noAngles: 'Research in progress, excerpts not on disk yet.',
    expertGateTitle: 'Expert material', expertGateHint: 'Submit each interview transcript or notes. Then Auctor runs expert processing, question generation and deep research automatically, straight to the commentary-points gate.',
    expertGateDone: 'Expert material processed; deep research advanced automatically.',
    expertName: 'Name', expertRole: 'Role / affiliation', expertTranscript: 'Raw interview (transcript or notes)', addExpert: 'Add an expert', submitExperts: 'Start deep analysis', skipExperts: 'Skip experts', skipConfirm: 'Skip expert interviews? Their input will be absent.',
    deepQuestions: 'Research questions', deepGroups: 'Deep research groups', deepHint: 'Questions and deep research run automatically. To adjust the questions, say so in the discussion panel.',
    noDeep: 'Deep research not produced yet.',
    pointsTitle: 'Commentary points', pointsHint: 'Review the argumentative backbone. Edit inline then "Save final"; to change direction, say so in the discussion panel.', confirmPoints: 'Confirm points, draft outline',
    outlineTitle: 'Article outline', outlineHint: 'Review the section structure. Edit then "Save final"; structural changes via the discussion panel.', confirmOutline: 'Confirm outline, start writing',
    articleTitle: 'Article', articleHint: 'This is a publishable first draft. Accept it, or request revisions in the discussion panel.', acceptArticle: 'Accept & close', acceptedMsg: 'Closed.',
    edit: 'Edit', saveDraft: 'Save edit', saved: 'Saved', downloading: 'Downloading…',
    downloadMd: 'Download Markdown', viewAll: 'Show all', materialTitle: 'Materials', materialHint: 'materials/ holds the full-text sources of this project.',
    discussion: 'Discussion', discussHint: 'A line to the project session: add context, adjust questions, redo points/outline/article in a new direction. Decisions continue the same session.',
    discussPlaceholder: 'e.g. Replace point 3 with the debt-clause bargaining angle…', send: 'Send',
    rename: 'Rename', deleteProject: 'Delete project', delConfirm: 'Delete project "{t}" permanently? Directory and session will be removed.',
    namePlaceholder: 'Project title', loading: 'Loading…', error: 'Error',
    gates: 'Gates', markers: 'The stage strip is clickable; after editing upstream artifacts, trigger a redo chain from the discussion panel.',
  },
}

function readBandungLang() {
  try {
    if (typeof window !== 'undefined' && window.__dshAppDock__ && window.__dshAppDock__.lang) return window.__dshAppDock__.lang.get()
    return typeof localStorage !== 'undefined' ? (localStorage.getItem('bandung-lang') === 'en' ? 'en' : 'zh') : 'zh'
  } catch { return 'zh' }
}
const langStore = {
  val: readBandungLang(),
  subs: new Set(),
  emit() { for (const f of this.subs) f() },
  set(v) {
    this.val = v === 'en' ? 'en' : 'zh'
    try { localStorage.setItem('bandung-lang', this.val) } catch { /* ignore */ }
    if (typeof window !== 'undefined' && window.__dshAppDock__ && window.__dshAppDock__.lang) window.__dshAppDock__.lang.set(this.val)
    this.emit()
  },
  subscribe(f) { this.subs.add(f); return () => { this.subs.delete(f) } },
}
function useLang() {
  const [v, setV] = React.useState(langStore.val)
  React.useEffect(() => langStore.subscribe(() => setV(langStore.val)), [])
  return v
}
function t(key, vars) {
  let text = (I18N[langStore.val] && I18N[langStore.val][key]) || I18N.zh[key] || key
  if (vars) { for (const k of Object.keys(vars)) text = text.replace('{' + k + '}', String(vars[k])) }
  return text
}

// ---------- 工具 ----------

function rpc(ctx, endpoint, payload) {
  return ctx.connection.rpc.call(RPC, endpoint, payload === undefined ? {} : payload).then((result) => {
    if (result && result.ok === false) {
      const msg = result.error && result.error.message ? result.error.message : String(result.error || 'RPC 调用失败')
      throw new Error(msg)
    }
    return result && result.ok === true ? result.value : result
  })
}

function diag(ctx, note) {
  let body = { note, ua: '', href: '' }
  try { body.ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : '' } catch { /* ignore */ }
  try { body.href = typeof location !== 'undefined' ? location.href.slice(0, 80) : '' } catch { /* ignore */ }
  try { fetch('/auctor/diag', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {}) } catch { /* ignore */ }
}

// 会话创建与驱动走 dsh 的 workspace 流程（照 pictor）：宿主只出 prompt。
// dsh ≥ 0.1.2-alpha.1 把 connectWorkspace 从 workspaces 移到 uiWorkspace。
function sessionConnectFn(ctx, ws) {
  let uiWs = null
  try { uiWs = ctx.uiWorkspace || ((ctx.get && ctx.get('uiWorkspace')) || null) } catch { /* ignore */ }
  return (uiWs && typeof uiWs.connectWorkspace === 'function')
    ? uiWs.connectWorkspace.bind(uiWs)
    : (ws && typeof ws.connectWorkspace === 'function') ? ws.connectWorkspace.bind(ws) : null
}

async function auctorWorkspace(ctx) {
  const ws = ctx.workspaces || (ctx.get && ctx.get('workspaces'))
  const base = await rpc(ctx, 'config.get').then((c) => (c && c.dataRoot) || '')
  if (!ws) throw new Error('会话服务不可用（workspaces）')
  const items = () => {
    try {
      const snap = ws.list && typeof ws.list.getSnapshot === 'function' ? ws.list.getSnapshot() : null
      return snap && Array.isArray(snap.items) ? snap.items : []
    } catch { return [] }
  }
  const byPath = (list) => list.find((w) => w && String(w.path || w.cwd || '') === base) || null
  const ensureTitle = async (wid, row) => {
    if ((row && row.title) === 'Auctor' || !base) return
    if (typeof ws.rename === 'function') { try { await ws.rename(wid, 'Auctor') } catch { /* 标题纯外观 */ } }
  }
  const widOf = (row) => row && (row.workspaceId ?? row.id)

  const list = items()
  const hit = byPath(list)
  if (hit) { const wid = widOf(hit); await ensureTitle(wid, hit); return wid }
  const stale = list.find((w) => w && (w.title || '') === 'Auctor') || null
  if (stale && typeof ws.delete === 'function') { try { await ws.delete(widOf(stale)) } catch { /* 尽力 */ } }
  if (!base) throw new Error('无法创建 Auctor 工作区（dataRoot 未知）')
  const created = await ws.create({ path: base })
  const row = (created && created.workspaceId) ? created : byPath(items()) || null
  if (!row) throw new Error('无法创建 Auctor 工作区')
  const wid = widOf(row)
  await ensureTitle(wid, row)
  return wid
}

async function driveProjectSession(ctx, prompt) {
  const ws = ctx.workspaces || (ctx.get && ctx.get('workspaces'))
  const sessionsSvc = ctx.sessions || (ctx.get && ctx.get('sessions'))
  const connect = sessionConnectFn(ctx, ws)
  const canCreate = !!(sessionsSvc && typeof sessionsSvc.create === 'function')
  if (!(connect || canCreate) || !(sessionsSvc && typeof sessionsSvc.binding === 'function')) {
    throw new Error('会话服务不可用（workspaces）')
  }
  const wid = await auctorWorkspace(ctx)
  let sessionId
  try {
    const created = connect ? await connect(wid) : await sessionsSvc.create({ workspaceId: wid })
    sessionId = created && typeof created === 'object' && created.id ? created.id : created
  } catch (e) { throw new Error('创建会话失败：' + String((e && e.message) || e)) }
  const bound = sessionsSvc.binding(sessionId)
  const sess = bound && bound.session
  if (!sess || typeof sess.prompt !== 'function') throw new Error('会话无 prompt 通道')
  await sess.prompt([{ type: 'text', text: String(prompt || '') }], 'queue')
  return sessionId
}

async function drivePrompt(ctx, id, message) {
  const p = await rpc(ctx, 'project.prompt', { id, message })
  if (p && p.sessionId) {
    const sessionsSvc = ctx.sessions || (ctx.get && ctx.get('sessions'))
    if (sessionsSvc && typeof sessionsSvc.binding === 'function') {
      try {
        const bound = sessionsSvc.binding(p.sessionId)
        const sess = bound && bound.session
        if (sess && typeof sess.prompt === 'function') {
          await sess.prompt([{ type: 'text', text: String(message || '') }], 'queue')
          await rpc(ctx, 'project.attach', { id, sessionId: p.sessionId })
          return p.sessionId
        }
      } catch { /* 会话对象失效则回落到新建 */ }
    }
  }
  const sessionId = await driveProjectSession(ctx, p && p.prompt)
  await rpc(ctx, 'project.attach', { id, sessionId })
  return sessionId
}

// ---------- 迷你 Markdown（React 元素输出，杜绝 innerHTML） ----------

function inlineText(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    if (!m) return part
    return h('strong', { key: i, style: { fontWeight: 650 } }, m[1])
  })
}

function MiniMarkdown({ text }) {
  const lines = String(text || '').split('\n')
  const out = []
  let listOpen = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let el = null
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length
      el = h(level === 1 ? 'h4' : 'h5', { key: i, className: 'au-md-h' }, inlineText(line.replace(/^#+\s*/, '')))
    } else if (/^\s*[-*]\s+/.test(line) || /^\s*(\d+)\.(\s)/.test(line)) {
      el = h('div', { key: i, className: 'au-md-li' }, '• ' + _.trimList(line))
    } else if (/^\s*>\s?/.test(line)) {
      el = h('blockquote', { key: i, className: 'au-md-quote' }, inlineText(line.replace(/^\s*>\s?/, '')))
    } else if (/^\s*-{3,}\s*$/.test(line)) {
      el = h('div', { key: i, className: 'au-md-hr' })
    } else if (!line.trim()) {
      el = h('div', { key: i, className: 'au-md-gap' })
    } else {
      el = h('p', { key: i, className: 'au-md-p' }, inlineText(line))
    }
    listOpen = /^\s*[-*]\s+/.test(line)
    out.push(el)
  }
  return h('div', { className: 'au-md' }, out)
}
const _ = { trimList: (s) => String(s).replace(/^\s*[-*]\s+/, '').replace(/^\s*(\d+\.)\s+/, '') }

// 干分/长文预览工具
function slugTitle(title) { return String(title || 'untitled').toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'untitled' }
function blobDownload(name, text) {
  try {
    const blob = new Blob([String(text || '')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 400)
  } catch { /* ignore */ }
}

// ---------- 状态标签 ----------

const MILESTONES = [
  { key: 'research', label: 'stageResearch' },
  { key: 'expert', label: 'stageExpert' },
  { key: 'deep', label: 'stageDeep' },
  { key: 'points', label: 'stagePoints' },
  { key: 'outline', label: 'stageOutline' },
  { key: 'article', label: 'stageArticle' },
]
const STATUS_T = { waiting: 'stWaiting', active: 'stActive', gated: 'stGated', done: 'stDone', failed: 'stFailed', skipped: 'stSkipped' }

function statusCls(status) {
  return ({ waiting: 'au-st-wait', active: 'au-st-run', gated: 'au-st-gate', done: 'au-st-done', failed: 'au-st-fail', skipped: 'au-st-skip' })[status] || 'au-st-wait'
}

function MilestoneStrip({ milestones, active, onPick }) {
  return h('div', { className: 'au-stages' },
    MILESTONES.map((m) => {
      const st = (milestones || []).find((x) => x && x.key === m.key)
      const state = st ? st.status : 'waiting'
      const cls = 'au-stage ' + statusCls(state) + (active === m.key ? ' active' : '')
      return h('button', { key: m.key, className: cls, onClick: () => onPick(m.key), title: t('gates') },
        h('span', { className: 'dot' }),
        t(m.label),
        h('span', { className: 'au-stage-st' }, t(STATUS_T[state] || state)))
    }))
}

function EmptyState({ title, hint, img }) {
  return h('div', { className: 'au-empty' + (img ? ' au-empty-hero' : '') },
    img
      ? h('img', { className: 'au-empty-img', src: '/auctor/asset/meme.jpg', alt: '' })
      : h('div', { className: 'au-empty-fig' }, '✎'),
    h('p', { className: 'au-empty-title' }, title),
    hint ? h('p', { className: 'au-empty-hint' }, hint) : null)
}

// ---------- 各阶段内容 ----------

function ArtifactText({ title, text, hint, onSave, onConfirm, confirmLabel, busy }) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(text || '')
  const [saving, setSaving] = React.useState(false)
  const [savedFlash, setSavedFlash] = React.useState(false)
  React.useEffect(() => { if (!editing) setDraft(text || '') }, [text, editing])
  const download = () => blobDownload(slugTitle(title) + '.md', editing ? draft : (text || ''))
  const doSave = async () => {
    setSaving(true)
    try { await onSave(draft); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2500) } catch { /* parent shows error */ } finally { setSaving(false) }
  }
  return h('div', { className: 'au-artifact' },
    h('div', { className: 'au-artifact-head' },
      h('div', { className: 'au-artifact-title' }, title),
      h('div', { className: 'au-artifact-actions' },
        h('button', { className: 'au-btn ghost', onClick: download }, t('downloadMd')),
        editing
          ? h('button', { className: 'au-btn ghost', onClick: doSave, disabled: saving || !onSave }, savedFlash ? t('saved') : t('saveDraft'))
          : onSave ? h('button', { className: 'au-btn ghost', onClick: () => { setDraft(text || ''); setEditing(true) } }, t('edit')) : null)),
    h('p', { className: 'au-pane-hint' }, hint),
    editing
      ? h('textarea', { className: 'au-artifact-textarea', value: draft, onChange: (e) => setDraft(e.target.value), spellCheck: false })
      : h('div', { className: 'au-artifact-body' }, text ? h(MiniMarkdown, { text }) : h('p', { className: 'au-dim' }, t('loading'))),
    onConfirm ? h('div', { className: 'au-artifact-confirm' },
      h('button', { className: 'au-btn primary', onClick: onConfirm, disabled: busy }, confirmLabel)) : null,
  )
}

function ExpertGatePane({ stage, insights, onSubmit, onSkip, onFetch, base }) {
  const [experts, setExperts] = React.useState([{ name: '', role: '', transcript: '' }])
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const [openIns, setOpenIns] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const done = stage === 'done' || stage === 'skipped'
  const setAt = (idx, field, val) => setExperts(experts.map((e, i) => (i === idx ? { ...e, [field]: val } : e)))
  const viewIns = async (ins) => {
    setOpenIns(ins.id)
    if (bodies[ins.id]) return
    try { const r = await onFetch(base + ins.file); setBodies((b) => ({ ...b, [ins.id]: r.content })) } catch (e) { setErr(String((e && e.message) || e)) }
  }
  const submit = async () => {
    const filled = experts.filter((e) => e.transcript && e.transcript.trim())
    if (!filled.length) { setErr(t('expertGateHint')); return }
    setBusy(true); setErr('')
    try { await onSubmit(filled) } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
  }
  const skip = async () => {
    if (!window.confirm(t('skipConfirm'))) return
    setBusy(true); setErr('')
    try { await onSkip() } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
  }

  if (done) {
    return h('div', { className: 'au-pane' },
      h('p', { className: 'au-note' }, t('expertGateDone')),
      insights && insights.length
        ? h('div', { className: 'au-fold-list' },
          insights.map((ins) => h('div', { key: ins.id, className: 'au-fold' },
            h('button', { className: 'au-fold-head', onClick: () => viewIns(ins) },
              h('span', { className: 'chev' }, openIns === ins.id ? '▾' : '▸'), ins.title || ins.id),
            openIns === ins.id && bodies[ins.id] ? h('div', { className: 'au-fold-body' }, h(MiniMarkdown, { text: bodies[ins.id] })) : null)))
        : h('p', { className: 'au-dim' }, t('loading')))
  }
  if (stage === 'waiting') return h(EmptyState, { title: t('stageResearch'), hint: t('runningMarker') })

  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('expertGateTitle')),
    h('p', { className: 'au-pane-hint' }, t('expertGateHint')),
    experts.map((e, i) => h('div', { key: 'ex' + i, className: 'au-expert' },
      h('div', { className: 'au-expert-row' },
        h('input', { className: 'au-input', placeholder: t('expertName'), value: e.name, onChange: (ev) => setAt(i, 'name', ev.target.value) }),
        h('input', { className: 'au-input', placeholder: t('expertRole'), value: e.role, onChange: (ev) => setAt(i, 'role', ev.target.value) }),
        experts.length > 1 ? h('button', { className: 'au-btn ghost', onClick: () => setExperts(experts.filter((_, j) => j !== i)) }, '×') : null),
      h('textarea', { className: 'au-input exp-text', placeholder: t('expertTranscript'), value: e.transcript, onChange: (ev) => setAt(i, 'transcript', ev.target.value) }))),
    h('div', { className: 'au-expert-actions' },
      h('button', { className: 'au-btn ghost', onClick: () => setExperts([...experts, { name: '', role: '', transcript: '' }]) }, t('addExpert')),
      h('button', { className: 'au-btn primary', onClick: submit, disabled: busy }, busy ? t('creating') : t('submitExperts')),
      h('button', { className: 'au-btn link', onClick: skip, disabled: busy }, t('skipExperts'))),
    err ? h('p', { className: 'au-error' }, err) : null)
}

function ResearchPane({ data, onFetch, onError, base }) {
  const [openId, setOpenId] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const angles = (data && data.indexes && data.indexes.research) || []
  const fetchBody = async (a) => {
    setOpenId(a.id)
    if (bodies[a.id]) return
    try {
      const r = await onFetch(base + a.file)
      setBodies((b) => ({ ...b, [a.id]: r.content }))
    } catch (e) { onError(String((e && e.message) || e)) }
  }
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('summaryTitle')),
    h('div', { className: 'au-reading' }, data.texts.summary ? h(MiniMarkdown, { text: data.texts.summary }) : h('p', { className: 'au-dim' }, t('runningMarker'))),
    h('h3', { className: 'au-pane-title' }, t('anglesTitle')),
    h('p', { className: 'au-pane-hint' }, t('anglesHint')),
    angles.length === 0
      ? h('p', { className: 'au-dim' }, t('noAngles'))
      : h('div', { className: 'au-fold-list' },
        angles.map((a) => h('div', { key: a.id, className: 'au-fold' },
          h('button', { className: 'au-fold-head', onClick: () => fetchBody(a) },
            h('span', { className: 'chev' }, openId === a.id ? '▾' : '▸'), a.title || a.id, ' · ', a.file || ''),
          openId === a.id && bodies[a.id] ? h('div', { className: 'au-fold-body' }, h(MiniMarkdown, { text: bodies[a.id] })) : null))))
}

function DeepPane({ data, onFetch, onError, base }) {
  const [tab, setTab] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const groups = (data && data.indexes && data.indexes.deep) || []
  const fetchBody = async (g) => {
    setTab(g.id)
    if (bodies[g.id]) return
    try {
      const r = await onFetch(base + g.file)
      setBodies((b) => ({ ...b, [g.id]: r.content }))
    } catch (e) { onError(String((e && e.message) || e)) }
  }
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('deepQuestions')),
    h('div', { className: 'au-reading' }, data.texts.questions ? h(MiniMarkdown, { text: data.texts.questions }) : h('p', { className: 'au-dim' }, t('noDeep'))),
    h('h3', { className: 'au-pane-title' }, t('deepGroups')),
    groups.length === 0
      ? h('p', { className: 'au-dim' }, t('noDeep'))
      : h('div', { className: 'au-tabs' },
        groups.map((g) => h('button', { key: g.id, className: 'au-tab' + (tab === g.id ? ' on' : ''), onClick: () => fetchBody(g) }, g.title || g.id)),
        tab && bodies[tab] ? h('div', { className: 'au-tab-body' }, h(MiniMarkdown, { text: bodies[tab] })) : null))
}

function MaterialsPane({ data, onFetch, onError }) {
  const [openPath, setOpenPath] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const files = (data && data.files || []).filter((p) => /^materials\/SRC-.*\.md$/.test(p) || p === 'materials/index.md')
  const fetchBody = async (p) => {
    setOpenPath(p)
    if (bodies[p]) return
    try {
      const r = await onFetch(p)
      setBodies((b) => ({ ...b, [p]: r.content }))
    } catch (e) { onError(String((e && e.message) || e)) }
  }
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('materialTitle')),
    h('p', { className: 'au-pane-hint' }, t('materialHint')),
    h('div', { className: 'au-reading' }, data.texts.materialsIndex ? h(MiniMarkdown, { text: data.texts.materialsIndex }) : h('p', { className: 'au-dim' }, t('loading'))),
    h('div', { className: 'au-fold-list' },
      files.map((p) => h('div', { key: p, className: 'au-fold' },
        h('button', { className: 'au-fold-head', onClick: () => fetchBody(p) },
          h('span', { className: 'chev' }, openPath === p ? '▾' : '▸'), p),
        openPath === p && bodies[p] ? h('div', { className: 'au-fold-body' }, h(MiniMarkdown, { text: bodies[p] })) : null))))
}

// ---------- 详情页 ----------

function DetailPane({ ctx, id }) {
  const [data, setData] = React.useState(null)
  const [err, setErr] = React.useState('')
  const [step, setStep] = React.useState(null)
  const [renaming, setRenaming] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState('')
  const [discuss, setDiscuss] = React.useState('')
  const [discussOpen, setDiscussOpen] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [flash, setFlash] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      const d = await rpc(ctx, 'project.get', { id })
      setData(d)
      setStep((prev) => {
        if (prev && MILESTONES.some((m) => m.key === prev)) return prev
        return d.stage === 'done' ? 'article' : (d.stage || 'research')
      })
      return d
    } catch (e) { setErr(String((e && e.message) || e)); return null }
  }, [ctx, id])

  React.useEffect(() => { load(); const iv = setInterval(load, 2000); return () => clearInterval(iv) }, [load])

  const fetchFile = async (path) => rpc(ctx, 'project.file', { id, path })
  const drive = async (message) => {
    setBusy(true); setErr('')
    try {
      await drivePrompt(ctx, id, message)
      await load()
      flashTimeout('已发送：' + message.slice(0, 60) + '…')
    } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
  }
  const flashTimeout = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 4000) }

  const saveArtifact = async (path, content) => {
    setBusy(true); setErr('')
    try {
      await rpc(ctx, 'project.saveArtifact', { id, path, content })
      await load()
      flashTimeout(t('saved'))
      return true
    } catch (e) { setErr(String((e && e.message) || e)); setBusy(false); return false }
  }
  const confirmPoints = async () => {
    await drive('已确认评论要点定稿（06.commentary-points/commentary-points.md 以人工编辑保存的内容为准），据此生成文章提纲，到提纲门停下等确认。')
  }
  const confirmOutline = async () => {
    await drive('已确认文章提纲定稿（07.outline/outline.md 以人工编辑保存的内容为准），据此撰写全文，出稿后到成稿评审门停下。')
  }
  const acceptArticle = async () => {
    setBusy(true); setErr('')
    try {
      await rpc(ctx, 'project.accept', { id })
      await drive('编辑部已对文章定稿（08.article/accepted.json 已标记），收口本次流程。')
    } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
  }
  const submitExperts = async (experts) => {
    const r = await rpc(ctx, 'project.submitExperts', { id, experts })
    await drive(`已完成专家访谈素材提交（${r.count} 位，见 input/expert/），开始深度分析：结构化专家素材、生成研究问题、按分组深研，一路推进到评论要点门停下。`)
  }
  const skipExperts = async () => {
    await rpc(ctx, 'project.submitExperts', { id, skip: true })
    await drive('编辑部选择跳过专家访谈（input/expert/skip.json 已标记），直接进入问题生成与深度研究，推进到评论要点门停下。')
  }
  const deleteProject = async () => {
    if (!window.confirm(t('delConfirm', { t: (data && data.record && data.record.title) || id }))) return
    try { await rpc(ctx, 'project.delete', { id }); location && location.reload && location.reload() } catch (e) { setErr(String((e && e.message) || e)) }
  }
  const rename = async () => {
    const title = nameDraft.trim()
    if (!title) return
    try { await rpc(ctx, 'project.rename', { id, title }); setRenaming(false); await load() } catch (e) { setErr(String((e && e.message) || e)) }
  }

  if (!data) return h('div', { className: 'au-pane' }, h(EmptyState, { title: t('loading'), hint: err || '' }))

  const stage = data.stage
  const milestones = data.milestones || []
  const mSt = (key) => { const m = milestones.find((x) => x.key === key); return m ? m.status : 'waiting' }
  const artifactProps = (title, textKey, path, hint, confirmLabel) => ({
    title, text: data.texts[textKey], hint,
    onSave: async (v) => saveArtifact(path, v),
    onConfirm: confirmLabel === 'points' ? confirmPoints
      : confirmLabel === 'outline' ? confirmOutline
        : confirmLabel === 'accept' ? acceptArticle : null,
    confirmLabel: confirmLabel === 'points' ? t('confirmPoints')
      : confirmLabel === 'outline' ? t('confirmOutline')
        : confirmLabel === 'accept' ? t('acceptArticle') : null,
  })

  const body = (() => {
    switch (step) {
      case 'research': return h(ResearchPane, { data, onFetch: fetchFile, onError: setErr, base: '01.research/' })
      case 'expert': return h(ExpertGatePane, {
        stage: mSt('expert'), insights: data.indexes.expert,
        onSubmit: submitExperts, onSkip: skipExperts, onFetch: fetchFile, base: '03.expert-insights/',
      })
      case 'deep': return h(DeepPane, { data, onFetch: fetchFile, onError: setErr, base: '05.deep-research/' })
      case 'points': return h(ArtifactText, {
        ...artifactProps(t('pointsTitle'), 'points', '06.commentary-points/commentary-points.md', t('pointsHint'), 'points'),
      })
      case 'outline': return h(ArtifactText, {
        ...artifactProps(t('outlineTitle'), 'outline', '07.outline/outline.md', t('outlineHint'), 'outline'),
      })
      case 'article': return h(ArticlePane, { data, onFetch: fetchFile, onError: setErr, onAccept: acceptArticle, mSt })
      case 'materials': return h(MaterialsPane, { data, onFetch: fetchFile, onError: setErr })
      default: return h(MaterialsPane, { data, onFetch: fetchFile, onError: setErr })
    }
  })()

  const title = (data.record && data.record.title) || id
  return h('div', { className: 'au-detail' },
    h('div', { className: 'au-infobar' },
      renaming
        ? h('input', { className: 'au-input infobar-name', defaultValue: title, autoFocus: true, onBlur: () => setNameDraft(title), onChange: (e) => setNameDraft(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') rename() } })
        : h('button', { className: 'au-infobar-name-btn', onClick: () => { setRenaming(true); setNameDraft(title) } }, title, h('span', { className: 'au-pencil' }, '✎')),
      h('span', { className: 'au-infobar-meta' }, (data.record && data.record.createdAt ? data.record.createdAt.slice(0, 10) : ''),
        data.running ? ' · ' + t('runningMarker') : ''),
      h('button', { className: 'au-btn ghost danger', onClick: deleteProject }, t('deleteProject'))),
    h(MilestoneStrip, { milestones, active: step, onPick: setStep }),
    err ? h('p', { className: 'au-error' }, err) : null,
    flash ? h('p', { className: 'au-flash' }, flash) : null,
    h('div', { className: 'au-detail-body' }, body),
    h('div', { className: 'au-fold discuss' },
      h('button', { className: 'au-fold-head', onClick: () => setDiscussOpen((v) => !v) }, h('span', { className: 'chev' }, discussOpen ? '▾' : '▸'), t('discussion')),
      discussOpen
        ? h('div', { className: 'au-fold-body' },
          h('p', { className: 'au-pane-hint' }, t('discussHint')),
          h('textarea', { className: 'au-input discuss-input', placeholder: t('discussPlaceholder'), value: discuss, onChange: (e) => setDiscuss(e.target.value) }),
          h('div', { className: 'au-expert-actions' },
            h('button', { className: 'au-btn primary', disabled: busy || !discuss.trim(), onClick: async () => { const msg = discuss.trim(); if (!msg) return; setDiscuss(''); await drive(msg) } }, t('send'))))
        : null))
}

function ArticlePane({ data, onFetch, onError, onAccept, mSt }) {
  const stage = mSt('article')
  return h('div', { className: 'au-pane' },
    h('div', { className: 'au-article-toolbar' },
      h('button', { className: 'au-btn ghost', onClick: () => { if (data.texts.article) blobDownload(slugTitle(data.record.title) + '.md', data.texts.article) } }, t('downloadMd')),
      stage !== 'done' ? h('button', { className: 'au-btn primary', onClick: onAccept }, t('acceptArticle')) : null),
    h('div', { className: 'au-article' }, data.texts.article ? h(MiniMarkdown, { text: data.texts.article }) : h('p', { className: 'au-dim' }, t('runningMarker'))),
    h('div', { className: 'au-fold-list' },
      h('div', { className: 'au-fold' },
        h('button', { className: 'au-fold-head' }, 'article-metadata.md'),
        h('div', { className: 'au-fold-body' }, data.texts.articleMetadata ? h(MiniMarkdown, { text: data.texts.articleMetadata }) : null))))
}


// ---------- 新建 ----------

function NewProjectPane({ ctx, onCreate }) {
  const [lead, setLead] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const submit = async () => {
    if (!lead.trim()) return
    setBusy(true); setErr('')
    try {
      const r = await rpc(ctx, 'project.create', { newsLead: lead.trim(), editorNotes: notes.trim() })
      let sessionId
      try { sessionId = await driveProjectSession(ctx, r.prompt) } catch (e) { setErr(t('createFailed') + '：' + String((e && e.message) || e)) }
      if (sessionId) await rpc(ctx, 'project.attach', { id: r.id, sessionId })
      if (onCreate) await onCreate(r ? r.id : null)
    } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
  }
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('newProject')),
    h('label', { className: 'au-field' }, t('newsLeadLabel'),
      h('textarea', { className: 'au-input', placeholder: t('newsLeadHint'), value: lead, onChange: (e) => setLead(e.target.value) })),
    h('label', { className: 'au-field' }, t('editorNotesLabel'),
      h('textarea', { className: 'au-input', placeholder: t('editorNotesHint'), value: notes, onChange: (e) => setNotes(e.target.value) })),
    h('div', { className: 'au-expert-actions' },
      h('button', { className: 'au-btn primary', disabled: busy || !lead.trim(), onClick: submit }, busy ? t('creating') : t('create'))),
    err ? h('p', { className: 'au-error' }, err) : null)
}

// ---------- 工作台 ----------

function Workbench({ ctx }) {
  useLang()
  const [projects, setProjects] = React.useState(null)
  const [selected, setSelected] = React.useState(null)
  const [view, setView] = React.useState('home') // home | new | settings | detail
  const [err, setErr] = React.useState('')
  const refresh = React.useCallback(async () => {
    try {
      const r = await rpc(ctx, 'project.list')
      setProjects(r.projects || [])
    } catch (e) { setErr(String((e && e.message) || e)) }
  }, [ctx])
  React.useEffect(() => { refresh(); const iv = setInterval(refresh, 3000); return () => clearInterval(iv) }, [refresh])
  const pick = (p) => { setSelected(p.id); setView('detail') }
  const openNew = async () => { setView('new') }

  const navItem = (p) => {
    const stage = p.stage || 'research'
    const stageKey = 'stage' + stage.charAt(0).toUpperCase() + stage.slice(1)
    return h('button', { key: p.id, className: 'au-nav-item' + (selected === p.id ? ' on' : ''), onClick: () => pick(p) },
      h('div', { className: 'au-nav-item-title' }, p.title || p.id),
      h('div', { className: 'au-nav-item-meta' },
        h('span', { className: 'au-badge ' + statusCls(stage) }, I18N.zh[stageKey] ? t(stageKey) : stage),
        p.running ? h('span', { className: 'au-dot-run' }) : null,
        h('span', { className: 'au-dim' }, (p.createdAt || '').slice(0, 10))))
  }

  const main = (() => {
    if (view === 'new') return h(NewProjectPane, { ctx, onCreate: async (id) => { await refresh(); if (id) { setSelected(id); setView('detail') } } })
    if (view === 'detail' && selected) return h(DetailPane, { key: selected, ctx, id: selected })
    if (!projects || !projects.length) return h('div', { className: 'au-hero' }, h(EmptyState, { title: t('newFirst'), hint: t('newFirstHint'), img: true }))
    return h('div', { className: 'au-hero' }, h(EmptyState, { title: t('newFirst'), hint: t('newFirstHint'), img: true }))
  })()

  return h('div', { className: 'au-root au-workbench' },
    h('div', { className: 'au-nav' },
      h('div', { className: 'au-nav-head' },
        h('div', { className: 'au-brand' }, t('appName')),
        h('button', { className: 'au-btn-new', onClick: openNew }, t('newNav'))),
      h('div', { className: 'au-nav-list' },
        err ? h('p', { className: 'au-error' }, err) : null,
        projects && projects.length
          ? projects.map(navItem)
          : h('p', { className: 'au-dim au-nav-empty' }, t('emptyNav'))),
    ),
    h('div', { className: 'au-main' },
      h('div', { className: 'au-wrap' }, main)))
}

// ---------- 装配 ----------

function apply(ctx) {
  try { diag(ctx, 'apply') } catch { /* ignore */ }
  if (typeof document !== 'undefined') {
    const styleId = 'dsh-auctor-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = STYLE
      document.head.appendChild(style)
    }
  }
  const slots = ctx.slots || (ctx.get && ctx.get('slots'))
  if (!slots) return

  const panel = { open: false, subs: new Set() }
  panel.emit = () => { for (const fn of panel.subs) fn() }
  panel.toggle = () => { panel.open = !panel.open; panel.emit() }
  panel.close = () => { if (panel.open) { panel.open = false; panel.emit() } }
  panel.subscribe = (fn) => { panel.subs.add(fn); return () => { panel.subs.delete(fn) } }
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', (e) => {
      if (!panel.open) return
      const target = e.target
      if (target && typeof target.closest === 'function' && target.closest('.au-shell-panel')) return
      panel.close()
    })
  }

  function usePanelOpen() {
    if (typeof React.useSyncExternalStore === 'function') {
      return React.useSyncExternalStore(panel.subscribe.bind(panel), () => panel.open)
    }
    const [v, setV] = React.useState(panel.open)
    React.useEffect(() => panel.subscribe(() => setV(panel.open)), [])
    return v
  }

  function WorkbenchPanel() {
    const open = usePanelOpen()
    const [sb, setSb] = React.useState(280)
    React.useEffect(() => {
      if (!open) return
      const el = document.querySelector('[class*="sidebarCol"]')
      if (!el) return
      const measure = () => { const w = Math.round(el.getBoundingClientRect().width); if (w > 0) setSb(w) }
      measure()
      if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
      }
      return undefined
    }, [open])
    return h('div', { className: 'au-shell-root', style: open ? undefined : { display: 'none' } },
      h('div', { className: 'au-shell-nav', style: { width: sb + 'px' } }),
      h('div', { className: 'au-shell-panel' }, h(Workbench, { ctx, key: 'shell' })))
  }

  // 入坞：dsh-app-dock 是 auctor 的依赖，入口交给坞，auctor 不再自占 footer 槽。
  // 容忍加载顺序：注册表已就位即注册；否则等 dsh-app-dock:ready 事件（once）。
  const registerWithDock = () => {
    if (typeof window === 'undefined' || !window.__dshAppDock__) return
    window.__dshAppDock__.register({ id: 'dsh-auctor', label: 'Auctor', icon: '✒', order: 30, onToggle: () => panel.toggle() })
    if (window.__dshAppDock__.lang) {
      window.__dshAppDock__.lang.subscribe(() => {
        const v = window.__dshAppDock__.lang.get()
        if (langStore.val !== v) { langStore.val = v; langStore.emit() }
      })
    }
  }
  if (typeof window !== 'undefined' && !window.__dshAppDock__) {
    window.addEventListener('dsh-app-dock:ready', registerWithDock, { once: true })
  }
  registerWithDock()

  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'dsh-auctor', order: 10, label: 'Auctor' },
    () => h(WorkbenchPanel, null),
  ))
}

// ---------- 样式 ----------

const STYLE = `
.au-root * { box-sizing: border-box }
.au-root { font-family: var(--dsw-alias-font-family, -apple-system, "PingFang SC", "Segoe UI", sans-serif); font-size: 16px; line-height: 1.6; color: var(--dsw-alias-label-primary, #1f2329); }
.au-root button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.au-root textarea, .au-root input { font: inherit; }

.au-shell-root { position: absolute; inset: 0; z-index: 20; display: flex; align-items: stretch; pointer-events: none; background: transparent; }
.au-shell-nav { flex: none; }
.au-shell-panel { flex: 1; min-width: 0; height: 100%; pointer-events: auto; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base, #ffffff); border-left: 1px solid var(--dsw-alias-border-l2, #e8e8e8); }

.au-workbench { display: flex; width: 100%; height: 100%; overflow: hidden; }
.au-nav { width: 264px; flex: none; display: flex; flex-direction: column; border-right: 1px solid var(--dsw-alias-border-l2, #e8e8e8); background: var(--dsw-alias-bg-layer-1, #fafafa); }
.au-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.au-wrap { max-width: 880px; width: 100%; margin: 0 auto; flex: 1; display: flex; flex-direction: column; padding: 22px 28px 40px; overflow-y: auto; }

.au-nav-head { padding: 14px 12px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1, #f0f0f0); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.au-brand { font-size: 15px; font-weight: 650; letter-spacing: -0.15px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.au-nav-list { flex: 1; overflow-y: auto; padding: 8px; }
.au-nav-empty { padding: 12px; }
.au-nav-item { display: block; width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; margin-bottom: 4px; background: none; }
.au-nav-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.04)); }
.au-nav-item.on { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.08)); }
.au-nav-item-title { font-weight: 600; font-size: 15px; word-break: break-word; }
.au-nav-item-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12.5px; }
.au-badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; }
.au-dot-run { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-warn-primary, #d97706); display: inline-block; }

.au-btn { border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); background: var(--dsw-alias-bg-layer-2, #f5f5f5); color: var(--dsw-alias-label-primary, #1f2329); border-radius: 8px; padding: 7px 14px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease; user-select: none; white-space: nowrap; }
.au-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05))); border-color: var(--dsw-alias-border-l3, #d0d0d0); }
.au-btn:active { transform: translateY(0.5px); }
.au-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #4f7cff); outline-offset: 2px; }
.au-root .au-btn-new { border: 1px solid transparent; background: var(--dsw-alias-button-primary-fill, #4f7cff); color: var(--dsw-alias-label-primary-foreground, #fff); border-radius: 8px; padding: 5px 12px; font-size: 13.5px; font-weight: 550; cursor: pointer; white-space: nowrap; flex: none; box-shadow: 0 1px 2px rgba(0,0,0,0.12); transition: background 140ms ease; }
.au-root .au-btn-new:hover { background: var(--dsw-alias-button-primary-hover, #3a6ae0); }
.au-btn.primary { background: var(--dsw-alias-button-primary-fill, #4f7cff); border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); font-weight: 550; box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
.au-btn.primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover, #3a6ae0); }
.au-btn.ghost { background: transparent; border-color: transparent; color: var(--dsw-alias-label-dimmed, #777); }
.au-btn.ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05)); color: var(--dsw-alias-label-primary, #1f2329); border-color: transparent; }
.au-btn.link { color: var(--dsw-alias-label-secondary, #666); text-decoration: underline; font-size: 13px; background: transparent; border-color: transparent; padding: 4px 6px; }
.au-btn.danger { color: var(--dsw-alias-state-error-primary, #dc2626) !important; }
.au-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

.au-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 24px; text-align: center; gap: 10px; color: var(--dsw-alias-label-dimmed, #777); border: 1px dashed var(--dsw-alias-border-l2, #e8e8e8); border-radius: 14px; background: var(--dsw-alias-bg-layer-1, #fafafa); }
.au-empty-hero { border: none; background: transparent; padding: 56px 28px; gap: 12px; }
.au-empty-fig { font-size: 44px; line-height: 1; opacity: 0.5; margin: 0; }
.au-empty-img { width: 200px; height: 200px; object-fit: cover; display: block; margin: 0; -webkit-mask-image: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); mask-image: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); }
.au-hero { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 24px 28px; }
.au-empty-title { font-size: 16px; font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); margin: 0; }
.au-empty-hint { font-size: 14px; color: var(--dsw-alias-label-dimmed, #777); margin: 0; }
.au-empty-hero .au-empty-title { font-size: 20px; font-weight: 650; letter-spacing: -0.01em; }
.au-empty-hero .au-empty-hint { font-size: 14.5px; line-height: 1.65; max-width: 440px; }

.au-stages { display: flex; gap: 6px; padding: 10px 14px; border-bottom: 1px solid var(--dsw-alias-border-l2, #e8e8e8); overflow-x: auto; }
.au-stage { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2, #f5f5f5); color: var(--dsw-alias-label-secondary, #555); font-size: 13.5px; white-space: nowrap; }
.au-stage .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-border-l3, #d0d0d0); }
.au-stage.active { outline: 2px solid var(--dsw-alias-accent, #4f7cff); outline-offset: 1px; font-weight: 600; }
.au-stage-st { font-size: 11.5px; opacity: 0.75; }
.au-st-wait .dot { background: #b0b0b0; }
.au-st-run .dot { background: #d97706; }
.au-st-gate .dot { background: #2563eb; }
.au-st-done .dot { background: #15803d; }
.au-st-fail .dot { background: #dc2626; }
.au-st-skip .dot { background: #a3a3a3; }

.au-pane-title { font-size: 19px; font-weight: 650; margin: 20px 0 6px; }
.au-pane-hint { color: var(--dsw-alias-label-secondary, #666); font-size: 13.5px; margin: 2px 0 12px; }
.au-reading { margin-bottom: 16px; }
.au-md-h { font-weight: 650; margin: 10px 0 4px; }
.au-md-p { margin: 4px 0; }
.au-md-li { margin: 2px 0 2px 8px; }
.au-md-quote { border-left: 3px solid var(--dsw-alias-border-l3, #d0d0d0); padding-left: 10px; color: var(--dsw-alias-label-secondary, #555); margin: 6px 0; }
.au-md-hr { border-top: 1px solid var(--dsw-alias-border-l2, #e8e8e8); margin: 10px 0; }
.au-md-gap { height: 8px; }
.au-dim { color: var(--dsw-alias-label-caption, #999); font-size: 13px; }

.au-fold-list { margin-top: 8px; }
.au-fold { border: 1px solid var(--dsw-alias-border-l1, #f0f0f0); border-radius: 12px; margin-bottom: 6px; overflow: hidden; }
.au-fold-head { display: flex; width: 100%; align-items: center; gap: 8px; padding: 9px 12px; text-align: left; font-size: 14px; }
.au-fold-head:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.03)); }
.au-fold-body { padding: 4px 14px 12px; border-top: 1px solid var(--dsw-alias-border-l1, #f0f0f0); }
.au-insight-text { margin-top: 8px; }
.au-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.au-tab { padding: 6px 12px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2, #f5f5f5); font-size: 13px; }
.au-tab.on { background: var(--dsw-alias-accent, #4f7cff); color: #fff; }
.au-tab-body { margin-top: 10px; }

.au-expert { border: 1px solid var(--dsw-alias-border-l2, #e8e8e8); border-radius: 14px; padding: 14px; margin-bottom: 12px; }
.au-expert-row { display: flex; gap: 8px; margin-bottom: 8px; }
.au-expert-row input.exp-name { flex: 1; }
.au-expert-row input.exp-role { flex: 1; }
.au-input { width: 100%; border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); background: var(--dsw-alias-bg-layer-2, #f5f5f5); border-radius: 8px; padding: 8px 12px; font-size: 14px; color: var(--dsw-alias-label-primary, #1f2329); outline: none; transition: border-color 140ms ease, box-shadow 140ms ease; }
.au-input::placeholder { color: var(--dsw-alias-label-caption, #999); }
.au-input:hover { border-color: var(--dsw-alias-border-l3, #d0d0d0); }
.au-input:focus { border-color: var(--dsw-alias-brand-primary, #4f7cff); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary, #4f7cff) 18%, transparent); }
.au-field { display: block; margin-bottom: 16px; font-size: 13.5px; font-weight: 500; color: var(--dsw-alias-label-primary, #1f2329); }
.au-field .au-input { margin-top: 6px; }
.au-expert .exp-text { min-height: 120px; resize: vertical; }
.au-expert-actions { display: flex; gap: 8px; align-items: center; margin-top: 10px; }

.au-artifact { margin-top: 8px; }
.au-artifact-head { display: flex; justify-content: space-between; align-items: center; }
.au-artifact-title { font-size: 19px; font-weight: 650; }
.au-artifact-actions { display: flex; gap: 6px; }
.au-artifact-textarea { width: 100%; min-height: 360px; border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); background: var(--dsw-alias-bg-layer-2, #f5f5f5); border-radius: 8px; padding: 12px 14px; font-size: 14px; line-height: 1.55; font-family: inherit; outline: none; resize: vertical; transition: border-color 140ms ease, box-shadow 140ms ease; }
.au-artifact-textarea:focus { border-color: var(--dsw-alias-brand-primary, #4f7cff); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary, #4f7cff) 18%, transparent); }
.au-artifact-body { max-width: 700px; }
.au-artifact-confirm { margin: 14px 0; }

.au-article { max-width: 700px; }
.au-article-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.au-article h2, .au-article h3 { margin-top: 16px; }

.au-detail { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.au-infobar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--dsw-alias-border-l2, #e8e8e8); }
.au-infobar-name-btn { font-size: 20px; font-weight: 650; display: flex; align-items: center; gap: 6px; }
.au-pencil { font-size: 13px; opacity: 0.5; }
.au-infobar-meta { color: var(--dsw-alias-label-caption, #999); font-size: 12.5px; flex: 1; }
.au-detail-body { flex: 1; overflow-y: auto; padding: 4px 20px 20px; }
.au-error { color: var(--dsw-alias-state-error-primary, #dc2626); font-size: 13.5px; padding: 8px 14px; }
.au-flash { color: var(--dsw-alias-state-success-primary, #15803d); font-size: 13.5px; padding: 4px 14px; }

.au-fold.discuss { margin: 8px 12px 14px; }
.discuss-input { min-height: 60px; resize: vertical; }

.au-settings-row { display: flex; gap: 10px; margin: 6px 0; font-size: 14px; }
.au-settings-k { color: var(--dsw-alias-label-secondary, #666); min-width: 100px; }

`

// build.mjs 包装时在 factory 内追加 `return { inject, apply }`
