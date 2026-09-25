#!/usr/bin/env node
// vibedev-rules update-check hook (Claude Code SessionStart). Notify-only, fail-silent, never auto-updates — see README.md § Update notifications for the five-state contract this classifies against.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import {
  STATE_UNKNOWN,
  STATE_CURRENT,
  STATE_AHEAD,
  classifyState,
  cmpSemver,
  fetchRemoteChangelog,
  localInstallPresent,
  parseChangelogVersion,
} from "./vibe_version_check.mjs";

const CHANGELOG_URL_HUMAN = "https://github.com/hoan9an/vibedev-rules/blob/master/CHANGELOG.md";
const REPO_URL = "https://github.com/hoan9an/vibedev-rules";
const UPDATE_CMD = "npx vibedev-rules@latest";
const THROTTLE_OK_HOURS = 24; // after a definitive result, wait a full day
const THROTTLE_FAIL_HOURS = 1; // after offline/timeout, retry sooner so a notice is not lost

const HOME = homedir();
const INSTALL_ROOT = join(HOME, ".vibedev", "rules"); // matches install.mjs INSTALL_ROOT
const LOCAL_CHANGELOG = join(INSTALL_ROOT, "CHANGELOG.md");
const THROTTLE_FILE = join(HOME, ".claude", "hooks", ".vibe-update-check");

function silentExit() {
  process.exit(0);
}

// Windows/Node24 quirk: after an aborted undici request, a hard process.exit(0) can trip
// `UV_HANDLE_CLOSING` (0xC0000409). Give pending handle close a beat before exiting.
const SETTLE_MS = 100;
const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

/** True if it is time to check again (also when the marker is missing/unreadable). */
function checkDue() {
  try {
    const due = parseFloat(readFileSync(THROTTLE_FILE, "utf8").trim());
    if (Number.isNaN(due)) return true;
    return Date.now() / 1000 >= due;
  } catch {
    return true;
  }
}

/** Record the next-allowed check time. */
function deferCheck(hours) {
  try {
    mkdirSync(dirname(THROTTLE_FILE), { recursive: true });
    writeFileSync(THROTTLE_FILE, String(Math.floor(Date.now() / 1000 + hours * 3600)));
  } catch {
    /* ignore */
  }
}

/** Return [[header, [lines]]] for each '## ' section, in file order. */
function splitEntries(text) {
  const entries = [];
  let cur = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) {
      cur = [line.slice(3).trim(), [line]];
      entries.push(cur);
    } else if (cur) {
      cur[1].push(line);
    }
  }
  return entries;
}

function emit(banner, context) {
  process.stdout.write(
    JSON.stringify({
      systemMessage: banner,
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
      suppressOutput: true,
    }) + "\n"
  );
}

function reportMissing() {
  const banner =
    "📦 vibedev-rules is not installed on this machine\n" +
    `   Install: ${UPDATE_CMD}\n` +
    `   Repo:    ${REPO_URL}`;
  const context =
    "The vibedev-rules shared-rule corpus is not installed on this machine.\n" +
    `To install it, run: ${UPDATE_CMD}`;
  emit(banner, context);
}

/** Released entries strictly newer than localVersion, newest-first, skipping [Unreleased]. */
function buildDelta(remoteText, localVersion) {
  const deltaLines = [];
  for (const [header, lines] of splitEntries(remoteText)) {
    const m = header.match(/^\[(\d+\.\d+\.\d+)\]/);
    if (!m) continue; // [Unreleased] or any other non-version heading
    if (cmpSemver(m[1], localVersion) <= 0) break; // reached local's own version or older
    deltaLines.push(...lines);
  }
  return deltaLines.join("\n").trim();
}

function reportUpdate(localVersion, remoteVersion, remoteText) {
  let delta = buildDelta(remoteText, localVersion);
  const maxDelta = 1400;
  if (delta.length > maxDelta) {
    delta = delta.slice(0, maxDelta).replace(/\s+$/, "") + "\n… (see full changelog at the link below)";
  }
  const banner =
    "📢 vibedev-rules has a new update available\n" +
    `   ${localVersion} → ${remoteVersion}\n` +
    `   Update:    ${UPDATE_CMD}\n` +
    `   Changelog: ${CHANGELOG_URL_HUMAN}\n\n` +
    delta;
  const context =
    "The vibedev-rules shared-rule corpus has a newer version available.\n" +
    `Installed: ${localVersion}. Latest: ${remoteVersion}.\n` +
    `To update, run: ${UPDATE_CMD}\n\n` +
    "What's new (from CHANGELOG.md):\n" +
    delta;
  emit(banner, context);
}

async function main() {
  // Local file-stat, always run and never throttled — a not-installed machine must hear about it every session, not once per THROTTLE_OK_HOURS.
  if (!localInstallPresent(INSTALL_ROOT)) {
    reportMissing();
    silentExit();
  }

  if (!checkDue()) silentExit();

  let localText;
  try {
    localText = readFileSync(LOCAL_CHANGELOG, "utf8");
  } catch {
    deferCheck(THROTTLE_OK_HOURS);
    silentExit();
  }
  const localVersion = parseChangelogVersion(localText);

  const remoteText = await fetchRemoteChangelog();
  const remoteVersion = remoteText ? parseChangelogVersion(remoteText) : null;

  const state = classifyState(true, localVersion, remoteVersion);

  if (state === STATE_UNKNOWN) {
    deferCheck(THROTTLE_FAIL_HOURS); // offline/timeout -> retry soon
    await settle();
    silentExit();
  }

  deferCheck(THROTTLE_OK_HOURS); // definitive answer -> next check in a day

  if (state === STATE_CURRENT || state === STATE_AHEAD) {
    await settle(); // up to date, or a dev machine ahead of remote — never nag
    silentExit();
  }

  reportUpdate(localVersion, remoteVersion, remoteText);
  await settle();
  silentExit();
}

main().catch(silentExit);
