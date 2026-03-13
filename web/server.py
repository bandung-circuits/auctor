#!/usr/bin/env python3
"""Auctor Viewer — lightweight development server.

Serves static files from web/static/ and web/lib/, and exposes a small
JSON API that reads workspace directories on the fly.

Usage:
    cd auctor/
    python3 web/server.py [--port 8420]
"""

import argparse
import json
import os
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse, parse_qs

# Resolve project root (one level up from web/)
ROOT = Path(__file__).resolve().parent.parent
WORKSPACE = ROOT / "workspace"
STATIC = Path(__file__).resolve().parent / "static"
LIB = Path(__file__).resolve().parent / "lib"


def _parse_run_log(project_dir: Path) -> dict:
    """Extract key-value metadata from run-log.md front matter."""
    log_path = project_dir / "run-log.md"
    meta = {}
    if log_path.exists():
        text = log_path.read_text(encoding="utf-8")
        for m in re.finditer(r"- \*\*(.+?)\*\*:\s*(.+)", text):
            key = m.group(1).strip().lower().replace(" ", "_")
            meta[key] = m.group(2).strip()
    return meta


def _extract_title(project_dir: Path) -> str | None:
    """Try to extract a title from the article file's first heading."""
    article = project_dir / "08.article" / "article.md"
    if article.exists():
        for line in article.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                return line[2:].strip()
    return None


def _list_projects() -> list[dict]:
    """Scan workspace/ for project directories."""
    projects = []
    if not WORKSPACE.exists():
        return projects
    for d in sorted(WORKSPACE.iterdir()):
        if d.is_dir() and (d / "run-log.md").exists():
            meta = _parse_run_log(d)
            # Fallback title: article heading → news_lead snippet → dir name
            if "title" not in meta:
                article_title = _extract_title(d)
                if article_title:
                    meta["title"] = article_title
                elif "news_lead" in meta:
                    lead = meta["news_lead"]
                    # Strip leading URL if present
                    if " — " in lead:
                        lead = lead.split(" — ", 1)[1]
                    meta["title"] = lead[:120] + ("..." if len(lead) > 120 else "")
            projects.append({"id": d.name, **meta})
    return projects


def _tree(project_dir: Path) -> list[str]:
    """Return relative paths of all files in a project directory."""
    paths = []
    for p in sorted(project_dir.rglob("*")):
        if p.is_file() and not p.name.startswith("."):
            paths.append(str(p.relative_to(project_dir)))
    return paths


def _stage_durations(project_dir: Path) -> dict[str, dict]:
    """Calculate duration per stage using earliest file time of consecutive stages."""
    # Ordered stages (materials excluded — it spans the whole run)
    stage_seq = [
        ("research",   "01.research"),
        ("summary",    "02.summary"),
        ("experts",    "03.expert-insights"),
        ("questions",  "04.research-questions"),
        ("deep",       "05.deep-research"),
        ("commentary", "06.commentary-points"),
        ("outline",    "07.outline"),
        ("article",    "08.article"),
    ]

    # Collect earliest mtime per stage
    starts: list[tuple[str, float]] = []
    for stage_id, dirname in stage_seq:
        stage_path = project_dir / dirname
        if not stage_path.exists():
            continue
        mtimes = []
        for p in stage_path.rglob("*"):
            if p.is_file() and not p.name.startswith("."):
                mtimes.append(p.stat().st_mtime)
        if mtimes:
            starts.append((stage_id, min(mtimes)))

    # Duration = start of next stage - start of this stage
    result = {}
    for i, (stage_id, t) in enumerate(starts):
        if i + 1 < len(starts):
            dur = starts[i + 1][1] - t
        else:
            # Last stage: use max mtime - min mtime
            stage_path = project_dir / dict(stage_seq)[stage_id]
            mtimes = [p.stat().st_mtime for p in stage_path.rglob("*")
                      if p.is_file() and not p.name.startswith(".")]
            dur = (max(mtimes) - min(mtimes)) if len(mtimes) > 1 else 0
        dur = max(0, dur)
        if dur >= 3600:
            hrs = int(dur) // 3600
            mins = (int(dur) % 3600) // 60
            label = f"{hrs}h{mins:02d}m"
        elif dur >= 60:
            mins = int(dur) // 60
            secs = int(dur) % 60
            label = f"{mins}m{secs:02d}s"
        else:
            label = "<1m"
        result[stage_id] = {"seconds": round(dur), "label": label}
    return result


class AuctorHandler(SimpleHTTPRequestHandler):
    """Serves static files and API endpoints."""

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        # --- API routes ---
        if path == "/api/projects":
            return self._json_response(_list_projects())

        m = re.match(r"^/api/project/([^/]+)/tree$", path)
        if m:
            pid = m.group(1)
            pdir = WORKSPACE / pid
            if not pdir.is_dir():
                return self._json_response({"error": "not found"}, 404)
            return self._json_response(_tree(pdir))

        m = re.match(r"^/api/project/([^/]+)/durations$", path)
        if m:
            pid = m.group(1)
            pdir = WORKSPACE / pid
            if not pdir.is_dir():
                return self._json_response({"error": "not found"}, 404)
            return self._json_response(_stage_durations(pdir))

        m = re.match(r"^/api/project/([^/]+)/file$", path)
        if m:
            pid = m.group(1)
            qs = parse_qs(parsed.query)
            rel = qs.get("path", [None])[0]
            if not rel:
                return self._json_response({"error": "path required"}, 400)
            # Prevent path traversal
            safe = (WORKSPACE / pid / rel).resolve()
            if not str(safe).startswith(str(WORKSPACE.resolve())):
                return self._json_response({"error": "forbidden"}, 403)
            if not safe.is_file():
                return self._json_response({"error": "not found"}, 404)
            content = safe.read_text(encoding="utf-8", errors="replace")
            return self._json_response({"path": rel, "content": content})

        # --- Static files ---
        # Serve lib/ files
        if path.startswith("/lib/"):
            return self._serve_file(LIB / path[5:])

        # Serve static/ files (default to index.html)
        if path == "/" or path == "":
            return self._serve_file(STATIC / "index.html")

        static_path = STATIC / path.lstrip("/")
        if static_path.is_file():
            return self._serve_file(static_path)

        # SPA fallback — serve index.html for any unmatched route
        return self._serve_file(STATIC / "index.html")

    def _json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _serve_file(self, filepath: Path):
        filepath = filepath.resolve()
        if not filepath.is_file():
            self.send_error(404)
            return
        ext = filepath.suffix.lower()
        mime = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
            ".otf": "font/otf",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".ico": "image/x-icon",
        }.get(ext, "application/octet-stream")
        body = filepath.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Quieter logging — skip static asset noise
        path = args[0] if args else ""
        if isinstance(path, str) and (path.endswith(".css") or path.endswith(".js") or path.endswith(".woff2")):
            return
        super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser(description="Auctor Viewer server")
    parser.add_argument("--port", type=int, default=8420, help="Port (default 8420)")
    args = parser.parse_args()

    HTTPServer.allow_reuse_address = True
    server = HTTPServer(("127.0.0.1", args.port), AuctorHandler)
    print(f"Auctor Viewer → http://localhost:{args.port}")
    print(f"  Workspace: {WORKSPACE}")
    print(f"  Static:    {STATIC}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
