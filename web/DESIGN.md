# Auctor Viewer — Design Document

## Overview

A lightweight web viewer for Auctor pipeline outputs. Displays all stages of the multi-agent research and writing pipeline in an editorial, newspaper-inspired interface.

## Architecture

```
web/
├── DESIGN.md           # This file
├── server.py           # Python HTTP server + API endpoints
├── static/
│   ├── index.html      # SPA entry point
│   ├── style.css       # Main stylesheet (Tufte CSS base + custom)
│   ├── app.js          # Application logic
│   └── fonts/          # Cochin fallback, ET Book from Tufte CSS
└── lib/
    ├── tufte.css        # Tufte CSS (vendored)
    └── marked.min.js    # Markdown renderer (vendored)
```

## Tech Stack

- **Server**: Python `http.server` with custom handler for API endpoints
- **Frontend**: Vanilla HTML/CSS/JS, no build step
- **Typography base**: Tufte CSS (https://edwardtufte.github.io/tufte-css/)
- **Markdown rendering**: marked.js
- **Article font**: Cochin (with ET Book / Georgia fallback)

## API Endpoints

```
GET /api/projects
  → List workspace directories with metadata from run-log.md

GET /api/project/<id>/tree
  → List all files in a workspace (recursive)

GET /api/project/<id>/file?path=<relative-path>
  → Read a single file's content
```

## Pages & Navigation

### Homepage (Project List)

- Source: scan `workspace/` for directories containing `run-log.md`
- Display: newspaper-style grid of project cards
- Each card shows: title (from run-log or article), date, status, source/excerpt counts
- Click → enter project view

### Project View

Left sidebar navigation (fixed):

1. **Stage 1**: Background Research
2. **Stage 2**: Summary
3. **Stage 3**: Expert Insights
4. **Stage 4**: Research Questions
5. **Stage 5**: Deep Research
6. **Stage 6**: Commentary Points
7. **Stage 7**: Outline
8. **Stage 8**: Article
9. **Materials Library** (last)

Top bar: project title + run metadata (date, status)

### Stage Views

#### Stage 1: Background Research
- Source: `01.research/*/excerpts.md`
- Layout: accordion grouped by 4 layers (Factual, Context, Reaction, Analysis)
- Each angle expands to show excerpt cards (ID, source, relevance, blockquote)
- Angle names and count derived dynamically from directory listing

#### Stage 2: Summary
- Source: `02.summary/initial-summary.md`
- Layout: rendered markdown, principal contradiction highlighted (larger font or box)
- Secondary contradictions and expert questions in collapsible sections

#### Stage 3: Expert Insights
- Source: `03.expert-insights/*.md`
- Layout: card grid, one per expert
- Each card: name + role header, tabbed content (Core Points / Quotable Statements / Raw Input)
- Number of experts dynamic from file count

#### Stage 4: Research Questions
- Source: `04.research-questions/research-questions.md`
- Layout: listed by group headers parsed from the markdown
- Category A questions: greyed out, non-interactive (already answered)
- Category B questions: normal display, grouped by Q1, Q2, ... QN
- Number of groups dynamic from content parsing

#### Stage 5: Deep Research
- Source: `05.deep-research/*/excerpts.md`
- Layout: tab bar (Q1, Q2, ... QN), each tab shows excerpt cards
- Same card format as Stage 1
- Number of groups dynamic from directory listing

#### Stage 6: Commentary Points
- Source: `06.commentary-points/commentary-points.md`
- Layout: large cards, one per point
- Label badge: CORE (accent color) / SECONDARY / SUPPORTING
- Expandable sections: Claim → Factual Supports → Reader Value → Anticipated Criticism → Narrative Strategy

#### Stage 7: Outline
- Source: `07.outline/outline.md`
- Layout: vertical timeline / flow, one node per section
- Each node: section title, purpose, word budget, materials used, expert quotes

#### Stage 8: Article
- Source: `08.article/article.md`
- Layout: clean full-text reading view
- Typography: Cochin serif, generous margins, Tufte-style layout
- Footnotes rendered inline at bottom
- No complex source tracing UI

#### Materials Library
- Source: `materials/index.md` (table) + `materials/SRC-*.md` (full text)
- Layout: searchable, sortable table (ID, Title, Source Type, Credibility)
- Click row → expand to show full source text from corresponding SRC file

## Visual Design

### Style: Editorial / Newspaper with subtle tech accent

**Base**: Tufte CSS foundation
- Background: warm off-white (`#fffff8`)
- Body text: dark charcoal, serif font
- Generous whitespace and margins

**Additions on top of Tufte**:
- CSS Grid newspaper-style layout for project cards (column rules between items)
- Monospace font (JetBrains Mono / SF Mono / Menlo) for IDs, metadata, labels
- Accent color for interactive elements and labels: muted blue (`#1a5276`) or deep teal
- Tag/badge styling for CORE/SECONDARY/SUPPORTING with subtle background fills
- Cards with thin borders (`#e0d8c8`) and minimal shadow
- Sidebar: slightly darker warm tone, clean typography hierarchy

### Typography Scale
- Article body (Stage 8): Cochin, 19px, 1.6 line-height
- Interface body: ET Book / Georgia, 16px
- Headings: ET Book / Georgia, bold weights
- Code/ID/metadata: JetBrains Mono / monospace, 13px
- Labels/badges: monospace, 11px, uppercase, letter-spacing

### Responsive
- Sidebar collapses to hamburger on narrow screens
- Content area fills available width
- Article view has max-width ~700px for readability

## Data Parsing Notes

All content is read from workspace markdown files at runtime via API. No hardcoded project-specific information.

### Excerpt card parsing (Stage 1, 5)
Pattern in excerpts.md:
```
## [M-A-001] Title text
**Source**: SRC-A-001
**Relevance**: Description text

> Blockquote content
```

### Commentary point parsing (Stage 6)
Pattern:
```
### Point N: Title [CORE/SECONDARY/SUPPORTING]

**Claim**: ...
**Factual Supports**: ...
**Reader Value**: ...
**Anticipated Criticism**: ...
**Narrative Strategy**: ...
```

### Research questions parsing (Stage 4)
Pattern:
```
## Category A: ...
### Group heading
1. Question text
2. Question text

## Category B: ...
### Group heading (Q1)
1. Question text
```

### Expert insight parsing (Stage 3)
Pattern:
```
# Expert Insight: Name
## Expert Profile
- **Name**: ...
- **Role/Affiliation**: ...
## Raw Input
...
## Core Points
1. ...
## Quotable Statements
1. > "..."
```

### Run log parsing (Homepage)
Pattern:
```
- **Run ID**: ...
- **News Lead**: ...
- **Start Time**: ...
- **Status**: ...
```
