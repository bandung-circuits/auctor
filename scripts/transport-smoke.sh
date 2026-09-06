#!/usr/bin/env bash
# auctor transport smoke test: boot the real DSH web host with dsh-auctor mounted
# and exercise the /auctor RPC channel over real HTTP. Catches the class of bug
# where the client can open the workbench but every call dies with
# "transport failure ... HTTP 405" (channel never registered).
#
# Complements verify.mjs (offline mock lifecycle): this layer proves the
# connection.rpc.handle registration actually lands on the web server and the
# response envelope (+ error object protocol) is honored end to end.
#
# Hermetic: DSH_HOME/AUCTOR_HOME point at a temp dir (never the real ~/.dsh,
# so a running DSH Desktop is untouched) and everything is removed on exit.
#
# Usage: bash scripts/transport-smoke.sh   (or: npm run verify:integration)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${AUCTOR_SMOKE_PORT:-43121}"
BASE="http://127.0.0.1:${PORT}"
TMP="$(mktemp -d)"
LOG="${TMP}/dsh.log"
SERVER_PID=""

cleanup() {
  if [ -n "${SERVER_PID}" ]; then kill "${SERVER_PID}" >/dev/null 2>&1 || true; fi
  rm -rf "${TMP}"
}
trap cleanup EXIT

export DSH_HOME="${TMP}/dsh_home"
export AUCTOR_HOME="${TMP}/auctor_home"
mkdir -p "${AUCTOR_HOME}"

echo "== auctor transport smoke (web profile on :${PORT}, temp home ${TMP})"

# 1) Mount dsh-auctor into a fresh web profile inside the temp DSH_HOME.
dsh --profile web --help >/dev/null 2>&1
dsh plugin --profile web add "$ROOT" >/dev/null 2>&1 \
  || { echo "FAIL: dsh plugin add $ROOT"; exit 1; }

# 2) Boot the web host (background) and wait for the web frontend.
dsh --profile web --no-open --port "${PORT}" >"${LOG}" 2>&1 &
SERVER_PID=$!
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "${BASE}/" --max-time 2; then READY=1; break; fi
  sleep 1
done
if [ ${READY} -ne 1 ]; then
  echo "FAIL: web host did not come up on :${PORT}"
  tail -20 "${LOG}"
  exit 1
fi
echo "-- web host ready (pid ${SERVER_PID})"

# 3) Failure leg: empty project.create must route and return a protocol error object.
RESP="$(curl -s -X POST "${BASE}/auctor/project.create" \
  -H 'content-type: application/json' \
  -d '{"type":"client-request","rpcId":"smoke-1","method":"project.create","payload":{}}' --max-time 10)"
echo "-- project.create(empty) => ${RESP}"
if ! grep -q '"ok":false' <<<"${RESP}" || ! grep -q '"error"' <<<"${RESP}"; then
  echo "FAIL: expected an error-object response for empty project.create"
  echo "${RESP}"
  exit 1
fi

# 4) Success leg: project.create with a news lead returns an id + prompt.
RESP2="$(curl -s -X POST "${BASE}/auctor/project.create" \
  -H 'content-type: application/json' \
  -d "{\"type\":\"client-request\",\"rpcId\":\"smoke-2\",\"method\":\"project.create\",\"payload\":{\"newsLead\":\"Cuba holds 100 years of Fidel memorial activities\"}}" --max-time 10)"
echo "-- project.create(lead) => ${RESP2:0:160}"
if ! grep -q '"ok":true' <<<"${RESP2}" || ! grep -q '"prompt"' <<<"${RESP2}"; then
  echo "FAIL: expected ok:true with prompt for project.create"
  echo "${RESP2}"
  exit 1
fi

# 5) config.get must route and return ok:true with dataRoot.
RESP3="$(curl -s -X POST "${BASE}/auctor/config.get" \
  -H 'content-type: application/json' \
  -d '{"type":"client-request","rpcId":"smoke-3","method":"config.get","payload":{}}' --max-time 10)"
echo "-- config.get => ${RESP3}"
if ! grep -q '"ok":true' <<<"${RESP3}" || ! grep -q 'dataRoot' <<<"${RESP3}"; then
  echo "FAIL: expected ok:true with dataRoot for config.get"
  echo "${RESP3}"
  exit 1
fi

RESP4="$(curl -s -o "${TMP}/meme.jpg" -w '%{http_code}' "${BASE}/auctor/asset/meme.jpg" --max-time 10)"
MZ="$(stat -f%z "${TMP}/meme.jpg" 2>/dev/null || echo 0)"
echo "-- meme route => HTTP ${RESP4} (${MZ} bytes)"
if [ "${RESP4}" != "200" ] || [ "${MZ}" -lt 10000 ]; then
  echo "FAIL: /auctor/asset/meme.jpg 应 200 且 >10KB"
  exit 1
fi

echo "PASS transport smoke: /auctor channel registered and serving on real HTTP (${BASE})"