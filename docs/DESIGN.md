# Auctor — DSH 插件工作台设计（v1）

状态：v1（2026-09-06）。本稿对应代码存量：`03.systems/pomasa-studio` 与 `03.systems/pictor`（两个已发布 dsh 插件），auctor 本体此前位于 `05.experiments`（本次迁至 `03.systems/auctor`）。

## 0. 结论

Auctor 是一个 dsh 插件工作台：从一条新闻线索出发，走过"快速研究与摘要 → 专家素材 → 深度研究 → 评论要点 → 提纲 → 成稿"的固定流水线，产出可发表的深度评论。形态直接套 pictor 的壳，业务界面按 auctor 自己的舞台设计：

1. 安装后首次使用在机器上生成 `~/.auctor` 工作区（注册为 dsh 工作区「Auctor」），每个项目一个连贯 dsh 会话，GUI 只做两件事：查看信息、规整输入。
2. 唯一入口是 dsh 左下角 footer 按钮「Auctor」，开 `shell.overlay` 有界面板：左栏项目列表，右栏六段阶段条（快速研究 / 专家素材 / 深度研究 / 评论要点 / 提纲 / 成稿）+ 当前阶段内容 + 讨论面板。
3. 意识形态基础用 kritik（`references/domain/kritik/`，KR-01..07 固定版本），不再维护 ad-hoc 的 REF-MRX 文件；写作风格仍由 `style-guide.md`（Tricontinental dossier 风格）和 `editorial-line.md`（刊物身份）承载。
4. 不做 DOCX/PDF 导出。每阶段产物以 Markdown 呈现并提供「下载 Markdown」按钮（参照 pomasa-studio）；成稿如何转格式由用户自理。MAS 只收口在 Stage 8（文章 + metadata）。
5. 推理模型用 dsh profile 默认模型，无第二个模型配置面。「设置」视图退化为数据目录展示 + MCP 状态。
6. 联网检索是 auctor 的核心依赖：宿主首启动时把 `~/.auctor/.dsh/mcp.servers.yml` 种子好（crawl4ai 免密钥，serper/oxylabs 填凭证激活，照 pomasa-studio）。
7. 可观测性按 POMASA OBV 系列落地：`pomasa.json` 声明 9 个 stage 的产物契约（含里程碑分组与门），orchestrator 维护 `run.json` 状态机，各 stage 维护 `index.json` 索引。界面阶段判定 = run.json + 文件事实 + 门标记。

## 1. Pipeline 与门

```
milestone   research            expert        deep               points        outline       article
stage       00.orch 01.res 02.sum  11.exp   12.qg 13.deep       14.designer   15.outliner   16.writer
flow        └───── 自动一口气 ─────┘  ▶ 投喂门 ▶ ── 自动一口气 ──  ▶ 评审门 ▶  ▶ 评审门 ▶  ▶ 评审门 ▶ 定稿
```

门定义（人类介入的四点）：

| 门 | 里程碑 | 类型 | 人做什么 | GUI 交互 |
|---|---|---|---|---|
| expert | expert | 投喂门 | 提供专家访谈素材（姓名/身份/原文），或跳过 | 专家卡片表单，可增删多条；「跳过」幽灵链接 |
| points | points | 评审门 | 审读 4-6 条评论要点，内联编辑，确认或要求重做 | 要点卡片（Claim/事实支撑/读者价值/可预期批评/叙事策略）+ 行内编辑 + 确认 |
| outline | outline | 评审门 | 同上，改章节结构/字数分配/材料择用 | 章节时间线 + 行内编辑 + 确认 |
| article | article | 评审门 | 通读定稿，或对话修订，接受后流程收口 | Tufte 阅读视图 + 对话修订 + 「定稿」+ 下载 |

四个 "gated" 对话门口我围绕讨论面板（默认折叠）：任何 GUI 表达不了的修订意图（重做换个方向、改某条要点、调整问题组）都去面板里一句话说，会话续上下文执行。

## 2. 数据布局

数据根 `~/.auctor`（可用 `AUCTOR_HOME` / 宿主 config.dataDir 覆盖），宿主首启动 `ensureIndex`：

