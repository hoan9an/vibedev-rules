#!/usr/bin/env node
// Brand guard — two checks over this repo's tracked text:
//
//  1. CORRUPTION — an unbounded find/replace of the old brand token into the new
//     one can mangle ordinary words that merely contain the old substring (a real
//     word grows a stray "vibe" in its middle). Signature: a lowercase letter
//     immediately before AND after "vibe". Legitimate brand tokens (vibedev,
//     vibeflow, viberule, ...) begin the token, so they never trip this guard.
//
//  2. OLD BRAND — tokens from the pre-rebrand identity. A port or sync from an
//     upstream rules repo must strip the upstream's author, repo name and brand
//     (see CLAUDE.md "Porting from an upstream corpus"). Scanned in files AND in
//     every commit message reachable from HEAD, because a message is not scrubbed
//     by a later commit — only a rewrite or a pre-push catch removes it.
//
// A line that must keep an old-brand token carries the literal marker
// `brand-guard-ignore` plus a reason. The guard's own source is skipped.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative, sep } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules"]);
const SKIP_FILES = new Set(["scripts/check-brand.mjs"]);
const EXTS = new Set([".md", ".mjs", ".js", ".json", ".sh", ".ps1", ".py", ".yml", ".yaml", ".txt"]);

const CORRUPTION = /[\w-]*[a-z]vibe[a-z][\w-]*/g;
const OLD_BRAND = /(?:\baki\b|akidev|akinet|akiflow|akirule|akiship|akiopen|akidevsync|akinuxtcf|~\/\.aki|\.aki\/|lacvietanh|vietanhmusic)/gi;
const IGNORE = "brand-guard-ignore";

const hits = [];

function scan(where, lineNo, text) {
  if (text.includes(IGNORE)) return;
  CORRUPTION.lastIndex = 0;
  let m;
  while ((m = CORRUPTION.exec(text)) !== null) hits.push(`${where}:${lineNo}: corruption \`${m[0]}\``);
  OLD_BRAND.lastIndex = 0;
  while ((m = OLD_BRAND.exec(text)) !== null) hits.push(`${where}:${lineNo}: old-brand \`${m[0]}\``);
}

(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    const dot = name.lastIndexOf(".");
    if (dot < 0 || !EXTS.has(name.slice(dot))) continue;
    const rel = relative(ROOT, p).split(sep).join("/");
    if (SKIP_FILES.has(rel)) continue;
    const lines = readFileSync(p, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) scan(rel, i + 1, lines[i]);
  }
})(ROOT);

// Commit messages reachable from HEAD. Skipped silently when git is unavailable.
try {
  const out = execFileSync("git", ["log", "HEAD", "--format=%H%x1f%B%x1e"], {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  for (const rec of out.split("\x1e")) {
    if (!rec.trim()) continue;
    const [rawSha, ...rest] = rec.split("\x1f");
    const sha = rawSha.trim();
    const body = rest.join("\x1f");
    if (!sha || !body || body.includes(IGNORE)) continue;
    OLD_BRAND.lastIndex = 0;
    let m;
    while ((m = OLD_BRAND.exec(body)) !== null) hits.push(`commit ${sha.slice(0, 12)}: old-brand \`${m[0]}\``);
  }
} catch {
  /* not a git checkout — file scan only */
}

if (hits.length) {
  process.stderr.write(
    `check-brand: FAIL — ${hits.length} token(s):\n` + hits.map((h) => "  " + h).join("\n") + "\n"
  );
  process.exit(1);
}
process.stdout.write("check-brand: OK\n");
