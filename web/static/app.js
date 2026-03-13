/* ============================================================
   Auctor Viewer — Single-Page Application
   ============================================================ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// --- API helpers ---

async function api(path) {
  const res = await fetch(path);
  return res.json();
}

async function fetchFile(projectId, relPath) {
  const data = await api(`/api/project/${projectId}/file?path=${encodeURIComponent(relPath)}`);
  return data.content || '';
}

async function fetchTree(projectId) {
  return api(`/api/project/${projectId}/tree`);
}

// --- Markdown rendering ---

function renderMd(text) {
  return marked.parse(text);
}

// --- State ---

let currentProject = null;
let currentStage = null;
let projectTree = [];

// --- Navigation stages definition ---

const STAGES = [
  { id: 'research',    label: 'Stage 1',  name: 'Background Research',  dir: '01.research' },
  { id: 'summary',     label: 'Stage 2',  name: 'Summary',              file: '02.summary/initial-summary.md' },
  { id: 'experts',     label: 'Stage 3',  name: 'Expert Insights',      dir: '03.expert-insights' },
  { id: 'questions',   label: 'Stage 4',  name: 'Research Questions',   file: '04.research-questions/research-questions.md' },
  { id: 'deep',        label: 'Stage 5',  name: 'Deep Research',        dir: '05.deep-research' },
  { id: 'commentary',  label: 'Stage 6',  name: 'Commentary Points',    file: '06.commentary-points/commentary-points.md' },
  { id: 'outline',     label: 'Stage 7',  name: 'Outline',              file: '07.outline/outline.md' },
  { id: 'article',     label: 'Stage 8',  name: 'Article',              file: '08.article/article.md' },
  { id: 'materials',   label: '',          name: 'Materials Library',    dir: 'materials' },
];

// --- Layer grouping for Stage 1 ---

const RESEARCH_LAYERS = [
  { name: 'Factual',  angles: ['A-event-overview', 'B-statistical-data'] },
  { name: 'Context',  angles: ['C-historical-context', 'D-domain-knowledge', 'E-academic-research'] },
  { name: 'Reaction', angles: ['F-government-positions', 'G-media-coverage', 'H-expert-commentary'] },
  { name: 'Analysis', angles: ['I-geopolitics', 'J-impact-outlook'] },
];

// --- Routing ---

function setHash(hash) {
  if (location.hash !== hash) location.hash = hash;
}

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return { page: 'home' };
  const parts = h.split('/');
  return { page: 'project', projectId: parts[0], stageId: parts[1] || null };
}

async function handleRoute() {
  const route = parseRoute();
  if (route.page === 'home') {
    if (currentProject) { showHome(); await loadHome(); }
  } else {
    if (currentProject !== route.projectId) {
      await openProject(route.projectId, route.stageId);
    } else if (route.stageId && currentStage !== route.stageId) {
      loadStage(route.stageId);
    }
  }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  const route = parseRoute();
  if (route.page === 'project') {
    loadHome(); // preload project list in background
    openProject(route.projectId, route.stageId);
  } else {
    loadHome();
  }
  $('#back-home').addEventListener('click', (e) => {
    e.preventDefault();
    setHash('#/');
  });
  window.addEventListener('hashchange', handleRoute);
});

// --- Homepage ---

async function loadHome() {
  const projects = await api('/api/projects');
  const grid = $('#project-grid');
  grid.innerHTML = '';
  if (projects.length === 0) {
    grid.innerHTML = '<p class="loading">No projects found in workspace/</p>';
    return;
  }
  for (const p of projects) {
    const card = document.createElement('div');
    card.className = 'project-card';
    let lead = p.news_lead || '';
    // Strip leading URL prefix (e.g. "https://... — actual text")
    if (lead.match(/^https?:\/\/\S+\s*[—–-]\s*/)) {
      lead = lead.replace(/^https?:\/\/\S+\s*[—–-]\s*/, '');
    }
    const shortLead = lead.length > 200 ? lead.slice(0, 200) + '...' : lead;
    const displayTitle = p.title || p.id;
    card.innerHTML = `
      <div class="project-card-date">${p.start_time || p.id}</div>
      <h3 class="project-card-title">${escHtml(displayTitle)}</h3>
      <p class="project-card-lead">${escHtml(shortLead)}</p>
      <div class="project-card-status">${escHtml(p.status || '')}</div>
    `;
    card.addEventListener('click', () => setHash(`#/${p.id}`));
    grid.appendChild(card);
  }
}

