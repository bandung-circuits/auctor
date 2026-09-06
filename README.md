# Auctor

Auctor is a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) plugin: a news-commentary production workbench that turns a single news lead into a publishable deep analytical commentary. One project runs as one coherent dsh session across the whole pipeline; the GUI only does two things — display information and normalize inputs. Everything else is left to the agent runtime (declarative MAS).

## Install

Published to npm, one line:

```bash
dsh plugin --profile <profile> add dsh-auctor
```

Replace `<profile>` with the target profile (e.g. `desktop`, `web`), then start that profile. The dsh footer gains an "Auctor" button in the bottom-left corner. First use creates `~/.auctor` (registered as an "Auctor" dsh workspace, sessions grouped in the sidebar).

**For non-technical users**: install [DSH Desktop](https://dshdesktop.com/en/), then let the agent in dsh do it:

> 帮我把 Auctor 插件装上，从 npm 包 dsh-auctor 装到当前 profile，需要的话重启，装好告诉我左下角有没有 Auctor 入口。

## Supported dsh version

Built and tested against **DSH Desktop 0.7.2** (bundled Harness **0.1.2-alpha.1**), the same generation as dsh-pictor. Other versions may work or break without notice.

## Usage

1. Open the workbench via the "Auctor" footer button.
2. **New project** — paste a news lead (one sentence or a URL) and optional editor notes. Auctor seeds the project, then runs Group 00 (10-angle research + initial summary) straight through.
3. **Expert material** (the first human gate) — submit each interview transcript or notes (name / role / raw text), or skip experts. Instead of stopping again, Auctor then runs expert processing, question generation and deep research in one straight shot, until the commentary-points gate.
4. **Review gates** — commentary points, then the outline, then the article review. At each gate, read the artifact, edit it in place if you like ("Save edit"), and confirm to push the pipeline forward. Anything the GUI can't express — redo in a different direction, adjust a section, change a research question — goes in the discussion panel as one sentence; the same project session continues.
5. Every stage artifact renders as Markdown and offers **Download Markdown** (no DOCX/PDF export inside the plugin — convert on your own if needed).

## Ideology & style

- **Ideological basis**: [kritik](https://extremeprogramming-cn.github.io/kritik/) (fixed version, `references/domain/kritik/`, KR-01…KR-07) — the Marxist critical framework and two-axis source grading. No ad-hoc ideology files are maintained here anymore.
- **Style**: `references/domain/style-guide.md` (Tricontinental dossier style) and `references/domain/editorial-line.md` (audience / tone / language).

## Form

- Data root `~/.auctor` (override with `AUCTOR_HOME`): `index.json` + one self-contained directory per project (agents/references/pomasa.json snapshots + stage outputs).
- A project = a coherent dsh session; the GUI drives structured instructions and free discussion over the same session. State is derived from `run.json` (OBV-03, maintained by the orchestrators), stage `index.json` files (OBV-01) and file facts — never from session text.
- Inference uses the dsh current default model (change it in dsh settings, not here). No image model, no second configuration surface.
- Research tooling: the workspace seeds `~/.auctor/.dsh/mcp.servers.yml` (crawl4ai works with no key; serper / oxylabs activate once you fill in credentials — see the seed file comments).

## Development & verification

```bash
npm run build            # esbuild host + client bundle
npm run verify           # L1 unit + L2 host integration (mock ctx)
npm run verify:integration   # transport smoke: real dsh web, /auctor over HTTP
npm run test:pack        # tarball carries lib/ agents/ references/ pomasa.json
npm run test:install     # README install path (dsh plugin add) → boot + RPC
npm run test:e2e         # browser e2e against the real dsh web (fixture project)
npm run hooks:install    # one-time: pre-push = verify + install-smoke
```

All smoke layers are hermetic (temp `DSH_HOME`/`AUCTOR_HOME`); a running DSH Desktop is never touched. Test layer definitions live in [docs/DESIGN.md](docs/DESIGN.md) §8.

## Layout

```
auctor/
├── agents/                # declarative blueprints (00/10 orchestrators + 8 stage agents)
├── references/
│   ├── domain/            # kritik (KR-01..07 + SKILL) · style-guide · editorial-line
│   └── methodology/       # research-overview · data-sources · output-template
├── pomasa.json            # POMASA descriptor: 9 stages, milestone grouping, gates, contracts
├── src/host/              # plugin host: ~/.auctor, project lifecycle, /auctor RPC, MCP seed
├── src/client/            # workbench UI (React.createElement + theme variables)
├── scripts/               # build + transport-smoke + install-smoke + package-integrity
├── verify.mjs             # L1+L2 offline smoke
├── e2e/                   # L4a Playwright (fixture project at the points gate)
└── workspace/             # historic run artifacts (used as fixture material)
```

## Documents

- Design & decisions: [docs/DESIGN.md](docs/DESIGN.md)
- Verification checklist: [docs/verification-checklist.zh.md](docs/verification-checklist.zh.md)

## License

MIT, see [LICENSE](LICENSE).