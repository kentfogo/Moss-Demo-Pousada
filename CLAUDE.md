# Moss docs

- A local mirror of the Moss docs lives in `moss-docs/`:
  - `moss-docs/INDEX.md`: every page with its section, local file and source URL. **Read this first.**
  - `moss-docs/pages/...`: one Markdown file per page. Grep these, and read only the pages you need.
  - `moss-docs/moss-docs.md`: everything in one file. Search it; don't read it all.
- **Never write Moss code from memory.** Before using any class, method, option or endpoint (MossClient, create_index, add_docs, load_index, sessions, Inference, REST), open the relevant page and follow it.
- If the mirror looks stale or a page is missing, refresh it with `python3 fetch_moss_docs.py`. Or fetch the live page: the index is at https://docs.moss.dev/llms.txt, and any docs page is available as Markdown by adding `.md` to its URL.
- Mirror refreshed: 2026-11-12