function showHome() {
  $('#home-view').classList.remove('hidden');
  $('#project-view').classList.add('hidden');
  currentProject = null;
  currentStage = null;
}

// --- Project view ---

async function openProject(projectId, initialStageId) {
  currentProject = projectId;
  const [tree, projects, durations] = await Promise.all([
    fetchTree(projectId),
    api('/api/projects'),
    api(`/api/project/${projectId}/durations`),
  ]);
  projectTree = tree;

  const projectMeta = projects.find(p => p.id === projectId) || {};
  const displayTitle = projectMeta.title || projectId;

  // Set sidebar title
  $('#sidebar-title').textContent = displayTitle;

  // Build sidebar nav — only show stages that exist
  const nav = $('#sidebar-nav');
  nav.innerHTML = '';
  for (const stage of STAGES) {
    const exists = stageExists(stage);
    if (!exists) continue;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.dataset.stage = stage.id;
    const dur = durations[stage.id];
    const durHtml = dur ? `<span class="nav-duration">${dur.label}</span>` : '';
    const icon = stage.id === 'materials' ? '<span class="nav-icon">&#x1F4DA;</span>' : '';
    a.innerHTML = `${stage.label ? `<span class="nav-label">${stage.label}</span>` : ''}${icon}${stage.name}${durHtml}`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setHash(`#/${currentProject}/${stage.id}`);
    });
    if (stage.id === 'materials') li.classList.add('nav-materials');
    li.appendChild(a);
    nav.appendChild(li);
  }

  $('#home-view').classList.add('hidden');
  $('#project-view').classList.remove('hidden');

  // Load requested stage or first available
  const targetStage = initialStageId && STAGES.find(s => s.id === initialStageId && stageExists(s));
  const first = targetStage || STAGES.find(s => stageExists(s));
  if (first) loadStage(first.id);
}

function stageExists(stage) {
  if (stage.file) return projectTree.includes(stage.file);
  if (stage.dir) return projectTree.some(f => f.startsWith(stage.dir + '/'));
  return false;
}

async function loadStage(stageId) {
  currentStage = stageId;
  setHash(`#/${currentProject}/${stageId}`);

  // Update active nav
  $$('.sidebar-nav a').forEach(a => a.classList.toggle('active', a.dataset.stage === stageId));

  const inner = $('#content-inner');
  inner.innerHTML = '<p class="loading">Loading...</p>';

  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return;

  try {
    switch (stageId) {
      case 'research':   await renderResearch(inner); break;
      case 'summary':    await renderMarkdownFile(inner, stage, 'Summary'); break;
      case 'experts':    await renderExperts(inner); break;
      case 'questions':  await renderQuestions(inner); break;
      case 'deep':       await renderDeepResearch(inner); break;
      case 'commentary': await renderCommentary(inner); break;
      case 'outline':    await renderOutline(inner); break;
      case 'article':    await renderArticle(inner); break;
      case 'materials':  await renderMaterials(inner); break;
    }
  } catch (err) {
    inner.innerHTML = `<p class="loading">Error: ${escHtml(err.message)}</p>`;
  }
}

// --- Stage 1: Background Research ---

async function renderResearch(el) {
  const header = stageHeader('Stage 1', 'Background Research');

  // Discover available angles from tree
  const angleDirs = [...new Set(
    projectTree
      .filter(f => f.startsWith('01.research/') && f.endsWith('/excerpts.md'))
      .map(f => f.split('/')[1])
  )].sort();

  let html = header;

  for (const layer of RESEARCH_LAYERS) {
    const layerAngles = layer.angles.filter(a => angleDirs.includes(a));
    if (layerAngles.length === 0) continue;

    html += `<div class="accordion-group">
      <div class="accordion-group-title">${layer.name} Layer</div>`;

    for (const angle of layerAngles) {
      const label = angle.replace(/^[A-Z]-/, '').replace(/-/g, ' ');
      html += `<div class="accordion-item" data-angle="${angle}">
        <button class="accordion-trigger">
          <span>${capitalize(label)}</span>
          <span class="count">loading...</span>
        </button>
        <div class="accordion-body"></div>
      </div>`;
    }
    html += `</div>`;
  }

  // Also show any angles not in predefined layers
  const knownAngles = RESEARCH_LAYERS.flatMap(l => l.angles);
  const extraAngles = angleDirs.filter(a => !knownAngles.includes(a));
  if (extraAngles.length > 0) {
    html += `<div class="accordion-group"><div class="accordion-group-title">Other</div>`;
    for (const angle of extraAngles) {
      html += `<div class="accordion-item" data-angle="${angle}">
        <button class="accordion-trigger"><span>${capitalize(angle.replace(/-/g, ' '))}</span><span class="count"></span></button>
        <div class="accordion-body"></div>
      </div>`;
    }
    html += `</div>`;
  }

  el.innerHTML = html;

  // Load excerpts for each angle
  for (const angle of angleDirs) {
    loadExcerpts(`01.research/${angle}/excerpts.md`, el.querySelector(`[data-angle="${angle}"]`));
  }

  // Accordion clicks
  el.addEventListener('click', (e) => {
    const trigger = e.target.closest('.accordion-trigger');
    if (trigger) trigger.closest('.accordion-item').classList.toggle('open');
  });
}

