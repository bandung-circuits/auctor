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
    stageConfirm: '确认选题', stageResearch: '快速研究', stageExpert: '专家素材', stageDeep: '深度研究', stagePoints: '评论要点', stageOutline: '提纲', stageArticle: '成稿', stageDone: '已定稿',
    stWaiting: '等待', stActive: '进行中', stGated: '待你决定', stDone: '完成', stFailed: '失败', stSkipped: '跳过',
    runningMarker: '运行中', refreshHint: '会话已停，去讨论面板发一句话续跑',
    summaryTitle: '初始摘要', anglesTitle: '十角度研究', anglesHint: '展开查看各角度的摘录（材料库在下方）',
    noAngles: '研究进行中，角度尚未落盘', summaryOpenHint: '点击卡片查看全文（含目录）→',
    expertGateTitle: '专家访谈素材', expertGateHint: '把访谈转录（或笔记）逐位提交。此后系统会自动跑完专家结构、问题生成与深度研究，直达评论要点门。',
    expertGateDone: '专家素材已处理，深度研究已自动推进。',
    expertName: '姓名', expertRole: '身份/头衔', expertTranscript: '访谈原文（转录或笔记）', addExpert: '添加一位专家', submitExperts: '完成素材，开始深度分析', skipExperts: '跳过专家访谈', skipConfirm: '确定跳过专家访谈？跳过即不再从专家处获取信息。',
    deepQuestions: '研究问题', deepGroups: '深度研究分组', deepHint: '问题生成与深研全自动。若想改动研究问题，去讨论面板说一句。',
    noDeep: '深度研究尚未产出。', stepWaiting: '前面的环节尚未完成，此处暂无内容。', countExcerpts: '{n} 条摘录', countQuestions: '{n} 个问题',
    pointsTitle: '评论要点', pointsHint: '审读这几条论点。可逐处编辑后「保存定稿」；想换方向就在讨论面板里说。', confirmPoints: '确认要点，生成提纲',
    outlineTitle: '文章提纲', outlineHint: '审读章节结构。可编辑后「保存定稿」；想换结构在讨论面板里说。', confirmOutline: '确认提纲，开始写作',
    articleTitle: '成稿', articleHint: '这是可发布的初稿。可接受定稿，或在讨论面板发起修订。', acceptArticle: '定稿收口', acceptedMsg: '已收口。',
    edit: '编辑', saveDraft: '保存编辑', saved: '已保存', downloading: '下载中…',
    downloadMd: '下载 Markdown', viewAll: '查看全部', materialTitle: '材料库', materialHint: 'materials/ 收录本项目的全部原文来源。',
    discussion: '讨论', discussHint: '给项目会话一句话：补充背景、要求调研究问题、换个方向重做要点/提纲/文章。你的决策会在同一会话继续。',
    discussPlaceholder: 'e.g. 把要点 3 换成侧重债务条款的博弈…', send: '发送', sentFlash: '已发送：{msg}…',
    briefWorking: '正在理解事件并生成简介…', eventSummaryLabel: '事件确认', initTitle: '确认选题并生成项目', projectTitle: '项目名称', planTitle: '接下来的流程', nextStep: '下一步：确认选题', confirmStart: '确认并启动', starting: '启动中…', briefConfirmed: '选题已确认，研究推进中。按钮将带你进入研究进度页。', briefResearchDone: '选题已确认，快速研究已完成，流程在推进中。按钮可复看研究进度。', briefFailed: '选题已确认，但研究未完成。可进入研究进度页查看，并在讨论面板说明原因后重试。', goResearch: '查看研究进度 →', backStep: '返回修改', tocTitle: '目录', footnotesLabel: '脚注', rename: '改名', deleteProject: '删除项目', delConfirm: '彻底删除项目「{t}」？项目目录与会话都将移除。',
    namePlaceholder: '项目标题', loading: '加载中…', error: '出错',
    gates: '四道门', markers: '阶段条可点击回看；修改已完成的上游产物后，下游需要你在讨论面板发起重做。',
  },
  en: {
    appName: 'Auctor', newProject: 'New project', newNav: 'New', newsLeadLabel: 'News lead (one sentence or a URL)', newsLeadHint: 'e.g. Cuba hold 100 years of Fidel memorial activities',
    editorNotesLabel: 'Editor notes (optional)', editorNotesHint: 'Your initial observations or angles',
    create: 'Create & start', creating: 'Creating…', createFailed: 'Create failed',
    emptyNav: 'No projects', newFirst: 'Start a commentary from one news lead.', newFirstHint: 'Click "New project" top-left. Auctor runs quick research and summary, then waits for your expert material.',
    stageConfirm: 'Brief', stageResearch: 'Overview', stageExpert: 'Experts', stageDeep: 'Research', stagePoints: 'Points', stageOutline: 'Outline', stageArticle: 'Article', stageDone: 'Closed',
    stWaiting: 'Waiting', stActive: 'Running', stGated: 'Your call', stDone: 'Done', stFailed: 'Failed', stSkipped: 'Skipped',
    runningMarker: 'running', refreshHint: 'Session is idle. Send a line in the discussion panel to resume.',
    summaryTitle: 'Initial summary', anglesTitle: '10-angle research', anglesHint: 'Expand each angle to read its excerpts (materials below).',
    noAngles: 'Research in progress, excerpts not on disk yet.', summaryOpenHint: 'Click the card to view the full text (with contents) →',
    expertGateTitle: 'Expert material', expertGateHint: 'Submit each interview transcript or notes. Then Auctor runs expert processing, question generation and deep research automatically, straight to the commentary-points gate.',
    expertGateDone: 'Expert material processed; deep research advanced automatically.',
    expertName: 'Name', expertRole: 'Role / affiliation', expertTranscript: 'Raw interview (transcript or notes)', addExpert: 'Add an expert', submitExperts: 'Start deep analysis', skipExperts: 'Skip experts', skipConfirm: 'Skip expert interviews? Their input will be absent.',
    deepQuestions: 'Research questions', deepGroups: 'Deep research groups', deepHint: 'Questions and deep research run automatically. To adjust the questions, say so in the discussion panel.',
    noDeep: 'Deep research not produced yet.', countExcerpts: '{n} excerpts', countQuestions: '{n} questions', stepWaiting: 'Not reached yet — upstream stages must finish first.',
    pointsTitle: 'Commentary points', pointsHint: 'Review the argumentative backbone. Edit inline then "Save final"; to change direction, say so in the discussion panel.', confirmPoints: 'Confirm points, draft outline',
    outlineTitle: 'Article outline', outlineHint: 'Review the section structure. Edit then "Save final"; structural changes via the discussion panel.', confirmOutline: 'Confirm outline, start writing',
    articleTitle: 'Article', articleHint: 'This is a publishable first draft. Accept it, or request revisions in the discussion panel.', acceptArticle: 'Accept & close', acceptedMsg: 'Closed.',
    edit: 'Edit', saveDraft: 'Save edit', saved: 'Saved', downloading: 'Downloading…',
    downloadMd: 'Download Markdown', viewAll: 'Show all', materialTitle: 'Materials', materialHint: 'materials/ holds the full-text sources of this project.',
    discussion: 'Discussion', discussHint: 'A line to the project session: add context, adjust questions, redo points/outline/article in a new direction. Decisions continue the same session.',
    discussPlaceholder: 'e.g. Replace point 3 with the debt-clause bargaining angle…', send: 'Send', sentFlash: 'Sent: {msg}…',
    briefWorking: 'Understanding the event…', eventSummaryLabel: 'Event', initTitle: 'Confirm the brief & create', projectTitle: 'Project title', planTitle: 'What happens next', nextStep: 'Next: review', confirmStart: 'Confirm & start', starting: 'Starting…', briefConfirmed: 'Brief confirmed — research is running. This button takes you to the research progress.', briefResearchDone: 'Brief confirmed — research is complete, pipeline continues. This button reopens the research page.', briefFailed: 'Brief confirmed, but research did not complete. Open the research page, then retry from the discussion panel.', goResearch: 'View research →', backStep: 'Back', tocTitle: 'Contents', footnotesLabel: 'Footnotes', rename: 'Rename', deleteProject: 'Delete project', delConfirm: 'Delete project "{t}" permanently? Directory and session will be removed.',
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

// ---------- Markdown 渲染（markdown-it，scripts/build.mjs 内联注入 __auctorMd） ----------

let _md = null
let _hidx = 0
function getMd() {
  if (_md) return _md
  if (typeof __auctorMd === 'undefined' || !__auctorMd.createMarkdown) return null
  const md = __auctorMd.createMarkdown()
  // h1–h3 标注入 data-h，供目录滚动定位
  md.renderer.rules.heading_open = (tokens, idx) => {
    const level = Number(tokens[idx].tag.slice(1)) || 1
    if (level <= 3) _hidx++
    return `<${tokens[idx].tag}${level <= 3 ? ` data-h="h${_hidx}"` : ''}>`
  }
  // 脚注区块：加"脚注"标题（锚点跳转由 markdown-it-footnote 提供）
  md.renderer.rules.footnote_block_open = () =>
    `<div class="au-md-footnotes-title">${t('footnotesLabel')}</div>\n<section class="footnotes">\n<ol class="footnotes-list">`
  md.renderer.rules.footnote_block_close = () => '</ol>\n</section>\n'
  _md = md
  return md
}

function renderMarkdownHtml(src) {
  const md = getMd()
  if (!md) return String(src || '')
  _hidx = 0
  return md.render(String(src || ''), {})
}

function MiniMarkdown({ text }) {
  const html = renderMarkdownHtml(text)
  return h('div', { className: 'au-md', dangerouslySetInnerHTML: { __html: html } })
}

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
  { key: 'confirm', label: 'stageConfirm' },
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
      const state = st ? st.status : (m.key === 'confirm' ? 'done' : 'waiting')
      const on = active === m.key
      return h('button', { key: m.key, className: 'au-stage ' + statusCls(state) + (on ? ' on' : ''), onClick: () => onPick(m.key), title: t(m.label) + ' · ' + t(STATUS_T[state] || state) },
        h('span', { className: 'dot' }),
        t(m.label))
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

function ArtifactText({ title, text, hint, onSave, onConfirm, confirmLabel, busy, renderBody, status }) {
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
  // 门控：只有里程碑停在"待你决定"(gated) 时才允许确认；产物不存在时不允许编辑下载
  const gated = status === 'gated'
  const emptyLabel = status === 'waiting' ? t('stepWaiting') : status === 'active' ? t('runningMarker') : t('loading')
  return h('div', { className: 'au-artifact' },
    h('div', { className: 'au-artifact-head' },
      h('div', { className: 'au-artifact-title' }, title),
      h('div', { className: 'au-artifact-actions' },
        text ? h('button', { className: 'au-btn ghost', onClick: download }, t('downloadMd')) : null,
        editing
          ? h('button', { className: 'au-btn ghost', onClick: doSave, disabled: saving || !onSave }, savedFlash ? t('saved') : t('saveDraft'))
          : (onSave && text) ? h('button', { className: 'au-btn ghost', onClick: () => { setDraft(text || ''); setEditing(true) } }, t('edit')) : null)),
    h('p', { className: 'au-pane-hint' }, hint),
    editing
      ? h('textarea', { className: 'au-artifact-textarea', value: draft, onChange: (e) => setDraft(e.target.value), spellCheck: false })
      : h('div', { className: 'au-artifact-body' }, text ? (renderBody ? renderBody(text) : h(MiniMarkdown, { text })) : h('p', { className: 'au-dim' }, emptyLabel)),
    (onConfirm && gated) ? h('div', { className: 'au-artifact-confirm' },
      h('button', { className: 'au-btn primary', onClick: onConfirm, disabled: busy }, confirmLabel)) : null,
  )
}

function BriefPane({ data, onConfirm, onManual, busy, researchStarted, researchFailed, researchStatus, onNext }) {
  const [title, setTitle] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const brief = (data.texts && data.texts.brief) || ''
  const parse = (txt) => {
    const t = String(txt || '')
    const tm = t.match(/^Title:\s*(.+)$/mi)
    const sm = t.match(/^Summary:\s*(.+)$/mi)
    return { bTitle: tm ? tm[1].trim() : '', summary: sm ? sm[1].trim() : '' }
  }
  const { bTitle, summary } = parse(brief)
  const current = (data.record && data.record.title) || ''
  React.useEffect(() => { if (!touched) setTitle(bTitle || current) }, [bTitle, current, touched])
  const note = researchFailed ? t('briefFailed')
    : researchStatus === 'done' ? t('briefResearchDone')
      : t('briefConfirmed')
  if (!brief) {
    return h('div', { className: 'au-pane' },
      h('h3', { className: 'au-pane-title' }, t('stageConfirm')),
      h('p', { className: 'au-pane-hint' }, t('briefWorking')))
  }
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('stageConfirm')),
    summary ? h('p', { style: { fontSize: 14, lineHeight: 1.6, marginBottom: 14 } }, summary) : null,
    h('label', { className: 'au-field' }, t('projectTitle'),
      h('input', { className: 'au-input', value: title, disabled: researchStarted, onChange: (e) => { setTouched(true); if (onManual) onManual(); setTitle(e.target.value) } })),
    researchStarted ? h('p', { className: researchFailed ? 'au-note err' : 'au-note' }, note) : null,
    h('div', { className: 'au-expert-actions' },
      researchStarted
        ? h('button', { className: 'au-btn primary', onClick: onNext }, t('goResearch'))
        : h('button', { className: 'au-btn primary', disabled: busy, onClick: () => onConfirm(title || current) }, busy ? t('starting') : t('confirmStart'))))
}

