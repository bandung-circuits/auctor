# Data Sources Guide

## Data Source Types

### 1. Official Government Sources

- Government websites, official statements, policy documents
- **Priority**: High
- **Credibility**: High (for factual claims about government positions; note potential bias in framing)

### 2. International Organizations

- UN agencies, World Bank, IMF, WHO reports and data
- **Priority**: High
- **Credibility**: High (for data; note institutional perspectives may reflect Western-centric framing)

### 3. Academic Sources

- Peer-reviewed journals, university research centers, working papers
- **Priority**: High
- **Credibility**: High

### 4. Wire Services

- Reuters, AP, AFP, Xinhua, TASS
- **Priority**: High
- **Credibility**: Medium-High (factual reporting generally reliable; framing reflects institutional perspective)

### 5. Quality News Outlets

- Established newspapers and broadcasters with editorial standards
- **Priority**: Medium
- **Credibility**: Medium-High (distinguish reporting from opinion)

### 6. Think Tanks and Research Institutes

- Tricontinental, SIPRI, Chatham House, Brookings, CSIS, etc.
- **Priority**: Medium
- **Credibility**: Medium-High (note institutional affiliations and funding sources)

### 7. Industry Reports

- Sector-specific analysis from consulting firms, industry bodies
- **Priority**: Medium
- **Credibility**: Medium (may have commercial bias)

### 8. Global South Media

- Media outlets from the Global South (Al Jazeera, South China Morning Post, The Hindu, Daily Maverick, etc.)
- **Priority**: High (often underrepresented; actively seek these perspectives)
- **Credibility**: Medium-High

## Sources to Use Cautiously

- **Anonymous social media posts**: Not verifiable, should not be primary sources
- **Purely opinion blogs**: Unless from recognized experts
- **Sources with obvious commercial interest**: Treat claims skeptically
- **Single-source claims**: Cross-verify with independent sources when possible

## Data Recording Format

Each collected source is saved as a separate file in the central materials library, using **namespaced IDs** to avoid collisions between parallel researchers:

- Stage 1 (background research): `SRC-{ANGLE_LETTER}-NNN` (e.g., `SRC-A-001`, `SRC-B-003`)
- Stage 5 (deep research): `SRC-{GROUP_ID}-NNN` (e.g., `SRC-Q1-001`, `SRC-Q2-005`)

```markdown
# [SRC-{PREFIX}-{NNN}] Title

**Source URL**: [URL that was actually fetched]
**Fetch Time**: [ISO 8601 timestamp]
**Source Type**: [Category from the types above]
**Credibility**: [High / Medium-High / Medium / Low]

**Original Content**:

[Complete content from fetch, preserved verbatim]
```

Each researcher owns its own namespace, so parallel agents never collide on filenames. The materials library is shared: excerpts from any angle or question group can reference any SRC ID.

**Important**: Do NOT summarize or extract during collection. Save complete original content. Analysis is performed by downstream agents.