```
~/.auctor/
├── index.json                 # 项目索引（id、title、createdAt、updatedAt、sessionId）
├── host-error.log
└── <project-id>/              # 自包含项目目录 = OBV-02 的 single 单元根
    ├── pomasa.json            # 描述符快照
    ├── agents/                # 全部 10 个蓝图快照
    ├── references/            # domain+kritik+methodology 快照
    ├── run.json               # OBV-03 orchestrator 维护的状态机
    ├── run-log.md             # 叙事型进度日志（人读）
    ├── input/
    │   ├── news-lead.md
    │   ├── editor-notes.md    # 可选
    │   └── expert/            # 提交素材后生成
    │       ├── {expert}.raw.md
    │       └── skip.json      # 选择跳过专家时的标记（{}）
    ├── materials/             # 全流程共享资料库（SRC-*.md + index.md）
    ├── 01.research/{angle}/excerpts.md      + index.json
    ├── 02.summary/initial-summary.md        + index.json
    ├── 03.expert-insights/{expert}.md       + index.json
    ├── 04.research-questions/research-questions.md + index.json
    ├── 05.deep-research/{Q1..N}/excerpts.md + index.json
    ├── 06.commentary-points/commentary-points.md  + index.json
    ├── 07.outline/outline.md                + index.json
    └── 08.article/article.md + article-metadata.md + index.json + accepted.json
```

project id 沿用现有 RUN_ID 风格（如 `20260906-cuba-fidel-centennial`，用户关键字可辨识），目录名即 id。索引写盘一律 tmp+rename 原子写。

## 3. 状态机

### 3.1 三个事实源的分工

| 源 | 谁写 | 提供什么 |
|---|---|---|
| `run.json` | orchestrator（00/10 蓝图） | per-stage 状态（waiting/active/completed/failed/skipped/aborted + auctor 扩展 gated）、起止时间、run 总状态 |
| stage `index.json` | 单文件 stage 的产出 agent；并行 stage 由 orchestrator 边界聚合 | 该 stage 的产物条目（id/title/file/… 按 OBV-01；file 相对索引所在目录） |
| 文件事实 | 各 stage agent 与 GUI（saveArtifact/accept） | 门状态的最终裁决：产物存在与否、`input/expert/` 素材是否就位、`08.article/accepted.json` 是否定稿 |

### 3.2 run.json schema（细到 9 个 stage）

```json
{
  "schema_version": "obv-1",
  "mas_id": "auctor",
  "unit": "<project-id>",
  "created_at": "2026-09-06T10:00:00+08:00",
  "status": "queued|running|completed|failed|aborted",
  "trigger": "ui",
  "runtime": "dsh",
  "runtime_session_id": "<sessionId 已知时回填>",
  "stages": [
    { "index": 0, "id": "research-init", "milestone": "research", "status": "completed", "started_at": null, "finished_at": null },
    { "index": 1, "id": "research",       "milestone": "research", "status": "completed", "started_at": null, "finished_at": null },
    { "index": 2, "id": "summary",        "milestone": "research", "status": "completed", "started_at": null, "finished_at": null },
    { "index": 3, "id": "expert",         "milestone": "expert",   "status": "gated",     "started_at": null, "finished_at": null },
    { "index": 4, "id": "questions",      "milestone": "deep",     "status": "waiting",   "started_at": null, "finished_at": null },
    { "index": 5, "id": "deep-research",  "milestone": "deep",     "status": "waiting",   "started_at": null, "finished_at": null },
    { "index": 6, "id": "points",         "milestone": "points",   "status": "waiting",   "started_at": null, "finished_at": null },
    { "index": 7, "id": "outline",        "milestone": "outline",  "status": "waiting",   "started_at": null, "finished_at": null },
    { "index": 8, "id": "article",        "milestone": "article",  "status": "waiting",   "started_at": null, "finished_at": null }
  ]
}
```

- 额外枚举 `gated`：orchestrator 到门即写（expert 停等素材时、points/outline 呈现后等确认时、article 呈现后等定稿时）。人通过 GUI 放行后，orchestrator 把该 stage 置 completed/active 并继续。
- 回退重做：用户要求重做某门时 orchestrator 把该 stage 回 active、把下游已产出的 stage 置 `aborted`（界面呈现为过期），重做后门重新 gated，下游待人决定是否连锁。
- 时间戳沿用全库既有的 ISO 8601 秒级约定（run-log 同规）。

### 3.3 六段里程碑的界面判定

host 综合三源，向 client 输出 `project.list/get` 的 `milestones` 视图（client 不自己推导）：