function ExpertGatePane({ stage, insights, onSubmit, onSkip, onFetch, base }) {
  const [experts, setExperts] = React.useState([{ name: '', role: '', transcript: '' }])
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const [openIns, setOpenIns] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const done = stage === 'done' || stage === 'skipped'
  const setAt = (idx, field, val) => setExperts(experts.map((e, i) => (i === idx ? { ...e, [field]: val } : e)))
  // done/skipped 态挂载时预拉每份专家见解，供卡片展示身份与原文首段
  React.useEffect(() => {
    if (!done) return
    let alive = true
    const insList = insights || []
    insList.forEach((ins) => {
      onFetch(base + ins.file)
        .then((r) => { if (alive) setBodies((b) => ({ ...b, [ins.id]: r.content })) })
        .catch(() => { /* 预览失败不打断 */ })
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, insights && insights.length])
  const viewIns = (ins) => {
    if (openIns === ins.id) { setOpenIns(null); return }
    setOpenIns(ins.id)
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
    const open = insights && insights.find((x) => x.id === openIns) || null
    return h('div', { className: 'au-pane' },
      h('p', { className: 'au-note' }, t('expertGateDone')),
      insights && insights.length
        ? h('div', { className: 'au-angle-grid' },
          insights.map((ins) => {
            const prev = expertPreview(bodies[ins.id])
            return h('button', { key: ins.id, className: 'au-root au-insight-card', onClick: () => viewIns(ins) },
              h('span', { className: 'au-insight-name' }, ins.title || ins.id),
              prev.role ? h('span', { className: 'au-insight-role' }, prev.role) : null,
              h('span', { className: 'au-insight-raw' }, prev.raw || '…'))
          }))
        : h('p', { className: 'au-dim' }, t('loading')),
      open ? h(MdModal, { title: open.title || open.id, content: bodies[open.id], onClose: () => setOpenIns(null) }) : null)
  }
  if (stage === 'waiting' || stage === 'active') return h(EmptyState, { title: t('stageResearch'), hint: t('runningMarker') })
  if (stage === 'failed') return h('div', { className: 'au-pane' }, h('p', { className: 'au-note err' }, t('stFailed')))
  if (stage !== 'gated') return h('div', { className: 'au-pane' }, h('p', { className: 'au-dim' }, t('stepWaiting')))

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

function excerptStats(md) {
  const text = String(md || '')
  const items = (text.match(/^## \[[^\]]+\]/gm) || []).length
  const first = (text.match(/^## \[[^\]]+\] (.+)$/m) || [])[1] || ''
  return { items, first }
}

function expertPreview(md) {
  const text = String(md || '')
  const role = (text.match(/^[-*]\s*\*\*Role[^*:]*\*\*\s*[:：]?\s*(.+)$/im) || [])[1] || ''
  const rawSec = text.match(/^##\s*Raw Input\s*$/im)
  let raw = ''
  if (rawSec) {
    raw = text.slice(rawSec.index + rawSec[0].length).split(/\r?\n/).map((s) => s.trim()).find((s) => s.length > 0) || ''
  } else {
    raw = (text.match(/^#+\s+.*$/m) || [''])[0].replace(/^#+\s*/, '')
  }
  return { role: role.trim(), raw: raw.slice(0, 200) }
}

function summaryPreview(md) {
  const text = String(md || '').replace(/^#{1,3}\s.*$/gm, '').replace(/\*\*/g, '').replace(/^\s*>\s?/gm, '').replace(/^\s*[-*]\s+/gm, '')
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).join(' ').slice(0, 180)
}

// ---------- 段落解析（要点/提纲/深研问题 → 卡片） ----------

function parsePoints(md) {
  const lines = String(md || '').split('\n')
  const out = []
  let cur = null
  for (const line of lines) {
    if (/^###\s+Point\b/i.test(line)) {
      cur = { title: line.replace(/^###\s*/, '').trim(), body: [] }
      out.push(cur)
      continue
    }
    if (cur && /^#{1,2}\s/.test(line)) cur = null
    if (cur) cur.body.push(line)
  }
  return out.map((p) => {
    const body = p.body.join('\n')
    const tag = (p.title.match(/\s*\[([^\]]+)\]\s*$/) || [])[1] || ''
    const claim = (body.match(/^\*\*Claim\*\*:\s*(.+)$/m) || [])[1] || ''
    return { title: p.title.replace(/\s*\[[^\]]+\]\s*$/, '').trim(), tag, md: '### ' + p.title + '\n' + body, brief: claim }
  })
}

function parseSections(md) {
  const lines = String(md || '').split('\n')
  const out = []
  let cur = null
  for (const line of lines) {
    if (/^###\s+Section\b/i.test(line)) {
      cur = { title: line.replace(/^###\s*/, '').trim(), body: [] }
      out.push(cur)
      continue
    }
    if (cur && /^#{1,2}\s/.test(line)) cur = null
    if (cur) cur.body.push(line)
  }
  return out.map((s) => {
    const body = s.body.join('\n')
    const first = body.split('\n').map((x) => x.trim()).filter(Boolean)[0] || ''
    return { title: s.title, md: '### ' + s.title + '\n' + body, brief: first.replace(/\*\*/g, '').slice(0, 160) }
  })
}

function parseDeepQuestions(md) {
  const lines = String(md || '').split('\n')
  const sections = []
  let cur = null
  for (const line of lines) {
    const m = line.match(/^##\s+Question\s*\d*\s*:?\s*(.*)$/i)
    if (m) { cur = { title: line.replace(/^##\s*/, '').trim(), body: [] }; sections.push(cur); continue }
    if (cur) cur.body.push(line)
  }
  return sections.map((s) => {
    const body = s.body.join('\n')
    const count = (body.match(/^### \[[^\]]+\]/gm) || []).length
    const first = (body.match(/^### \[[^\]]+\] (.+)$/m) || [])[1] || ''
    return { title: 'Q · ' + s.title.replace(/^Question\s*\d*\s*:?\s*/i, '').trim(), md: '## ' + s.title + '\n' + body, sub: count + ' 条摘录', brief: count ? first : '' }
  })
}

// 段落卡片网格：每段一张卡片，点击弹 modal 看该段全文
function parseQuestionCategories(md) {
  const lines = String(md || '').split('\n')
  const cats = []
  let curCat = null
  let curItem = null
  for (const line of lines) {
    const catM = line.match(/^##\s+Category\s*([AB])\s*:?\s*(.*)$/i)
    if (catM) {
      curCat = { key: 'cat' + catM[1].toUpperCase(), title: line.replace(/^##\s*/, '').trim(), items: [] }
      cats.push(curCat)
      curItem = null
      continue
    }
    const itemM = line.match(/^###\s+(.+)$/)
    if (itemM && curCat) {
      curItem = { title: itemM[1].trim(), body: [] }
      curCat.items.push(curItem)
      continue
    }
    if (curItem) curItem.body.push(line)
  }
  return cats.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => {
      const body = item.body.join('\n').trim()
      const first = body.split('\n').map((s) => s.trim()).filter(Boolean)[0] || ''
      const tag = (item.title.match(/\bGroup\s*(Q\d+)/i) || [])[1] || (item.title.match(/^([A-J]-\d+)/) || [])[1] || ''
      const sub = (body.match(/\*\*Priority\*\*:\s*(.+)/i) || [])[1] || ''
      return { title: item.title, tag, md: '### ' + item.title + (body ? '\n\n' + body : ''), sub, brief: first.replace(/\*\*/g, '').replace(/^\d+[.、]\s*/, '').slice(0, 160) }
    }),
  }))
}

function SectionCards({ sections }) {
  const [openIdx, setOpenIdx] = React.useState(null)
  const open = openIdx === null ? null : sections[openIdx]
  return h('div', { className: 'au-section-grid' },
    sections.map((s, i) => h('button', { key: i, className: 'au-root au-section-card', onClick: () => setOpenIdx(i) },
      s.tag ? h('span', { className: 'au-section-tag' }, s.tag) : null,
      h('span', { className: 'au-section-name' }, s.title),
      s.sub ? h('span', { className: 'au-section-sub' }, s.sub) : null,
      s.brief ? h('span', { className: 'au-section-brief' }, s.brief) : null)),
    open ? h(MdModal, { title: open.title, content: open.md, wide: true, onClose: () => setOpenIdx(null) }) : null)
}

// pomasa-studio 同款 modal：backdrop + 居中卡片 + 头部（标题/✕）+ 可滚动正文；wide 供长文，toc 供摘要目录
function MdModal({ title, content, toc, wide, onClose }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const hasToc = toc && toc.length > 1
  return h('div', { className: 'au-modal', onClick: onClose },
    h('div', { className: 'au-modal-box' + (wide ? ' wide' : ''), onClick: (e) => e.stopPropagation() },
      h('div', { className: 'au-modal-head' },
        h('div', { className: 'au-modal-title' }, title || ''),
        h('button', { className: 'au-btn ghost', onClick: onClose }, '✕')),
      hasToc
        ? h('div', { className: 'au-modal-body au-modal-toc-layout' },
          h('div', { className: 'au-modal-toc' },
            h('div', { className: 'au-toc-title' }, t('tocTitle')),
            toc.map((hh) => h('button', {
              key: hh.i,
              className: 'au-toc-item' + (hh.level > 2 ? ' sub' : ''),
              onClick: () => { const el = document.querySelector('[data-h="h' + hh.i + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
            }, hh.text))),
          h('div', { className: 'au-modal-main' }, content ? h(MiniMarkdown, { text: content }) : h('p', { className: 'au-dim' }, t('loading'))))
        : h('div', { className: 'au-modal-body' }, content ? h(MiniMarkdown, { text: content }) : h('p', { className: 'au-dim' }, t('loading')))))
}

function ResearchPane({ data, onFetch, onError, base }) {
  const [openId, setOpenId] = React.useState(null)
  const [summaryOpen, setSummaryOpen] = React.useState(false)
  const [bodies, setBodies] = React.useState({})
  const angles = (data && data.indexes && data.indexes.research) || []
  // 挂载时把每个角度的摘录拉到本地：卡片展示摘要（条数 + 首条），点开弹 modal 看全量
  React.useEffect(() => {
    let alive = true
    angles.forEach((a) => {
      onFetch(base + a.file)
        .then((r) => { if (alive) setBodies((b) => ({ ...b, [a.id]: r.content })) })
        .catch((e) => onError(String((e && e.message) || e)))
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && data.indexes && data.indexes.research && data.indexes.research.length])
  const openAngle = (a) => setOpenId(a.id)
  const open = angles.find((a) => a.id === openId) || null
  const heads = (() => {
    const m = (data.texts.summary || '').match(/^#{1,3}\s.*$/gm) || []
    return m.map((line, i) => ({ i: i + 1, text: line.replace(/^#+\s*/, ''), level: (line.match(/^#+/) || [''])[0].length }))
  })()
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('summaryTitle')),
    data.texts.summary
      ? h('button', { className: 'au-root au-summary-card', onClick: () => setSummaryOpen(true) },
        h('span', { className: 'au-summary-preview' }, summaryPreview(data.texts.summary)),
        h('span', { className: 'au-summary-hint' }, t('summaryOpenHint')))
      : h('p', { className: 'au-dim' }, t('runningMarker')),
    h('h3', { className: 'au-pane-title' }, t('anglesTitle')),
    h('p', { className: 'au-pane-hint' }, t('anglesHint')),
    angles.length === 0
      ? h('p', { className: 'au-dim' }, t('noAngles'))
      : h('div', { className: 'au-angle-grid' },
        angles.map((a) => {
          const st = excerptStats(bodies[a.id])
          return h('button', { key: a.id, className: 'au-angle-card', 'data-angle': a.id, onClick: () => openAngle(a) },
            h('div', { className: 'au-angle-head' },
              h('span', { className: 'au-angle-name' }, a.title || a.id),
              bodies[a.id] ? h('span', { className: 'au-angle-count' }, t('countExcerpts', { n: String(st.items) })) : h('span', { className: 'au-dim' }, t('loading'))),
            h('div', { className: 'au-angle-excerpt' }, st.first || '…'))
        })),
    open ? h(MdModal, { title: open.title || open.id, content: bodies[open.id], wide: true, onClose: () => setOpenId(null) }) : null,
    summaryOpen ? h(MdModal, { title: t('summaryTitle'), content: data.texts.summary, toc: heads, wide: true, onClose: () => setSummaryOpen(false) }) : null,
  )
}

function DeepPane({ data, onFetch, onError, base }) {
  const [openGroup, setOpenGroup] = React.useState(null)
  const [openCat, setOpenCat] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const groups = (data && data.indexes && data.indexes.deep) || []
  const categories = parseQuestionCategories(data.texts.questions)
  // 预拉各分组摘录：折叠区标题显示问题数，展开后渲染问题卡片
  React.useEffect(() => {
    let alive = true
    groups.forEach((g) => {
      onFetch(base + g.file)
        .then((r) => { if (alive) setBodies((b) => ({ ...b, [g.id]: r.content })) })
        .catch((e) => onError(String((e && e.message) || e)))
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length])
  const toggle = (g) => setOpenGroup(openGroup === g.id ? null : g.id)
  const toggleCat = (k) => setOpenCat(openCat === k ? null : k)
  return h('div', { className: 'au-pane' },
    h('h3', { className: 'au-pane-title' }, t('deepQuestions')),
    data.texts.questions
      ? (categories.length
        ? h('div', { className: 'au-fold-list' },
          categories.map((cat) => {
            const open = openCat === cat.key
            return h('div', { key: cat.key, className: 'au-fold' },
              h('button', { className: 'au-fold-head', onClick: () => toggleCat(cat.key) },
                h('span', { className: 'chev' }, open ? '▾' : '▸'),
                h('span', { className: 'au-fold-title' }, cat.title),
                h('span', { className: 'au-fold-count' }, String(cat.items.length))),
              open ? h('div', { className: 'au-fold-body' }, cat.items.length ? h(SectionCards, { sections: cat.items }) : h('p', { className: 'au-dim' }, t('noDeep'))) : null)
          }))
        : h('div', { className: 'au-reading' }, h(MiniMarkdown, { text: data.texts.questions })))
      : h('p', { className: 'au-dim' }, t('noDeep')),
    h('h3', { className: 'au-pane-title' }, t('deepGroups')),
    groups.length === 0
      ? h('p', { className: 'au-dim' }, t('noDeep'))
      : h('div', { className: 'au-fold-list' },
        groups.map((g) => {
          const qs = bodies[g.id] ? parseDeepQuestions(bodies[g.id]) : []
          const open = openGroup === g.id
          return h('div', { key: g.id, className: 'au-fold' },
            h('button', { className: 'au-fold-head', onClick: () => toggle(g) },
              h('span', { className: 'chev' }, open ? '▾' : '▸'),
              h('span', { className: 'au-fold-title' }, g.title || g.id),
              bodies[g.id] ? h('span', { className: 'au-fold-count' }, t('countQuestions', { n: String(qs.length) })) : null),
            open ? h('div', { className: 'au-fold-body' }, qs.length ? h(SectionCards, { sections: qs }) : h('p', { className: 'au-dim' }, t('noDeep'))) : null)
        })))
}

function MaterialsPane({ data, onFetch, onError }) {
  const [openPath, setOpenPath] = React.useState(null)
  const [bodies, setBodies] = React.useState({})
  const files = (data && data.files || []).filter((p) => /^materials\/SRC-.*\.md$/.test(p) || p === 'materials/index.md')
  const fetchBody = async (p) => {
    if (openPath === p) { setOpenPath(null); return }
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
  // 本次会话内是否已确认选题：立即翻转确认按钮为「查看研究进度」，
  // 不依赖服务器里程碑延迟（orchestrator 把 research 标记成 active 有滞后，此时重按会重复触发 Group 00）。
  const [briefConfirmed, setBriefConfirmed] = React.useState(false)

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
    let ok = false
    try {
      await drivePrompt(ctx, id, message)
      await load()
      flashTimeout(t('sentFlash', { msg: message.slice(0, 60) }))
      ok = true
    } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
    return ok
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
    await drive(confirmPointsMsg())
  }
  const confirmOutline = async () => {
    await drive(confirmOutlineMsg())
  }
  const acceptArticle = async () => {
    setBusy(true); setErr('')
    try {
      await rpc(ctx, 'project.accept', { id })
      await drive(acceptArticleMsg())
    } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
  }
  const submitExperts = async (experts) => {
    const r = await rpc(ctx, 'project.submitExperts', { id, experts })
    await drive(submitExpertsMsg(r.count))
  }
  const skipExperts = async () => {
    await rpc(ctx, 'project.submitExperts', { id, skip: true })
    await drive(skipExpertsMsg())
  }
  const deleteProject = async () => {
    if (!window.confirm(t('delConfirm', { t: (data && data.record && data.record.title) || id }))) return
    try { await rpc(ctx, 'project.delete', { id }); location && location.reload && location.reload() } catch (e) { setErr(String((e && e.message) || e)) }
  }
  // pictor 同款：brief 就位后自动把项目名改写为 AI 建议名，仅『同份 brief 未应用过
  // 且 用户未手动改过名』时执行一次；此后手动改名保留、不再回改。
  const lastAppliedBrief = React.useRef('')
  const manualRenameRef = React.useRef(false)
  React.useEffect(() => {
    if (!data || !data.texts || !data.texts.brief) return
    const m = data.texts.brief.match(/^Title:\s*(.+)$/mi)
    const proposed = m ? m[1].trim() : ''
    if (!proposed) return
    if (manualRenameRef.current) return
    if (data.record && data.record.title === proposed) { lastAppliedBrief.current = proposed; return }
    if (lastAppliedBrief.current === proposed) return
    rpc(ctx, 'project.rename', { id, title: proposed })
      .then(() => { lastAppliedBrief.current = proposed; load() })
      .catch(() => {})
  }, [data && data.texts && data.texts.brief, data && data.record && data.record.title, id])

  const rename = async () => {
    const title = nameDraft.trim()
    if (!title) return
    manualRenameRef.current = true
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
      case 'confirm': return h(BriefPane, {
        data,
        busy,
        researchStarted: briefConfirmed || mSt('research') !== 'waiting',
        researchFailed: mSt('research') === 'failed',
        researchStatus: mSt('research'),
        onManual: () => { manualRenameRef.current = true },
        onNext: () => setStep('research'),
        onConfirm: async (t) => {
          const name = String(t || '').trim() || (data.record && data.record.title)
          setBusy(true); setErr('')
          try {
            await rpc(ctx, 'project.rename', { id, title: name })
            const ok = await drive(group0ConfirmMsg(name))
            if (ok) setBriefConfirmed(true)
          } catch (e) { setErr(String((e && e.message) || e)) } finally { setBusy(false) }
        },
      })
      case 'research': return h(ResearchPane, { data, onFetch: fetchFile, onError: setErr, base: '01.research/' })
      case 'expert': return h(ExpertGatePane, {
        stage: mSt('expert'), insights: data.indexes.expert,
        onSubmit: submitExperts, onSkip: skipExperts, onFetch: fetchFile, base: '03.expert-insights/',
      })
      case 'deep': return h(DeepPane, { data, onFetch: fetchFile, onError: setErr, base: '05.deep-research/' })
      case 'points': return h(ArtifactText, {
        ...artifactProps(t('pointsTitle'), 'points', '06.commentary-points/commentary-points.md', t('pointsHint'), 'points'),
        status: mSt('points'),
        renderBody: (md) => h(SectionCards, { sections: parsePoints(md) }),
      })
      case 'outline': return h(ArtifactText, {
        ...artifactProps(t('outlineTitle'), 'outline', '07.outline/outline.md', t('outlineHint'), 'outline'),
        status: mSt('outline'),
        renderBody: (md) => h(SectionCards, { sections: parseSections(md) }),
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
      data.texts.article ? h('button', { className: 'au-btn ghost', onClick: () => blobDownload(slugTitle(data.record.title) + '.md', data.texts.article) }, t('downloadMd')) : null,
      stage === 'gated' ? h('button', { className: 'au-btn primary', onClick: onAccept }, t('acceptArticle')) : null),
    h('div', { className: 'au-article' }, data.texts.article ? h(MiniMarkdown, { text: data.texts.article }) : h('p', { className: 'au-dim' }, stage === 'waiting' ? t('stepWaiting') : t('runningMarker'))),
    stage === 'done' ? h('p', { className: 'au-note' }, t('acceptedMsg')) : null,
    h('div', { className: 'au-fold-list' },
      h('div', { className: 'au-fold' },
        h('button', { className: 'au-fold-head' }, 'article-metadata.md'),
        h('div', { className: 'au-fold-body' }, data.texts.articleMetadata ? h(MiniMarkdown, { text: data.texts.articleMetadata }) : null))))
}


// ---------- 新建 ----------

function group0ConfirmMsg(name) {
  return langStore.val === 'en'
    ? 'The brief is confirmed (project name: ' + name + '). Now execute Group 00: run the 10-angle parallel research and synthesize the initial summary, advancing automatically until the expert-material gate, then stop.'
    : '选题已确认（项目名：' + name + '）。现在执行 Group 00：十角度并行研究并综合出初始摘要，自动推进到专家素材门停下。'
}

function confirmPointsMsg() {
  return langStore.val === 'en'
    ? 'Commentary points are confirmed as final (06.commentary-points/commentary-points.md, honoring manual edits). Draft the article outline and stop at the outline gate for approval.'
    : '已确认评论要点定稿（06.commentary-points/commentary-points.md 以人工编辑保存的内容为准），据此生成文章提纲，到提纲门停下等确认。'
}
function confirmOutlineMsg() {
  return langStore.val === 'en'
    ? 'The outline is confirmed as final (07.outline/outline.md, honoring manual edits). Write the full article and stop at the article review gate.'
    : '已确认文章提纲定稿（07.outline/outline.md 以人工编辑保存的内容为准），据此撰写全文，出稿后到成稿评审门停下。'
}
function acceptArticleMsg() {
  return langStore.val === 'en'
    ? 'The editorial office has accepted the article as final (08.article/accepted.json marked). Close the run.'
    : '编辑部已对文章定稿（08.article/accepted.json 已标记），收口本次流程。'
}
function submitExpertsMsg(count) {
  return langStore.val === 'en'
    ? 'Expert interview material submitted (' + count + ' experts, see input/expert/). Begin deep analysis: structure the expert material, generate research questions, run grouped deep research, and advance straight to the commentary-points gate.'
    : '已完成专家访谈素材提交（' + count + ' 位，见 input/expert/），开始深度分析：结构化专家素材、生成研究问题、按分组深研，一路推进到评论要点门停下。'
}
function skipExpertsMsg() {
  return langStore.val === 'en'
    ? 'The editorial office chose to skip expert interviews (input/expert/skip.json marked). Proceed directly to question generation and deep research, and stop at the commentary-points gate.'
    : '编辑部选择跳过专家访谈（input/expert/skip.json 已标记），直接进入问题生成与深度研究，推进到评论要点门停下。'
}

function NewProjectPane({ ctx, onCreate }) {
  const [lead, setLead] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const briefMsg = () => (langStore.val === 'en'
    ? 'Phase 0 (Brief): read agents/00.brief.md and execute it strictly per that Blueprint. Inputs are input/news-lead.md and input/editor-notes.md. Write input/brief.md, then stop.'
    : '第一阶段（Brief）：严格按 agents/00.brief.md 蓝图执行。输入见 input/news-lead.md 与 input/editor-notes.md。写入 input/brief.md 后停下。')
  const submit = async () => {
    if (!lead.trim()) return
    setBusy(true); setErr('')
    try {
      const r = await rpc(ctx, 'project.create', { newsLead: lead.trim(), editorNotes: notes.trim() })
      const t0 = lead.trim().split(/\n/)[0].trim()
      const derived = t0.length > 60 ? t0.slice(0, 60) + '…' : t0
      await rpc(ctx, 'project.rename', { id: r.id, title: derived })
      drivePrompt(ctx, r.id, briefMsg()).catch((e) => { setErr(t('createFailed') + '（Brief 未生成，仍可在项目内重试）：' + String((e && e.message) || e)) })
      if (onCreate) await onCreate(r.id)
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
    // 左侧状态灯（pomasa 同款）：取项目当前所处里程碑的状态着色
    const cur = (p.milestones || []).find((m) => m && m.key === stage)
    const status = stage === 'done' ? 'done' : (cur ? cur.status : 'waiting')
    return h('button', { key: p.id, className: 'au-nav-item' + (selected === p.id ? ' on' : ''), onClick: () => pick(p) },
      h('span', { className: 'au-nav-dot ' + statusCls(status) }),
      h('div', { className: 'au-nav-item-body' },
        h('div', { className: 'au-nav-item-title' }, p.title || p.id),
        h('div', { className: 'au-nav-item-meta' },
          h('span', { className: 'au-badge ' + statusCls(stage) }, I18N.zh[stageKey] ? t(stageKey) : stage),
          p.running ? h('span', { className: 'au-dot-run' }) : null,
          h('span', { className: 'au-dim' }, (p.createdAt || '').slice(0, 10)))))
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
.au-root { font-family: var(--dsw-alias-font-family, -apple-system, "PingFang SC", "Segoe UI", sans-serif); font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; color: var(--dsw-alias-label-primary, #1f2329); }
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
.au-nav-item { position: relative; display: flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; padding: 8px 10px 8px 14px; border-radius: 8px; margin-bottom: 2px; background: transparent; }
.au-nav-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05)); }
.au-nav-item.on { background: var(--dsw-alias-bg-layer-2, #f5f5f5); }
.au-nav-item.on::before { content: ''; position: absolute; left: 4px; top: 9px; bottom: 9px; width: 3px; border-radius: 3px; background: var(--dsw-alias-state-business-primary, #4f7cff); }
.au-nav-item-body { flex: 1; min-width: 0; }
.au-nav-item-title { font-weight: 600; font-size: 15px; word-break: break-word; }
.au-nav-item-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12.5px; }
/* 左侧状态灯（pomasa 同款）：7px 圆点，状态类着色，色彩与阶段条圆点一致 */
.au-nav-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: none; margin-top: 7px; }
.au-nav-dot.au-st-wait { color: #b0b0b0; }
.au-nav-dot.au-st-run { color: #b45309; }
.au-nav-dot.au-st-gate { color: #2563eb; }
.au-nav-dot.au-st-done { color: #15803d; }
.au-nav-dot.au-st-fail { color: #dc2626; }
.au-nav-dot.au-st-skip { color: #a3a3a3; }
.au-badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; }
.au-dot-run { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-warn-primary, #d97706); display: inline-block; }

.au-root .au-btn { border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); background: var(--dsw-alias-bg-layer-2, #f5f5f5); color: var(--dsw-alias-label-primary, #1f2329); border-radius: 8px; padding: 7px 14px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease; user-select: none; white-space: nowrap; }
.au-root .au-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05))); border-color: var(--dsw-alias-border-l3, #d0d0d0); }
.au-root .au-btn:active { transform: translateY(0.5px); }
.au-root .au-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #4f7cff); outline-offset: 2px; }
.au-root .au-btn-new { border: 1px solid transparent; background: var(--dsw-alias-button-primary-fill, #4f7cff); color: var(--dsw-alias-label-primary-foreground, #fff); border-radius: 8px; padding: 5px 12px; font-size: 13.5px; font-weight: 550; cursor: pointer; white-space: nowrap; flex: none; box-shadow: 0 1px 2px rgba(0,0,0,0.12); transition: background 140ms ease; }
.au-root .au-btn-new:hover { background: var(--dsw-alias-button-primary-hover, #3a6ae0); }
.au-root .au-btn.primary { background: var(--dsw-alias-button-primary-fill, #4f7cff); border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); font-weight: 550; box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
.au-root .au-btn.primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover, #3a6ae0); }
.au-root .au-btn.ghost { background: transparent; border-color: transparent; color: var(--dsw-alias-label-dimmed, #777); }
.au-root .au-btn.ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05)); color: var(--dsw-alias-label-primary, #1f2329); border-color: transparent; }
.au-root .au-btn.link { color: var(--dsw-alias-label-secondary, #666); text-decoration: underline; font-size: 13px; background: transparent; border-color: transparent; padding: 4px 6px; }
.au-root .au-btn.danger { color: var(--dsw-alias-state-error-primary, #dc2626) !important; }
.au-root .au-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

.au-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 24px; text-align: center; gap: 10px; color: var(--dsw-alias-label-dimmed, #777); border: 1px dashed var(--dsw-alias-border-l2, #e8e8e8); border-radius: 14px; background: var(--dsw-alias-bg-layer-1, #fafafa); }
.au-empty-hero { border: none; background: transparent; padding: 56px 28px; gap: 12px; }
.au-empty-fig { font-size: 44px; line-height: 1; opacity: 0.5; margin: 0; }
.au-empty-img { width: 200px; height: 200px; object-fit: cover; display: block; margin: 0; -webkit-mask-image: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); mask-image: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); }
.au-hero { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 24px 28px; }
.au-empty-title { font-size: 16px; font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); margin: 0; }
.au-empty-hint { font-size: 14px; color: var(--dsw-alias-label-dimmed, #777); margin: 0; }
.au-empty-hero .au-empty-title { font-size: 20px; font-weight: 650; letter-spacing: -0.01em; }
.au-empty-hero .au-empty-hint { font-size: 14.5px; line-height: 1.65; max-width: 440px; }

.au-stages { display: flex; gap: 6px; margin: 14px 14px 6px; overflow-x: auto; }
/* 前缀 .au-root 抬优先级：reset（.au-root button）会把单类 .au-stage 的边框/背景清零（同 .au-btn 家族的写法） */
.au-root .au-stage { flex: 1 1 0; min-width: 0; white-space: nowrap; overflow: hidden; border: 1px solid var(--dsw-alias-border-l2, #d8d8d8); background: var(--dsw-alias-bg-layer-2, #fff); border-radius: 12px; padding: 8px 10px; cursor: pointer; font-size: 13px; font-weight: 600; text-align: left; color: var(--dsw-alias-label-secondary, #666); transition: border-color 150ms ease, background 140ms ease; }
.au-root .au-stage:hover { border-color: var(--dsw-alias-border-l1, #aaa); }
.au-root .au-stage.on { border-color: var(--dsw-alias-accent, #4f7cff); color: var(--dsw-alias-label-primary, #1a1a1a); }
.au-root .au-stage .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; background: var(--dsw-alias-border-l2, #ccc); }
.au-root .au-st-wait .dot { background: #b0b0b0; }
.au-root .au-st-run .dot { background: #b45309; }
.au-root .au-st-gate .dot { background: #2563eb; }
.au-root .au-st-done .dot { background: #15803d; }
.au-root .au-st-fail .dot { background: #dc2626; }
.au-root .au-st-skip .dot { background: #a3a3a3; }

.au-pane-title { font-size: 19px; font-weight: 650; margin: 20px 0 6px; }
.au-pane-hint { color: var(--dsw-alias-label-secondary, #666); font-size: 13.5px; margin: 2px 0 12px; }
.au-reading { margin-bottom: 16px; }
.au-md { font-size: 14.5px; line-height: 1.7; color: var(--dsw-alias-label-primary, #1f2329); }
.au-md h1, .au-md h2, .au-md h3 { font-weight: 600; margin: 1.1em 0 0.45em; letter-spacing: -0.005em; scroll-margin-top: 10px; }
.au-md h1 { font-size: 21px; }
.au-md h2 { font-size: 18px; }
.au-md h3 { font-size: 15px; }
.au-md p { margin: 7px 0; }
.au-md ul, .au-md ol { margin: 6px 0 6px 22px; }
.au-md li { margin: 3px 0; }
.au-md blockquote { border-left: 3px solid var(--dsw-alias-border-l3, #d0d0d0); padding-left: 12px; color: var(--dsw-alias-label-secondary, #555); margin: 8px 0; }
.au-md hr { border: none; border-top: 1px solid var(--dsw-alias-border-l2, #e8e8e8); margin: 14px 0; }
.au-md a { color: var(--dsw-alias-state-business-primary, #4f7cff); text-decoration: underline; }
.au-md img { max-width: 100%; }
.au-md code { background: var(--dsw-alias-bg-layer-2, #f5f5f5); border-radius: 5px; padding: 1px 6px; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.au-md pre { background: var(--dsw-alias-bg-layer-2, #f5f5f5); border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); border-radius: 10px; padding: 12px 14px; overflow-x: auto; margin: 10px 0; }
.au-md pre code { background: none; padding: 0; border: none; }
.au-md-table-wrap { overflow-x: auto; }
.au-md table { border-collapse: collapse; margin: 10px 0; font-size: 13.5px; width: 100%; }
.au-md th, .au-md td { border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); padding: 6px 12px; text-align: left; }
.au-md th { background: var(--dsw-alias-bg-layer-2, #f5f5f5); font-weight: 600; }
/* markdown-it-footnote 输出 */
.au-md-footnotes-title { font-size: 12px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-caption, #999); margin-top: 22px; border-top: 1px solid var(--dsw-alias-border-l2, #e8e8e8); padding-top: 10px; }
.au-md .footnotes { margin-top: 4px; }
.au-md .footnotes-list { margin: 4px 0 0 22px; font-size: 13px; color: var(--dsw-alias-label-secondary, #666); }
.au-md .footnote-item { margin: 4px 0; }
.au-md .footnote-ref { font-size: 11px; font-weight: 600; color: var(--dsw-alias-state-business-primary, #4f7cff); margin: 0 1px; }
.au-md .footnote-ref a { text-decoration: none; color: inherit; }
.au-md .footnote-backref { text-decoration: none; color: var(--dsw-alias-label-caption, #999); font-size: 12px; margin-left: 4px; }
.au-root .au-summary-card { display: flex; flex-direction: column; gap: 8px; width: 100%; text-align: left; padding: 16px 18px; border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); border-radius: 14px; background: var(--dsw-alias-bg-layer-1, #fafafa); cursor: pointer; transition: border-color 150ms ease, box-shadow 150ms ease; margin-bottom: 6px; }
.au-root .au-summary-card:hover { border-color: var(--dsw-alias-border-l3, #c8c8c8); box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
.au-summary-preview { font-size: 14px; line-height: 1.65; color: var(--dsw-alias-label-primary, #1f2329); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.au-summary-hint { font-size: 12.5px; color: var(--dsw-alias-state-business-primary, #4f7cff); font-weight: 500; }
.au-toc-title { font-size: 12px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-caption, #999); margin-bottom: 8px; }
.au-toc-item { display: block; width: 100%; text-align: left; font-size: 12.5px; line-height: 1.45; padding: 4px 6px; border-radius: 6px; color: var(--dsw-alias-label-secondary, #666); }
.au-toc-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05)); color: var(--dsw-alias-label-primary, #1f2329); }
.au-toc-item.sub { padding-left: 14px; }
.au-plan { background: var(--dsw-alias-bg-layer-1, #fafafa); border-radius: 12px; padding: 14px 18px; margin: 4px 0 16px; }
.au-plan-title { font-size: 13.5px; font-weight: 650; margin-bottom: 8px; }
.au-plan-step { font-size: 13.5px; color: var(--dsw-alias-label-secondary, #666); line-height: 1.7; }
.au-dim { color: var(--dsw-alias-label-caption, #999); font-size: 13px; }

.au-fold-list { margin-top: 8px; }
.au-angle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.au-root .au-angle-card { display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); border-radius: 12px; background: var(--dsw-alias-bg-layer-1, #fafafa); cursor: pointer; transition: border-color 150ms ease, box-shadow 150ms ease; }
.au-root .au-angle-card:hover { border-color: var(--dsw-alias-border-l3, #c8c8c8); box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
.au-angle-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.au-angle-name { font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em; color: var(--dsw-alias-label-primary, #1f2329); }
.au-angle-count { font-size: 12px; color: var(--dsw-alias-label-caption, #999); white-space: nowrap; }
.au-angle-excerpt { font-size: 13px; color: var(--dsw-alias-label-secondary, #666); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.au-root .au-insight-card { display: flex; flex-direction: column; gap: 4px; text-align: left; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); border-radius: 12px; background: var(--dsw-alias-bg-layer-1, #fafafa); cursor: pointer; transition: border-color 150ms ease, box-shadow 150ms ease; }
.au-root .au-insight-card:hover { border-color: var(--dsw-alias-border-l3, #c8c8c8); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); }
.au-insight-name { font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em; color: var(--dsw-alias-label-primary, #1f2329); word-break: break-word; }
.au-insight-role { font-size: 12px; color: var(--dsw-alias-label-caption, #999); }
.au-insight-raw { font-size: 13px; color: var(--dsw-alias-label-secondary, #666); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.au-modal { position: fixed; inset: 0; z-index: 70; background: var(--dsw-alias-bg-mask-2, rgba(0, 0, 0, 0.4)); display: flex; align-items: center; justify-content: center; padding: 24px; }
.au-modal-box { width: min(760px, 100%); max-height: 82vh; display: flex; flex-direction: column; background: var(--dsw-alias-bg-layer-1, #fafafa); border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); border-radius: 14px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22); overflow: hidden; }
.au-modal-box.wide { width: min(980px, 96vw); max-height: 88vh; }
.au-modal-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--dsw-alias-border-l2, #e0e0e0); }
.au-modal-title { font-size: 16px; font-weight: 600; flex: 1; min-width: 0; }
.au-modal-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 26px; line-height: 1.7; font-size: 14.5px; }
.au-modal-toc-layout { display: flex; gap: 22px; align-items: flex-start; }
.au-modal-toc { position: sticky; top: 0; flex: none; width: 200px; max-height: 70vh; overflow-y: auto; padding: 2px 0; }
.au-modal-main { flex: 1; min-width: 0; }
.au-fold { border: 1px solid var(--dsw-alias-border-l1, #f0f0f0); border-radius: 12px; margin-bottom: 6px; overflow: hidden; }
.au-fold-head { display: flex; width: 100%; align-items: center; gap: 8px; padding: 9px 12px; text-align: left; font-size: 14px; }
.au-fold-head:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.03)); }
.au-fold-body { padding: 4px 14px 12px; border-top: 1px solid var(--dsw-alias-border-l1, #f0f0f0); }
.au-fold-title { flex: 1; min-width: 0; font-weight: 550; }
.au-fold-count { font-size: 12px; color: var(--dsw-alias-label-caption, #999); }
.au-section-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 4px; }
.au-root .au-section-card { display: flex; flex-direction: column; gap: 5px; text-align: left; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l2, #e0e0e0); border-radius: 12px; background: var(--dsw-alias-bg-layer-1, #fafafa); cursor: pointer; transition: border-color 150ms ease, box-shadow 150ms ease; }
.au-root .au-section-card:hover { border-color: var(--dsw-alias-border-l3, #c8c8c8); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); }
.au-section-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: var(--dsw-alias-label-primary, #1f2329); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.au-section-tag { align-self: flex-start; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; color: var(--dsw-alias-state-warn-primary, #b45309); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #b45309) 10%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #b45309) 28%, transparent); border-radius: 999px; padding: 1px 8px; }
.au-section-sub { font-size: 12px; color: var(--dsw-alias-label-caption, #999); }
.au-section-brief { font-size: 13px; color: var(--dsw-alias-label-secondary, #666); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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
.au-note { font-size: 13.5px; line-height: 1.55; color: var(--dsw-alias-state-success-primary, #15803d); background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #15803d) 7%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #15803d) 20%, transparent); border-radius: 10px; padding: 9px 13px; margin: 2px 0 12px; }
.au-note.err { color: var(--dsw-alias-state-error-primary, #dc2626); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc2626) 7%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc2626) 20%, transparent); }

.au-fold.discuss { margin: 8px 12px 14px; }
.discuss-input { min-height: 60px; resize: vertical; }

.au-settings-row { display: flex; gap: 10px; margin: 6px 0; font-size: 14px; }
.au-settings-k { color: var(--dsw-alias-label-secondary, #666); min-width: 100px; }

`

// build.mjs 包装时在 factory 内追加 `return { inject, apply }`
