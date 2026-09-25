# vibedev-rules — working notes for agents

This repository is VibeSoft's source of truth for a reusable coding-agent rule and skill
baseline. Treat it as a **standards-distribution project** — a corpus that gets *installed*
into other environments — not as an application you run. Everything downstream is generated
or copied from here: edit here first, then let the installer propagate.

## Layout & source of truth

| Path | Role | Ships to |
|------|------|----------|
| `payload/` | The rule corpus (`RULE-*.md`, `METHOD-*.md`, `index.md`, `GEMINI.md` template) | `~/.vibedev/rules` |
| `skills/` | Shared Agent Skills — the `SKILL.md` open standard, deployed unmodified | `~/.claude/skills/`, `~/.gemini/config/skills/`, `~/.agents/skills/` (Codex), `~/.grok/skills/` (Grok) |
| `claude/` | Claude Code-only runtime assets: `CLAUDE.md` template, `agents/`, hooks, settings fragment | `~/.claude/` |
| `docs/` | Repo-internal only — architecture, decision records, references | *not installed* |
| `install.mjs` | The installer, and the SSOT for install behavior (`install.sh`/`.ps1` are thin `node` launchers) | — |

Two things worth remembering:

- **`docs/` is never installed, with one exception:** `docs/ref/macos-codesign-tcc.md` — a
  lookup with no `RULE-`/`METHOD-` shape — is deployed by `install.mjs` to
  `~/.vibedev/rules/docs/ref/`.
- **`claude/agents/*.md` stays under `claude/`, not a vendor-neutral top-level folder,**
  because that agent format has exactly one implementation today (unlike `SKILL.md`, which
  has five). Agents are copied per file into a directory shared with the user's own agents,
  so that tree is never mirrored with `--delete`.

`README.md` is the human/agent-facing explanation of architecture, conventions, and install
flow. Read it for the full picture — but it is documentation, not an instruction file, and
it does not override this CLAUDE.md.

## Naming

- `RULE-*.md` — constraint rules (behavior, coding, content, stack requirements).
- `METHOD-*.md` — analytical frameworks, loaded on demand for audit/optimization tasks.

Renaming a file or introducing a new top-level prefix means updating `payload/index.md`,
`skills/viberule/SKILL.md`, `claude/CLAUDE.md`, `README.md`, and `install.mjs` **in the same
change** — never leave a half-migrated name.

## How rules are authored

- **Standard over legacy.** This repo *is* the standard. When a better name, shape, or
  convention appears, adopt it fully and migrate every live reference in the same change —
  never keep a worse form for backward compatibility. Only immutable event records (past
  `CHANGELOG.md` entries, `docs/research/`, `docs/plan/done/`) keep their original wording.
- **Dense, keyword-first wording.** A rule is condensed scientific-technical language whose
  exact terms are the trigger keywords a model pattern-matches (`group-hover`,
  `spawn_blocking`, `NFC`) — never narrative prose. Line budget follows violation frequency,
  not felt importance; every line passes the deletion test (`agent.A4`).
- **Dogfood — the corpus obeys its own rules.** A new rule, section, or skill needs a unique
  evidence-backed reason to exist (`pattern.A2`), points at overlapping rules instead of
  restating them, and clears the `pattern.B3` critique gate before shipping. A corpus that
  violates itself teaches violation.

## Language

`payload/`, `skills/`, and `claude/` are **public** and distributed to many teams, not just
VibeSoft's. All authored content — including section headers (`## A. …`) — is English.
Vietnamese is allowed only where it is functionally required:

- keyword/signal lists that must match a Vietnamese-speaking user's real words (e.g. Tier 2
  routing keywords in `viberule/SKILL.md`);
- a worked example that needs Vietnamese to make its point (accented-vs-unaccented SEO
  queries, NFC normalization of a Vietnamese name);
- a literal trigger phrase the user actually types (`nạp full`, `commit luôn`).

A ready-to-paste prompt template (e.g. in `payload/GEMINI.md`) must not hardcode
Vietnamese output — tell the agent to compose in the session's current language rather than
shipping a fixed-language example.

## Before you edit

- **vibedev-bridge is a downstream consumer.** Renaming or reformatting `~/.vibedev/rules/.version` (the `version=` line), renaming the `master` branch, moving the install root, dropping the `@import` layout, or renaming the tool breaks it — change `vibedev-bridge` in the same commit. Contract: `docs/arch/vibedev-bridge-integration.md`.
- Run the `viberule` skill before touching durable project files, rule/skill files,
  installer behavior, or project instructions.
- Keep project instructions short and bound to the current repo — never duplicate the shared
  corpus.
- Edits to rules, skills, install targets, or generated Claude config reach many downstream
  environments. Clarify scope and tradeoffs before broad changes unless the ask is explicit.
- Preserve the boundary between packaged **source** here and **installed** runtime files
  under `~/.vibedev/rules` or `~/.claude`.
- Any `payload/*` or `skills/*` change that adds/removes a topic, shifts what a file covers,
  or changes install behavior must also update `README.md` (manifest / "What's in the box" /
  layout) wherever it goes stale.
- Any `skills/*` change (add/remove/rename, or a shift in coverage) must be checked against
  `skills/vibehelp/SKILL.md`: it reads live installed state at runtime, so it usually needs
  no edit — but when the *mechanism* of introducing the system changes, update its steps.
- Always record a `CHANGELOG.md` entry for every change to `payload/`, `skills/`, or
  `claude/`.

## Releasing

Governed by `RULE-release.md` (`A3`, `B4`, `B7`). Repo-specific deltas:

- **Bare semver tags** (`3.0.0`, never `v3.0.0`). Pushing one triggers
  `.github/workflows/release.yml`, which cuts the GitHub Release from the tagged CHANGELOG
  section. There is no npm publish in CI.
- **`npm publish` is a manual local step** (same as `vibedev-bridge`): run
  `npm run sync-version && npm publish` from an authenticated `npm login` session. The
  account has 2FA on writes, so publishing cannot be scripted in CI without an automation
  token — none exists for this repo, and none should be added (see below).

## Out of scope

This project is not an auto-updater, daemon, package manager, application framework, or
control plane. Do not add runtime automation, background services, unrelated personal Claude
settings, secrets, model-router tokens, localhost project permissions, or bundled large
reference corpora unless explicitly requested.
