#!/usr/bin/env node
/**
 * 一鍵切換 AI 開發模式（Prototype / Production）：
 * - 覆寫專案根的 AGENTS.md
 * - 覆寫 .cursor/rules/*.mdc 與 .claude/rules/*.mdc（來源：rules-switch/modes/<mode>/rules/）
 *
 * Usage: node scripts/switch-ai-mode.mjs <prototype|production>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const mode = process.argv[2];

if (!mode || !["prototype", "production"].includes(mode)) {
  console.error("Usage: node scripts/switch-ai-mode.mjs <prototype|production>");
  process.exit(1);
}

const agentsSource = path.join(root, "agents", `${mode}.md`);
const agentsTarget = path.join(root, "AGENTS.md");

if (!fs.existsSync(agentsSource)) {
  console.error(`Missing agents file: ${agentsSource}`);
  process.exit(1);
}

fs.copyFileSync(agentsSource, agentsTarget);

const rulesSourceDir = path.join(
  root,
  "rules-switch",
  "modes",
  mode,
  "rules",
);

if (!fs.existsSync(rulesSourceDir)) {
  console.error(`Missing rules directory: ${rulesSourceDir}`);
  process.exit(1);
}

function syncRulesToDir(targetRulesDir) {
  fs.mkdirSync(targetRulesDir, { recursive: true });

  for (const name of fs.readdirSync(targetRulesDir)) {
    if (!name.endsWith(".mdc")) continue;
    fs.unlinkSync(path.join(targetRulesDir, name));
  }

  let copiedCount = 0;
  for (const name of fs.readdirSync(rulesSourceDir)) {
    if (!name.endsWith(".mdc")) continue;
    fs.copyFileSync(
      path.join(rulesSourceDir, name),
      path.join(targetRulesDir, name),
    );
    copiedCount += 1;
  }

  return copiedCount;
}

const cursorCount = syncRulesToDir(path.join(root, ".cursor", "rules"));
const claudeCount = syncRulesToDir(path.join(root, ".claude", "rules"));

if (cursorCount === 0 || claudeCount === 0) {
  console.error(`No .mdc files found in ${rulesSourceDir}`);
  process.exit(1);
}

console.log(
  `Switched AI mode to: ${mode} (copied ${cursorCount} rule file(s) to .cursor/rules and .claude/rules).`,
);