async function loadExcerpts(filePath, itemEl) {
  const text = await fetchFile(currentProject, filePath);
  const excerpts = parseExcerpts(text);
  const countEl = itemEl.querySelector('.count');
  countEl.textContent = `${excerpts.length} excerpts`;
  const body = itemEl.querySelector('.accordion-body');
  body.innerHTML = excerpts.map(ex => excerptCardHtml(ex)).join('');
}

function parseExcerpts(text) {
  const excerpts = [];
  // Split by ## [ID] or ### [ID] pattern (initial research uses ##, deep research uses ###)
  const blocks = text.split(/^#{2,3} /m).slice(1);
  for (const block of blocks) {
    const lines = block.split('\n');
    const headerMatch = lines[0].match(/^\[([^\]]+)\]\s*(.*)/);
    if (!headerMatch) continue;
    const id = headerMatch[1];
    const title = headerMatch[2];
    const sourceMatch = block.match(/\*\*Source\*\*:\s*(.+)/);
    const relevanceMatch = block.match(/\*\*Relevance\*\*:\s*(.+)/);
    // Extract blockquote
    const quoteLines = [];
    let inQuote = false;
    for (const line of lines) {
      if (line.startsWith('> ')) {
        inQuote = true;
        quoteLines.push(line.slice(2));
      } else if (inQuote && line === '>') {
        quoteLines.push('');
      } else if (inQuote) {
        inQuote = false;
      }
    }
    excerpts.push({
      id,
      title,
      source: sourceMatch ? sourceMatch[1] : '',
      relevance: relevanceMatch ? relevanceMatch[1] : '',
      quote: quoteLines.join('\n'),
    });
  }
  return excerpts;
}

function excerptCardHtml(ex) {
  return `<div class="excerpt-card">
    <div class="excerpt-card-header">
      <span class="excerpt-id">${escHtml(ex.id)}</span>
      <span class="excerpt-source">${escHtml(ex.source)}</span>
    </div>
    <div class="excerpt-title">${escHtml(ex.title)}</div>
    ${ex.relevance ? `<div class="excerpt-relevance">${escHtml(ex.relevance)}</div>` : ''}
    ${ex.quote ? `<blockquote>${escHtml(ex.quote)}</blockquote>` : ''}
  </div>`;
}

// --- Stage 2: Summary (generic markdown render) ---

async function renderMarkdownFile(el, stage, title) {
  const text = await fetchFile(currentProject, stage.file);
  el.innerHTML = stageHeader(stage.label, title) + `<div class="md-rendered">${renderMd(text)}</div>`;
}

// --- Stage 3: Expert Insights ---

