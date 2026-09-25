#!/usr/bin/env node
// Brand-corruption guard. An unbounded find/replace of the old brand token into
// the new one can mangle ordinary words that merely contain the old substring —
// a real word suddenly grows a stray "vibe" in its middle. The signature is a
// lowercase letter sitting immediately before AND after "vibe": legitimate brand
// tokens (vibedev, vibeflow, viberule, vibethink, ...) always begin the token,
// so they never carry a letter before "vibe" and never trip this guard.
// Intentional legacy old-brand literals (installer hook cleanup, CHANGELOG
// history) use the OLD token, not this corrupted shape, so they are unaffected.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative, sep } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules"]);
const EXTS = new Set([".md", ".mjs", ".js", ".json", ".sh", ".ps1", ".py", ".yml", ".yaml", ".txt"]);
const CORRUPTION = /[\w-]*[a-z]vibe[a-z][\w-]*/g;

const hits = [];
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
    const lines = readFileSync(p, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      CORRUPTION.lastIndex = 0;
      let m;
      while ((m = CORRUPTION.exec(lines[i])) !== null) {
        hits.push(`${relative(ROOT, p).split(sep).join("/")}:${i + 1}: ${m[0]}`);
      }
    }
  }
})(ROOT);

if (hits.length) {
  process.stderr.write(
    `check-brand: FAIL - ${hits.length} corrupted token(s) found ` +
      "(a stray brand token wedged inside a real word):\n" +
      hits.map((h) => "  " + h).join("\n") +
      "\n"
  );
  process.exit(1);
}
process.stdout.write("check-brand: OK\n");
