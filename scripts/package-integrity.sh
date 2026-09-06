#!/usr/bin/env bash
# Package integrity: the npm tarball governed by package.json "files" must
# carry every path the host needs at boot (lib bundle, agents, references,
# pomasa.json). Catches packaging regressions. Fast, no dsh, no network.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="/tmp/auctor-pack-check-$$"
mkdir -p "$BASE"
trap 'rm -rf "$BASE"' EXIT

(cd "$ROOT" && npm pack --pack-destination "$BASE" >/dev/null)
PKG_FILE="$(ls "$BASE"/*.tgz | head -1)"
[ -n "$PKG_FILE" ] || { echo "FAIL: no tarball produced" >&2; exit 1; }

FAIL=0
for need in \
  package/lib/index.js \
  package/lib/client.js \
  package/lib/mcp.js \
  package/cordis.patch.yml \
  package/pomasa.json \
  package/agents/00.orchestrator.md \
  package/agents/10.orchestrator.md \
  package/agents/01.researcher.md \
  package/agents/16.writer.md \
  package/references/domain/kritik/KR-01-marxist-framework.md \
  package/references/domain/kritik/KR-07-source-grading.md \
  package/references/domain/style-guide.md \
  package/references/methodology/research-overview.md \
  package/assets/meme.jpg \
  package/README.md; do
  if ! tar tzf "$PKG_FILE" | grep -qFx "$need"; then
    echo "FAIL: tarball missing $need" >&2
    FAIL=1
  fi
done

if [ "$FAIL" = "0" ]; then
  echo "package integrity OK ($(basename "$PKG_FILE"), $(tar tzf "$PKG_FILE" | wc -l | tr -d ' ') entries)"
  exit 0
fi
tar tzf "$PKG_FILE" | awk -F/ '{print NF-1, $0}' | sort -n | head -40
exit 1