| 里程碑 | done 判定 | gated 判定 | running 判定 |
|---|---|---|---|
| research | `02.summary/initial-summary.md` 存在 | 永不 gated（内部两步自动） | run.json research/summary active |
| expert | `03.expert-insights/index.json` 非空 | 素材未就位（`03.expert-insights/` 无产物）且研究已完成 | 有素材待处理（`input/expert/` 已就位，insights 未产出） |
| deep | `05.deep-research/index.json` 非空 | 永不 gated | run.json questions/deep active |
| points | `07.outline/outline.md` 存在（即下一门产物已出） | `06.commentary-points/` 有产物且 outline 未出 | run.json points active |
| outline | `08.article/article.md` 存在 | `07.outline/` 有产物且 article 未出 | run.json outline active |
| article | `accepted.json` 存在 | `08.article/article.md` 存在且未定稿 | run.json article active |

### 3.4 stale 提示

若用户在门产物已确认（下游已出）之后又经编辑器保存了上游文件（saveArtifact），GUI 检测到"上游文件 mtime 晚于下游首产物"，在阶段条上给下游一个「需更新」提示，文案引导去讨论面板发起连锁重做，不强行改动任何文件。

## 4. RPC 端点表（host 侧 `/auctor`，信封与 pictor 一致）

读：

| 端点 | 入参 | 出参 |
|---|---|---|
| `config.get` | 无 | `{ dataRoot, mcpSeeded: bool }` |
| `project.list` | 无 | `{ projects: [{...record, stage, milestones[], running, hasSummary, counts...}] }` |
| `project.get` | `{ id }` | `{ record, running, milestones[], runJson, files, texts: { newsLead, editorNotes, runLog } }` + 各里程碑产物（summary/points/outline/article/articleMetadata/questions/expertInsights/deepGroups/materialsIndex + 各 index 数组 + 各产物原文） |
| `project.pulse` | `{ id }` | `{ running }`（agents 注册表） |

写：

| 端点 | 入参 | 效果 |
|---|---|---|
| `project.create` | `{ newsLead, editorNotes? }` | 建目录骨架 + agents/references/pomasa.json 快照 + 写 input/ + index 登记；**不建会话**；返回 `{ id, title, stage, prompt }` |
| `project.attach` | `{ id, sessionId }` | 回填会话 id（运行判定依据） |
| `project.prompt` | `{ id, message }` | 完整 prompt（会话存活直传本次消息，否则附续做指令）+ 返回 `{ prompt, sessionId, live }` |
| `project.submitExperts` | `{ id, experts: [{name, role, transcript}] }` 或 `{ skip: true }` | 写 `input/expert/*.raw.md`（或 skip.json）；客户端随后 drivePrompt 续跑 |
| `project.saveArtifact` | `{ id, path, content }` | 把编辑后的产物 md 写回（白名单路径，限该 stage 目录内）；返回 `{ ok }` |
| `project.accept` | `{ id }` | 写 `08.article/accepted.json`；返回定稿提示 prompt |
| `project.rename` | `{ id, title }` | 只动 index.json |
| `project.delete` | `{ id }` | 终止会话 + 删目录 + 更新 index |

endpoints 约定：payload 字段一律 String() 归一化；`authority: 'loopback'`；错误由信封统一转 `{ ok:false, error:{code,message} }` 并落 `host-error.log`；无任何 server 推送事件，界面靠轮询（list 3s / get 2s）。

## 5. 会话与驱动

照 pictor 原样复制（`pictorWorkspace` → `auctorWorkspace`，工作区名「Auctor」，dataRoot 为 `~/.auctor`）：

- 会话由 client 经 dsh workspaces/sessions 服务创建与驱动，宿主不建会话、不做 agentLoop。
- 项目会话常驻跨全流程；dsh 重启后会话对象消失，界面从文件事实恢复，下次操作惰性重建会话并附续做指令。
- `composePrompt` 二分：sessionId 存活则直传本次消息（同会话续跑），否则拼续做指令 + 消息。
- 初始指令（`initialPrompt`）按文件事实分支：无 input/news-lead → 读取并汇报；有 news-lead 无 summary → 执行 00.orchestrator（附 `input/` 路径，参数写"见 input/ 文件"）；summary 齐 → 等素材/汇报状态；等等。结尾统一强调"读 agents/00.orchestrator.md（或 10）严格按蓝图执行；门必须停、自动段别停；已产出的产物一律视为定稿，不重跑不重写"。
- 结构化指令 vs 自由对话双通道纪律写进 orchestrator 蓝图。

## 6. 界面（client 工作台）