async function renderExperts(el) {
  const files = projectTree.filter(f => f.startsWith('03.expert-insights/') && f.endsWith('.md'));
  if (files.length === 0) {
    el.innerHTML = stageHeader('Stage 3', 'Expert Insights') + '<p class="loading">No expert files found.</p>';
    return;
  }

  let html = stageHeader('Stage 3', 'Expert Insights') + '<div class="expert-grid">';

  const experts = await Promise.all(files.map(async f => {
    const text = await fetchFile(currentProject, f);
    return parseExpertFile(text);
  }));

  for (let i = 0; i < experts.length; i++) {
    const ex = experts[i];
    html += `<div class="expert-card">
      <div class="expert-card-header">
        <h3 class="expert-name">${escHtml(ex.name)}</h3>
        <p class="expert-role">${escHtml(ex.role)}</p>
      </div>
      <div class="expert-card-body">
        <div class="expert-tabs" data-expert="${i}">
          <button class="expert-tab active" data-tab="core">Core Points</button>
          <button class="expert-tab" data-tab="quotes">Quotable</button>
          <button class="expert-tab" data-tab="raw">Raw Input</button>
        </div>
        <div class="expert-tab-content active" data-expert="${i}" data-tab="core">
          <div class="md-rendered">${renderMd(ex.corePoints)}</div>
        </div>
        <div class="expert-tab-content" data-expert="${i}" data-tab="quotes">
          <div class="md-rendered">${renderMd(ex.quotes)}</div>
        </div>
        <div class="expert-tab-content" data-expert="${i}" data-tab="raw">
          <div class="md-rendered">${renderMd(ex.raw)}</div>
        </div>
      </div>
    </div>`;
  }

  html += '</div>';
  el.innerHTML = html;

  // Card expand/collapse
  el.addEventListener('click', (e) => {
    const header = e.target.closest('.expert-card-header');
    if (header) {
      header.closest('.expert-card').classList.toggle('open');
      return;
    }
    // Tab switching
    const tabBtn = e.target.closest('.expert-tab');
    if (!tabBtn) return;
    const expertIdx = tabBtn.closest('.expert-tabs').dataset.expert;
    const tab = tabBtn.dataset.tab;
    // Update buttons
    $$(`[data-expert="${expertIdx}"] .expert-tab`, el).forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');
    // Update content
    $$(`[data-expert="${expertIdx}"].expert-tab-content`, el).forEach(c => c.classList.remove('active'));
    $(`[data-expert="${expertIdx}"][data-tab="${tab}"].expert-tab-content`, el)?.classList.add('active');
  });
}

