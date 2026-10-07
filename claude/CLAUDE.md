# VibeSoft global [CC] guidance

Keep global context small. Prefer current project files and runtime output over stale docs or memory.

## Core rules — mechanically loaded, every session

@~/.vibedev/rules/index.md
@~/.vibedev/rules/RULE-agent-behavior.md

The harness embeds both at session start: `index.md` is the corpus map, `RULE-agent-behavior.md` the behavior floor. No model decision is involved, so they apply to every task whether or not any skill runs. Every other rule enters context when the model `Read`s it on a route match. For routes with an artifact signature the `vibe-route-guard` PreToolUse hook denies the first Edit/Write of that artifact type in a session until the routed files were read — the deny reason names them; read them in full, then retry. Meaning-only routes stay model-dependent: route on meaning, load when the domain is in doubt. A turn that only reads, counts or explains what exists routes nothing.

`RULE-coding.md` and `RULE-pattern-core.md` are **routed rows**, not resident: the `viberule` router routes them on any code turn, and on [CC] the route guard restores the guarantee the imports used to provide by denying the first code edit until both were read. They were `@` imports once, because being labelled "default ON" in the router never made them load — a skill runs only when the model decides to invoke it. The hook is the mechanism that closes that gap where a hook surface exists; on Codex, Grok and Gemini the router's route rows carry them.

## Shared VibeSoft rule source

VibeSoft's shared rule corpus lives at `~/.vibedev/rules`.

The `viberule` skill routes everything beyond the core above: contextual and analytical rules on signal match with high sensitivity, and full load on explicit command. See `~/.vibedev/profiles/claude/skills/viberule/SKILL.md` for the complete routing spec and signal list.

**IMPORTANT — editing shared rules:** The installed `~/.vibedev/rules` directory is a **deployed copy**, not the source of truth. To change a shared rule:
1. Find the source repo: its absolute path on this machine is recorded in `~/.vibedev/rules/.source-repo`, written by the installer on every install. Read that file — do not guess a location, and do not ask the user for something already recorded. Ask only if the recorded path no longer exists.
2. Edit under `<source-repo>/payload/` (shared rule corpus), `<source-repo>/skills/` (Agent Skills, shared with Antigravity), or `<source-repo>/claude/` ([CC]-only runtime assets: global guidance, hooks, settings fragment).
3. **Read `<source-repo>/CLAUDE.md` before editing.** It carries that repo's own operating rules — which files must be updated together (`payload/index.md`, `skills/viberule/SKILL.md`, `README.md`, `CHANGELOG.md`), file-naming conventions, and non-goals. This step matters most when the request arrives from *another* project's working directory, where that file is not auto-loaded.
4. Run the installer to propagate changes to the installed copy — `node install.mjs` (any platform), or `./install.sh` / `.\install.ps1`.

Never edit the installed `~/.vibedev/rules` files directly — changes will be silently overwritten on the next install.

## Named local corpora

Doc corpora that live outside any single project are often referred to by short name in conversation (e.g. "UNIDOC", "the standards doc"). Their names, paths, and usage notes are **machine-specific**, so they are recorded in the profile's `CLAUDE.local.md` — not in this shared file. When the user names a corpus you cannot resolve, read that file before searching the filesystem or asking.

## ref-ECC guard

`~/.vibedev/rules/ref-ECC` is intentionally very large. Do not scan, summarize, or bulk-load it by default.

Only use `ref-ECC` when the user explicitly asks for it or when a task has a specific, narrow need for that reference corpus. Prefer targeted file/path lookup over broad search to avoid context bloat.
