# vibedev-bridge integration contract

> updated 2026-09-25 · v3.0.0

`vibedev-rules` is the source of truth for the rule/skill corpus. **vibedev-bridge**
([hoan9an/vibedev-bridge](https://github.com/hoan9an/vibedev-bridge)) is a **consumer
runtime** of that corpus: it reads the *installed* baseline under `~/.vibedev/rules` at
runtime rather than re-implementing or vendoring it. The two repositories form one system —
this repo owns the standards, bridge consumes them — and both sides point at this contract as
the single source of truth for what may not silently change. Bridge mirrors it on its side at
`docs/arch/vibedev-rules-integration.md`.

## What vibedev-bridge depends on (invariants)

These are load-bearing for the consumer — treat them as a public API, not internal detail:

| Invariant | Where | Contract |
|-----------|-------|----------|
| **Install root** | `~/.vibedev/rules/` | The corpus installs here; bridge reads it here. |
| **`.version` stamp** | `~/.vibedev/rules/.version` | Written every install by `install.mjs`, one `key=value` per line. **The `version=<semver>` line must stay** (alongside `installed=`, `commit=`, `branch=`). Bridge parses `version=`. |
| **`install.sh` on `master`** | `raw.githubusercontent.com/hoan9an/vibedev-rules/master/install.sh` | The bootstrap launcher stays reachable, unauthenticated, on the `master` branch. |
| **`@import` layout** | `~/.claude/CLAUDE.md` | Core corpus files are `@`-imported (mechanical load at session start); bridge relies on that layout, not on the model choosing to route them. |
| **Tool / package name** | `vibedev-rules` | The npm package and tool name bridge references. |

## Change policy — change both repos in the same commit

This repo's *standard-over-legacy* rule says a better shape is adopted fully and every live
reference migrates in the same change. Because bridge is an out-of-repo consumer, "every live
reference" **includes bridge**. If any of the following changes, update vibedev-bridge in
lockstep, and update this doc plus `CLAUDE.md`:

- renaming or moving the `.version` file, or changing the `version=` line format;
- renaming the `master` branch (breaks the raw `install.sh` URL and the update hook's changelog fetch);
- renaming the tool / npm package (`vibedev-rules`);
- moving the install root (`~/.vibedev/rules`) or dropping the `@import` layout.

An invariant change that ships without the matching bridge update is a broken contract, not an
improvement.

## Cross-references

- **Bridge side:** `docs/arch/vibedev-rules-integration.md` — the mirror of this contract.
- `README.md` — the *Companion* section links here.
- `docs/arch/rule-delivery-architecture.md` — how the corpus is installed and consumed (the `.version` and `@import` mechanics this contract freezes).