壳与视觉：pictor 全套照搬（`--dsw-alias-*` 主题变量、React.createElement 自写组件、`au-` 前缀、双语开关、`shell.overlay` click-through 装配、footer 按钮）。组件按 auctor 舞台：

- 左栏：**Auctor** 标题 + 新建项目 + 项目列表（标题=新闻线索、阶段徽记、更新时间）+ 设置/语言。
- 新建表单：新闻线索 textarea（必填）、编辑注记 textarea（可选）。提交即建项目 + 建会话 + 发初始指令。
- 右栏信息条：项目名（可改名）、创建时间、当前阶段。阶段条六格（research/expert/deep/points/outline/article），状态灯与 stale 提示，可点回看任何有产物的阶段。
- 各阶段视图：
  - research：10 个角度摘录（读 `01.research/index.json` → 逐角度卡片）+ 下方 Summary 阅读视图（Tufte，主矛盾高亮、次矛盾折叠）。
  - expert（投喂门）：专家卡片列表（姓名/身份/原文 textarea），增删卡片，「开始深度分析」主按钮，右侧「跳过专家访谈」幽灵链接。
  - deep：研究问题视图（Category A 灰化、B 按 Q 组）+ 深度研究 tab（Q1..Qn 摘录卡片，读 `05.deep-research/index.json`）。
  - points（评审门）：要点卡片（五个字段展开）+ 行内编辑 + 「确认要点，生成提纲」主按钮；重做走讨论面板。
  - outline（评审门）：章节时间线 + 行内编辑 + 「确认提纲，开始写作」。
  - article（评审门）：Tufte 文章阅读视图 + metadata 面板 + 「定稿」+ 「下载 Markdown」；材料库在侧。
  - materials：`materials/index.md` 表格 + 点行展开 SRC 全文。
- 讨论面板：项目详情底部可折叠，自由文本注入续上下文；是"重做换方向"等灵活操作的总入口。
- 下载：每阶段视图「下载 Markdown」（client 从 project.get 内容生成 blob）；article 视图另有「下载全文」。
- 语言开关、删除（右键+详情内，二次确认）照搬 pictor。

## 7. MCP 种子

宿主 apply 时确保 `~/.auctor/.dsh/mcp.servers.yml`（不存在则写样例）：crawl4ai 免配置启动，serper/oxylabs 预留格式。内容照 pomasa-studio 的种子文件，微调注释。

## 8. 构建与验证

从 pictor 复制并改名：`package.json`（`dsh-auctor`，dsh.bundle.patch=cordis.patch.yml，client.inject 四件套）、`cordis.patch.yml`（id 改 dsh-auctor）、`scripts/{build,transport-smoke,install-smoke,package-integrity}.sh|mjs`、`verify.mjs`、`e2e/`（Playwright，fixtures 从 `workspace/` 历史 run 裁剪）。

- L1 纯函数：`firstLine`/`sanitizeFilename`/`stageOf`/`milestonesOf`/`parseIndexMd` 等。
- L2 mock ctx 集成：项目生命周期、prompt 二分、门标记、saveArtifact 路径白名单、submitExperts 落盘、accept。
- transport：真 dsh 临时 DSH_HOME 直测 `/auctor` RPC。
- e2e：fixture 项目走「新建 → research 有产物 → 提交专家 → deep 有产物 → 要点确认 → 提纲确认 → 文章出现 → 定稿」。
- 打包：tarball 必带 lib/、agents/、references/、pomasa.json、cordis.patch.yml。

## 9. 风险与待决

| # | 风险 | 处置 |
|---|---|---|
| 1 | 专家访谈停顿数小时，会话上下文与机器资源 | 文件是真相，会话闲置可接受；dsh 重启后惰性重建 |
| 2 | parallel stage 索引聚合依赖 orchestrator 纪律 | 蓝图写明聚合协议；host 端以文件枚举兜底渲染（index 缺失时退回列目录） |
| 3 | 长流程 token 消耗（10 路研究 + N 路深研） | 蓝图既有 BHV-03 批量限定（2 批 5 路 / ≤7 并行），保留 |
| 4 | session 上下文膨胀 | orchestrator 只传参数让子智能体读蓝图；材料全走文件 |
| 5 | 与 dsh 版本耦合 | 只依赖 stable 面，同 pictor 基准（DSH Desktop 0.7.2 / Harness 0.1.2-alpha.1） |
| 6 | 上游产物被改后下游过期 | GUI stale 提示 + 讨论面板连锁重做，v1 不做自动失效 |