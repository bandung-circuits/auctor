# Anti-Slop Pattern Catalog

A pattern catalog of AI writing tells, for use by the writer's internal style audit. Compiled and adapted from open-source anti-slop practice:

- Wikipedia, ["Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) (maintained by WikiProject AI Cleanup) — the base taxonomy, as used by the `humanizer` skill
- `stop-slop` (Hardik Pandya) — structural clichés and scoring approach
- `qu-ai-wei` — Chinese-language patterns and "when to fix / when to keep" two-column discipline

Patterns are grouped into families. Each pattern carries a strength:

- **[S]** strong — one sighting is enough to justify a revision (unless the Dossier Exemptions below apply)
- **[W]** weak alone — counts as a violation only when several weak tells cluster in the same passage, because a careful writer may use any one of them deliberately

Chinese patterns are listed alongside English ones because drafts may be written in either language.

## A. Staging instead of stating

| # | Pattern | Strength | Examples / action |
|---|---------|----------|-------------------|
| A1 | "Not X but Y" antithesis as a formula | [S] | "It's not just X, it's Y" / "不是X，而是Y". State the point directly or find a real contrast. |
| A2 | One-line closers and dramatic fragments | [S] when recurring | "That is the real win." / "Let that sink in." after every section; telegraphic sentences used as section punctuation. Max 2 in a full article, none in consecutive sections. |
| A3 | Sayings that sound deep | [S] | "At its core, what matters is..." / "归根结底…". Replace with the specific claim. |
| A4 | Staged run-up before the point | [S] | "Here's the thing." / "Let's dive in." / "In today's world..." Delete; state the point. |
| A5 | Arguing with no one | [S] | "This isn't mainly about...", "A tempting approach would be...". Remove the unraised objection; keep any real claim. |
| A6 | Throat-clearing openers | [S] | "值得注意的是" / "It is worth noting that" / "It is important to note...". Delete. |
| A7 | Inflation-by-pairing | [S] | "这不仅仅是……更是……" / "not merely X — it is Y". Make the point once. |

## B. Rhythm by rule

| # | Pattern | Strength | Examples / action |
|---|---------|----------|-------------------|
| B1 | Forced triads — three items or three sentences where the meaning needs fewer | [W] | "innovation, inspiration, and insights"; 首先/其次/最后 imposed on a narrative. |
| B2 | Repeated sentence openings in sequence | [W] | "She noted... She noted... She filed..." |
| B3 | Em dashes as the universal connector | [W] | Max 2 per section (writer guideline); beyond that, restructure. |
| B4 | Stacked qualifiers | [W] | "could potentially possibly be argued". Keep only what the source supports. |
| B5 | Staccato fragmentation | [W] | Chains of short declaratives with uniform shape. Vary length per the style guide B.2. |
| B6 | Mechanical parallelism — 3+ sentences with identical syntax in sequence | [S] | "The US did X. China responded with Y. The South faced Z." |
| B7 | Uniform paragraph shape — every paragraph the same length and the same move | [W] | Vary: narrative, datum, testimony, argument should have different paragraph physiques. |
| B8 | Number-stacking sentences — 5+ figures strung with commas in one sentence | [S] | Break up; follow style guide exemplar E.3: one or two figures, then their meaning. |

## C. Structural clichés

| # | Pattern | Strength | Examples / action |
|---|---------|----------|-------------------|
| C1 | Counted-list skeleton | [S] when recurring | "Two questions follow" / "Three stories the record will not support" / "Two details break the stereotype" as recurring section openers. Max 1 per article. |
| C2 | Tidy restatement — paragraph ends by restating its opening | [S] | Each sentence must add information. |
| C3 | Formulaic conclusion — summarises the article instead of looking forward | [S] | Per style guide F.3 and exemplar E.5: concrete demands, a test, or a forward question. |
| C4 | Negative listing — defining a thing by a list of what it is not | [W] | One negation is fine; a chain is a tell. |
| C5 | Connector chains — "Furthermore… Moreover… Additionally…" | [S] | Vary connectors or restructure so none is needed. |
| C6 | Rhetorical setup then anticlimax | [W] | Question posed, then a hedge instead of an answer. |
| C7 | Deadpan irony as a running register | [S] when pervasive | Aphoristic ironies throughout ("the corpses honoured in arithmetic"). Max 1 per article; irony must ride on a documented fact. |

## D. Inflation and borrowed authority

| # | Pattern | Strength | Examples / action |
|---|---------|----------|-------------------|
| D1 | Overused AI vocabulary | [S] | delve, testament, landscape, navigate, multifaceted, nuanced, robust, foster, bolster, pivotal, paradigm shift, stakeholders, underscores, highlights; 赋能/助力/打造/闭环 when densely clustered. |
| D2 | Inflated significance | [S] | "marking a pivotal moment" / "具有深远意义". Keep the fact, drop the significance. |
| D3 | Shallow participial riders | [W] | "..., symbolising...", "..., reflecting...", "..., showcasing...". Keep only what the source supports. |
| D4 | Borrowed authority | [S] | "Experts believe..." without a name; listing prestigious outlets instead of saying what they reported. |
| D5 | Avoiding is/are/has | [W] | "serves as", "features", "boasts". Use plain verbs. |
| D6 | Sales language | [S] | "nestled within the breathtaking region". State what the thing is. |

## E. Residue and wrong-reader writing

| # | Pattern | Strength | Examples / action |
|---|---------|----------|-------------------|
| E1 | Chatbot residue | [S] | "Great question!", "I hope this helps!", meta-commentary about the draft or the process. Never in article text. |
| E2 | Knowledge-limit disclaimers as filler | [W] | "While details are limited...". State what the source shows or cut. |
| E3 | Writing about the document instead of the subject | [S] | "This section will examine...", "The table below compares...". Describe the subject. |
| E4 | Heading repeated in the first sentence | [W] | "## Repression" + "Repression is central...". Let the heading work. |
| E5 | Re-explaining what the reader already knows | [W] | Lead with the new claim; leave background to earlier sections. |

## F. Dossier Exemptions (read before flagging)

This publication's style deliberately authorises constructions that generic anti-slop rules would flag. Do **not** treat the following as violations when used per the style guide:

1. **Booster vocabulary** ("it is clear that", "reveals", "must") — approved by style guide A.3 for structural and political claims. D1-style vocabulary flags apply to *inflated* words, not to these approved boosters; D2 flags significance that has no claim behind it, not conviction that has one.
2. **Institutional "we" and explicit partisanship** — required by A.1, not a tell.
3. **Vivid imagery grounded in a mechanism** (exemplar E.2) — approved; flag imagery that substitutes for the mechanism.
4. **Weak-alone clustering rule**: a [W] pattern violates only in company. When auditing a passage, count weak tells together; revise the passage when 2+ cluster, leave a lone deliberate use alone. When in doubt whether a use is deliberate, check it against the few-shot exemplars in the style guide appendix.

## Audit procedure

1. Scan the full draft family by family (A → E), applying F's exemptions before flagging.
2. For each [S] sighting and each [W] cluster, note the passage and the pattern numbers.
3. Revise by recomposing the passage in the dossier voice (exemplars E.1–E.6 are the target texture) — not by deleting the sentence and leaving a hole.
4. Verify no fact, figure, quotation, or footnote was lost or altered in revision.
5. Re-run the scan once on the revised draft. Deliver only when the second pass finds no unexempted [S] and no [W] cluster.