function parseExpertFile(text) {
  const nameMatch = text.match(/- \*\*Name\*\*:\s*(.+)/);
  const roleMatch = text.match(/- \*\*Role\/Affiliation\*\*:\s*(.+)/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
  const role = roleMatch ? roleMatch[1].trim() : '';

  const sections = text.split(/^## /m);
  let raw = '', corePoints = '', quotes = '';
  for (const sec of sections) {
    if (sec.startsWith('Raw Input')) raw = sec.replace(/^Raw Input\s*\n/, '');
    else if (sec.startsWith('Core Points')) corePoints = sec.replace(/^Core Points\s*\n/, '');
    else if (sec.startsWith('Quotable Statements')) quotes = sec.replace(/^Quotable Statements\s*\n/, '');
  }

  return { name, role, raw, corePoints, quotes };
}

// --- Stage 4: Research Questions ---

async function renderQuestions(el) {
  const text = await fetchFile(currentProject, '04.research-questions/research-questions.md');
  let html = stageHeader('Stage 4', 'Research Questions');

  // Split by ## Category
  const catBlocks = text.split(/^## (Category [AB])/m);
  // catBlocks: ['preamble', 'Category A', 'content...', 'Category B', 'content...']

  let i = 1;
  while (i < catBlocks.length) {
    const catName = catBlocks[i];
    const catContent = catBlocks[i + 1] || '';
    const isCatA = catName.includes('Category A');
    const fullTitle = catContent.split('\n')[0]; // Rest of the heading text

    html += `<div class="rq-category ${isCatA ? 'rq-dimmed' : ''}">
      <div class="rq-category-title">${escHtml(catName)}${fullTitle ? ': ' + escHtml(fullTitle.replace(/^:\s*/, '')) : ''}</div>`;

    // Parse groups within category: ### headings
    const groups = catContent.split(/^### /m).slice(1);
    for (const group of groups) {
      const groupLines = group.split('\n');
      const groupTitle = groupLines[0].trim();
      const rest = groupLines.slice(1).join('\n');
      html += `<div class="rq-group">
        <div class="rq-group-header">${escHtml(groupTitle)}</div>
        <div class="rq-group-body"><div class="md-rendered">${renderMd(rest)}</div></div>
      </div>`;
    }
    html += `</div>`;
    i += 2;
  }

  el.innerHTML = html;

  // Collapsible click handler
  el.addEventListener('click', e => {
    const header = e.target.closest('.rq-group-header');
    if (header) header.closest('.rq-group').classList.toggle('open');
  });
}

// --- Stage 5: Deep Research ---

async function renderDeepResearch(el) {
  // Discover groups from directory listing
  const groups = [...new Set(
    projectTree
      .filter(f => f.startsWith('05.deep-research/') && f.endsWith('/excerpts.md'))
      .map(f => f.split('/')[1])
  )].sort();

  let html = stageHeader('Stage 5', 'Deep Research');
  html += '<div class="tab-bar">';
  for (let i = 0; i < groups.length; i++) {
    html += `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-group="${groups[i]}">${groups[i]}</button>`;
  }
  html += '</div>';

  for (let i = 0; i < groups.length; i++) {
    html += `<div class="tab-panel ${i === 0 ? 'active' : ''}" data-group="${groups[i]}">
      <p class="loading">Loading...</p>
    </div>`;
  }

  el.innerHTML = html;

  // Tab switching
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const group = btn.dataset.group;
    $$('.tab-btn', el).forEach(b => b.classList.toggle('active', b.dataset.group === group));
    $$('.tab-panel', el).forEach(p => p.classList.toggle('active', p.dataset.group === group));
  });

  // Load all groups
  for (const group of groups) {
    const panel = $(`[data-group="${group}"].tab-panel`, el);
    const text = await fetchFile(currentProject, `05.deep-research/${group}/excerpts.md`);
    const excerpts = parseExcerpts(text);
    panel.innerHTML = excerpts.length > 0
      ? excerpts.map(ex => excerptCardHtml(ex)).join('')
      : '<p class="loading">No excerpts.</p>';
  }
}

// --- Stage 6: Commentary Points ---

async function renderCommentary(el) {
  const text = await fetchFile(currentProject, '06.commentary-points/commentary-points.md');
  let html = stageHeader('Stage 6', 'Commentary Points');

  // Extract overall frame
  const frameMatch = text.match(/## Overall Analytical Frame\s*\n([\s\S]*?)(?=\n## )/);
  if (frameMatch) {
    html += `<div class="md-rendered" style="margin-bottom:2rem;border-left:3px solid var(--accent);padding-left:1rem;">
      ${renderMd(frameMatch[1])}
    </div>`;
  }

  // Parse points: ### Point N: Title [TYPE]
  const pointBlocks = text.split(/^### /m).slice(1);
  for (const block of pointBlocks) {
    if (!block.match(/^Point \d/)) continue;
    const lines = block.split('\n');
    const headerMatch = lines[0].match(/Point \d+:\s*(.*?)\s*\[(CORE|SECONDARY|SUPPORTING)\]/i);
    if (!headerMatch) continue;
    const title = headerMatch[1];
    const type = headerMatch[2].toLowerCase();

    const sections = {};
    const sectionNames = ['Claim', 'Factual Supports', 'Reader Value', 'Anticipated Criticism', 'Narrative Strategy'];
    for (const sName of sectionNames) {
      const re = new RegExp(`\\*\\*${sName}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`);
      const m = block.match(re);
      if (m) sections[sName] = m[1].trim();
    }

    html += `<div class="commentary-card">
      <div class="commentary-card-header">
        <span class="commentary-badge ${type}">${type}</span>
        <h3 class="commentary-title">${escHtml(title)}</h3>
      </div>
      <div class="commentary-card-body">`;

    for (const [sName, sBody] of Object.entries(sections)) {
      html += `<div class="commentary-section">
        <div class="commentary-section-label">${sName}</div>
        <div class="commentary-section-body md-rendered">${renderMd(sBody)}</div>
      </div>`;
    }
    html += `</div></div>`;
  }

  el.innerHTML = html;

  // Card expand/collapse
  el.addEventListener('click', (e) => {
    const header = e.target.closest('.commentary-card-header');
    if (header) header.closest('.commentary-card').classList.toggle('open');
  });
}

// --- Stage 7: Outline ---

async function renderOutline(el) {
  const text = await fetchFile(currentProject, '07.outline/outline.md');
  let html = stageHeader('Stage 7', 'Outline');

  // Extract working title
  const titleMatch = text.match(/## Working Title\s*\n(.+)/);
  if (titleMatch) {
    html += `<h3 style="font-weight:400;font-style:italic;margin-bottom:1rem;">${escHtml(titleMatch[1])}</h3>`;
  }

  // Extract narrative arc
  const arcMatch = text.match(/## Narrative Arc Summary\s*\n([\s\S]*?)(?=\n## )/);
  if (arcMatch) {
    html += `<div class="md-rendered" style="margin-bottom:2rem;font-size:0.9rem;color:var(--text-muted);">${renderMd(arcMatch[1])}</div>`;
  }

  // Parse sections: ### Section N: Title
  const sectionBlocks = text.split(/^### /m).slice(1);
  html += '<div class="outline-timeline">';
  for (const block of sectionBlocks) {
    if (!block.match(/^Section \d/)) continue;
    const lines = block.split('\n');
    const title = lines[0].replace(/Section \d+:\s*/, '').trim();

    const purposeMatch = block.match(/\*\*Purpose\*\*:\s*(.+)/);
    const budgetMatch = block.match(/\*\*Word Budget\*\*:\s*(.+)/);
    const materialsMatch = block.match(/\*\*Materials Used\*\*:\s*(.+)/);
    const expertMatch = block.match(/\*\*Expert Quotes\*\*:\s*([\s\S]*?)(?=\n\*\*|$)/);
    const descMatch = block.match(/\*\*Description\*\*:\s*([\s\S]*?)$/);

    html += `<div class="outline-node">
      <div class="outline-node-title">${escHtml(title)}</div>
      <div class="outline-node-meta">
        ${budgetMatch ? escHtml(budgetMatch[1]) : ''}
        ${materialsMatch ? ' · ' + escHtml(materialsMatch[1]) : ''}
      </div>
      ${purposeMatch ? `<div class="outline-node-desc"><strong>Purpose:</strong> ${escHtml(purposeMatch[1])}</div>` : ''}
      ${descMatch ? `<div class="outline-node-desc" style="margin-top:0.4rem">${escHtml(descMatch[1].trim().slice(0, 300))}${descMatch[1].trim().length > 300 ? '...' : ''}</div>` : ''}
    </div>`;
  }
  html += '</div>';

  el.innerHTML = html;
}

// --- Stage 8: Article ---

async function renderArticle(el) {
  const text = await fetchFile(currentProject, '08.article/article.md');
  // Render as a clean reading view
  el.innerHTML = `<div class="article-view">${renderMd(text)}</div>`;
}

// --- Materials Library ---

async function renderMaterials(el) {
  const indexText = await fetchFile(currentProject, 'materials/index.md');
  let html = stageHeader('', 'Materials Library');
  html += '<input class="materials-search" type="text" placeholder="Search by ID, title, or source type...">';

  // Parse the markdown table
  const rows = parseMarkdownTable(indexText);

  html += `<table class="materials-table">
    <thead><tr>
      <th>ID</th><th>Title</th><th>Source Type</th><th>Credibility</th>
    </tr></thead>
    <tbody>`;

  for (const row of rows) {
    html += `<tr data-src-id="${escAttr(row.id)}" data-search="${escAttr((row.id + ' ' + row.title + ' ' + row.type).toLowerCase())}">
      <td class="id-cell">${escHtml(row.id)}</td>
      <td class="title-cell">${escHtml(row.title)}</td>
      <td class="type-cell">${escHtml(row.type)}</td>
      <td class="cred-cell">${escHtml(row.credibility)}</td>
    </tr>`;
  }

  html += '</tbody></table>';
  el.innerHTML = html;

  // Search filtering
  const searchInput = $('.materials-search', el);
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    $$('.materials-table tbody tr', el).forEach(tr => {
      const match = !q || tr.dataset.search.includes(q);
      tr.style.display = match ? '' : 'none';
      // Hide any expanded content when filtering
      const next = tr.nextElementSibling;
      if (next && next.classList.contains('material-expanded-row')) {
        next.style.display = match ? '' : 'none';
      }
    });
  });

  // Click to expand source content
  el.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-src-id]');
    if (!tr) return;
    const srcId = tr.dataset.srcId;

    // Toggle existing expansion
    const existing = tr.nextElementSibling;
    if (existing && existing.classList.contains('material-expanded-row')) {
      existing.remove();
      return;
    }

    // Find the source file
    const srcFile = projectTree.find(f => f.startsWith('materials/') && f.includes(srcId));
    if (!srcFile) return;

    const expRow = document.createElement('tr');
    expRow.className = 'material-expanded-row';
    expRow.innerHTML = `<td colspan="4"><div class="material-expanded">Loading...</div></td>`;
    tr.after(expRow);

    fetchFile(currentProject, srcFile).then(content => {
      expRow.querySelector('.material-expanded').textContent = content;
    });
  });
}

function parseMarkdownTable(text) {
  const lines = text.split('\n').filter(l => l.startsWith('|'));
  if (lines.length < 3) return []; // header + separator + at least one row
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 4) {
      rows.push({
        id: cells[0],
        url: cells[1],
        title: cells[2],
        type: cells[3],
        credibility: cells[4] || '',
      });
    }
  }
  return rows;
}

// --- Helpers ---

function stageHeader(label, title) {
  return `<div class="stage-header">
    ${label ? `<div class="stage-label">${escHtml(label)}</div>` : ''}
    <h2>${escHtml(title)}</h2>
  </div>`;
}

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s) {
  return escHtml(s);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
