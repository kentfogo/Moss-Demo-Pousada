#!/usr/bin/env python3
"""Mirror the Moss docs (docs.moss.dev) into moss-docs/ for coding agents.

Reads https://docs.moss.dev/llms.txt, fetches every docs page as Markdown (any docs URL + ".md"), and writes:
  moss-docs/INDEX.md       every page: title, section, local file, source URL, summary, and the refresh date
  moss-docs/pages/...      one Markdown file per page, mirroring the URL path
  moss-docs/moss-docs.md   every page in one file, for searching

Run: python3 fetch_moss_docs.py      (standard library only; honours HTTPS_PROXY)
"""
import concurrent.futures as cf
import datetime as dt
import pathlib
import re
import sys
import time
import urllib.request

BASE = "https://docs.moss.dev"
OUT = pathlib.Path(__file__).resolve().parent / "moss-docs"
LINK = re.compile(r"^- \[(?P<title>[^\]]+)\]\((?P<url>https://docs\.moss\.dev/[^)\s]+\.md)\)(?::\s*(?P<summary>.*))?$")
# Mintlify adds a pointer to llms.txt at the top of each page and a hosting line at the bottom
HEAD = re.compile(r"\A> ## Documentation Index\n(?:>.*\n)*\n*")
FOOT = re.compile(r"\n*This documentation is built and hosted on \[Mintlify\][^\n]*\n*\Z")


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "moss-docs-mirror"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8")
        except Exception as e:  # network blips and rate limits: back off and retry
            if i == tries - 1:
                raise RuntimeError(f"{url}: {e}") from e
            time.sleep(1.5 * (i + 1))


def section_of(path):
    parts = path.split("/")  # docs/<section>/... or docs/<page>.md
    return parts[1] if len(parts) > 2 else "general"


def main():
    pages = []
    for line in get(f"{BASE}/llms.txt").splitlines():
        m = LINK.match(line.strip())
        if m:
            path = m["url"][len(BASE) + 1:]
            if all(p["path"] != path for p in pages):
                pages.append({"title": m["title"], "url": m["url"], "path": path, "summary": (m["summary"] or "").strip()})
    if not pages:
        sys.exit("no pages found in llms.txt")

    def fetch(p):
        text = get(p["url"])
        text = FOOT.sub("\n", HEAD.sub("", text)).strip() + "\n"
        return p, text

    failed = []
    texts = {}
    with cf.ThreadPoolExecutor(max_workers=6) as pool:
        for fut in cf.as_completed([pool.submit(fetch, p) for p in pages]):
            try:
                p, text = fut.result()
                texts[p["path"]] = text
            except Exception as e:
                failed.append(str(e))

    pages_dir = OUT / "pages"
    if pages_dir.exists():  # start clean so removed pages disappear
        for f in sorted(pages_dir.rglob("*"), reverse=True):
            f.unlink() if f.is_file() else f.rmdir()
    today = dt.date.today().isoformat()
    rows, combined = [], [f"# Moss docs (all pages)\n\nMirrored from {BASE}/llms.txt on {today}. Search this file; don't read it all.\n"]
    for p in pages:
        if p["path"] not in texts:
            continue
        local = pathlib.Path("pages") / p["path"][len("docs/"):]
        dest = OUT / local
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(f"<!-- Source: {p['url']} -->\n{texts[p['path']]}", encoding="utf-8")
        summary = p["summary"].replace("|", "\\|")
        rows.append(f"| {p['title'].replace('|', '/')} | {section_of(p['path'])} | `{local.as_posix()}` | {p['url']} | {summary} |")
        combined.append(f"\n---\n\n<!-- Page: {p['title']} · {p['url']} · local: {local.as_posix()} -->\n\n{texts[p['path']]}")

    (OUT / "INDEX.md").write_text(
        f"# Moss docs index\n\nMirror refreshed: {today} (from {BASE}/llms.txt, {len(rows)} pages).\n"
        "Refresh with `python3 fetch_moss_docs.py`. Any live page is the source URL below.\n\n"
        "| Page | Section | Local file | Source | Summary |\n|---|---|---|---|---|\n" + "\n".join(rows) + "\n",
        encoding="utf-8",
    )
    (OUT / "moss-docs.md").write_text("".join(combined), encoding="utf-8")
    print(f"mirrored {len(rows)} of {len(pages)} pages into {OUT.name}/ ({today})")
    if failed:
        print(f"{len(failed)} failed:\n  " + "\n  ".join(failed), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
