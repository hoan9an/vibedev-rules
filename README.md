# vibedev-rules

**VibeSoft's coding-agent standards — installed everywhere with one command.**

`vibedev-rules` is the single source of truth for the rules, Agent Skills, and agent
definitions VibeSoft runs across every AI coding CLI. You edit the standards here; the
installer deploys them into each tool's local config. There is no service, no daemon,
and nothing phones home — just files on your machine, refreshed whenever you re-run the
installer.

![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)
![runtime](https://img.shields.io/badge/runtime-Node%2018%2B-blue)
![license](https://img.shields.io/badge/license-MIT-green)

---

## Quick start

```bash
npx vibedev-rules@latest
```

Installs (or updates) everything, then exits. Requires Node.js 18+. Re-run it any time —
that is the entire update story.

<details>
<summary>Other ways to install</summary>

```bash
# Shell one-liner, no npm
curl -fsSL https://raw.githubusercontent.com/hoan9an/vibedev-rules/master/install.sh | bash
```

```powershell
# Windows PowerShell, no npm
git clone https://github.com/hoan9an/vibedev-rules.git
cd vibedev-rules
.\install.ps1
```

```bash
# From a local checkout, any platform
node install.mjs            # install / update
node install.mjs --check    # print installed vs latest version, then exit
```
</details>

The installer (`install.mjs`) uses only the Node standard library; `install.sh` and
`install.ps1` are thin launchers that locate `node` and hand off. Python 3.7+ is optional
and only used to *run* the `vibeflow` helper scripts at runtime — never to install.

---

## What's in the box

- **12 `RULE-*` + 6 `METHOD-*`** — the rule corpus: coding, docs, release, UI, database,
  stacks, plus reusable reasoning methods (deep-think, proportionality, audit flows).
- **9 skills** — `viberule`, `vibeflow`, `vibethink`, `vibehtmlreport`, `vibehelp`,
  `vibegitcommit`, `vibelint`, `vibeship`, `vibe-article-writer`.
- **5 agent definitions** — `vibe-hands`, `vibe-judge`, `vibe-conduct`, `vibe-challenger`,
  `vibe-maker`.
- **Gemini / Antigravity overrides and settings fragments** for the CLIs that need them.

---

## Where it lands

| # | Target | What arrives |
|---|--------|--------------|
| 1 | `~/.vibedev/rules/` | The rule corpus (`payload/*`) plus `.source-repo` / `.version` stamp files |
| 2 | `~/.claude/` | Packaged `CLAUDE.md` (timestamped backup first), 9 skills in `skills/`, 5 agents in `agents/` (copied per file — your own agents are kept), permission + skill-override merges into `settings.json`, and 2 SessionStart update-check hooks |
| 3 | `~/.gemini/` | `GEMINI.md` overrides (version-stamped), 18 native rule files with YAML triggers under `config/rules/`, 9 skills under `config/skills/`, `config/skills.json`, permission merges |
| 4–5 | `~/.agents/skills/`, `~/.grok/skills/` | Codex CLI and Grok CLI skill roots — the shared skill corpus, synced per folder (skills only, no rule corpus) |

Every sync is scoped to managed names only. Skills and agents you already had outside the
managed set are never touched — there is no blanket directory wipe.

---

## How the corpus loads

Two mechanisms, by design:

- **Always-on core.** `index.md`, `RULE-agent-behavior.md`, `RULE-coding.md` and
  `RULE-pattern-core.md` are `@`-imported by the installed `~/.claude/CLAUDE.md`, so the
  harness loads them mechanically at session start — no model decision involved.
- **On demand.** Everything else is pulled in by the `viberule` router only when a task's
  signals match, which keeps the always-resident context small.

---

## Staying current

Re-run the install command — nothing else is needed. A SessionStart hook checks the
published version and prints a single-line notice; it never downloads, never auto-updates,
and never blocks a session. Offline or unreachable upstreams degrade silently to `unknown`.
The full state machine lives in the hook source under `claude/hooks/`.

---

## Using it in a project

Each project keeps a short root `CLAUDE.md` that points at the `viberule` skill and carries
only that project's own facts and stricter constraints. Projects never copy the shared
corpus — it is maintained here and installed there, so project instructions stay tiny.

---

## Companion — vibedev-bridge

[vibedev-bridge](https://github.com/hoan9an/vibedev-bridge) is a **consumer runtime** of this
corpus: it reads the installed baseline at `~/.vibedev/rules` (the `.version` stamp and the
`@import` layout) instead of re-implementing the standards. `vibedev-rules` is the source of
truth; bridge consumes it. The invariants bridge depends on — and the rule that any change to
them updates both repos together — are the contract in
[docs/arch/vibedev-bridge-integration.md](docs/arch/vibedev-bridge-integration.md).

---

## Repository layout

```text
payload/          rule corpus (RULE-*.md, METHOD-*.md, index.md, GEMINI.md template)
skills/           shared Agent Skills (SKILL.md open standard) — 9 skills
claude/           Claude Code runtime assets (CLAUDE.md template, agents/, hooks/, fragment)
scripts/          repo-only tooling (version sync, brand guard, bias suite) — never installed
docs/             architecture, decision records, research, and references
install.mjs       cross-platform Node installer — the source of truth
install.sh/.ps1   thin launchers that find node and hand off
CHANGELOG.md      release history (shipped so installs can stamp a version)
```

The `RULE-*` / `METHOD-*` naming convention and the `⟨VibeSoft⟩` site-isolation flag are
documented in `payload/index.md`.

---

## Uninstall

```bash
rm -rf ~/.vibedev/rules
rm -rf ~/.vibedev/agent-council
rm -rf ~/.claude/skills/{viberule,vibeflow,vibethink,vibehtmlreport,vibehelp,vibegitcommit,vibelint,vibeship,vibe-article-writer}
rm -rf ~/.agents/skills/{viberule,vibeflow,vibethink,vibehtmlreport,vibehelp,vibegitcommit,vibelint,vibeship,vibe-article-writer}   # Codex CLI
rm -rf ~/.grok/skills/{viberule,vibeflow,vibethink,vibehtmlreport,vibehelp,vibegitcommit,vibelint,vibeship,vibe-article-writer}     # Grok CLI
rm -f  ~/.claude/agents/vibe-{hands,judge,conduct,challenger,maker}.md
rm -f  ~/.gemini/GEMINI.md
```

On Windows, replace `~` with `%USERPROFILE%` and use `Remove-Item -Recurse -Force`.
Optionally remove the vibedev-rules block from `~/.claude/CLAUDE.md` and its `permissions`
and `skillOverrides` entries from `~/.claude/settings.json`.

---

## License

MIT — see [LICENSE](LICENSE).
