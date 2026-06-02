#!/usr/bin/env node
/**
 * Regenerate course/student-starter or course/student-advanced-features from course/live-build.
 *
 * Usage:
 *   node scripts/bootstrap-course-branches.mjs starter [--dry-run]
 *   node scripts/bootstrap-course-branches.mjs advanced [--dry-run]
 */

import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_BRANCH = "course/live-build";
const STARTER_BRANCH = "course/student-starter";
const ADVANCED_BRANCH = "course/student-advanced-features";

const STARTER_KEEP_ROOT = new Set([
  "README.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "next.config.mjs",
  "next-env.d.ts",
  ".env.example",
  ".gitignore",
]);

const STARTER_KEEP_DIRS = ["app", "docs"];

const STARTER_DOC_PATHS = [
  "docs/spec.md",
  "docs/COURSE-BRANCHES.md",
  "docs/design.pen",
  "docs/user-stories",
  "docs/line-push-vercel-cron",
];

const STARTER_REMOVE_DOC_DIRS = [
  "docs/init-project-features",
  "docs/line-chart-optimization",
  "docs/ui-redesign",
  "docs/design-sample",
  "docs/debug-scenarios.md",
];

const MAIN_US_FILES = [
  "docs/user-stories/US-01.md",
  "docs/user-stories/US-02.md",
  "docs/user-stories/US-03.md",
  "docs/user-stories/US-04.md",
  "docs/user-stories/US-05.md",
  "docs/user-stories/US-06.md",
];

/** AI agent config carried from course/live-build to student branches */
const AI_AGENT_CARRY_PATHS = {
  rootFiles: ["AGENTS.md"],
  dirs: ["agents", ".cursor/rules", ".claude/rules", "rules-switch"],
  scriptFiles: ["scripts/switch-ai-mode.mjs"],
};

const STARTER_PAGE = `"use client";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-on-background">
        股價投資看板 — 課程實作起點
      </h1>
      <p className="mt-4 text-on-background-muted">
        此分支僅含專案工具鏈與 User Story 文件。請依序實作主線功能；卡關時請唯讀參考{" "}
        <code className="rounded bg-card-muted px-1">course/live-build</code>
        （分支說明見{" "}
        <code className="rounded bg-card-muted px-1">docs/COURSE-BRANCHES.md</code>
        ）。
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-6 text-on-background">
        <li>
          閱讀{" "}
          <code className="rounded bg-card-muted px-1">docs/user-stories/US-01.md</code>
          （US-01：即時股價查詢）
        </li>
        <li>完成 US-02～US-06</li>
        <li>
          加分：checkout{" "}
          <code className="rounded bg-card-muted px-1">
            course/student-advanced-features
          </code>
        </li>
      </ol>
      <p className="mt-8 text-sm text-on-background-muted">
        環境：複製 <code className="rounded bg-card-muted px-1">.env.example</code>{" "}
        為 <code className="rounded bg-card-muted px-1">.env.local</code> 後執行{" "}
        <code className="rounded bg-card-muted px-1">npm run dev</code>。
      </p>
    </main>
  );
}
`;

const TELEGRAM_ONLY_STOCK_NOTIFICATION = `import { sendTelegramText } from "@/lib/telegram";

export type TargetPriceAlertPayload = {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  triggeredAt: Date;
};

export type SendTargetPriceNotificationsResult =
  | { ok: true }
  | {
      ok: false;
      reason: "no_channels" | "send_failed";
      failedChannels?: string[];
    };

export function isTelegramEnabled(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );
}

function formatTriggeredAt(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return \`\${date.getFullYear()}-\${pad(date.getMonth() + 1)}-\${pad(date.getDate())} \${pad(date.getHours())}:\${pad(date.getMinutes())}\`;
}

function formatAlertPrice(value: number): string {
  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function buildTargetPriceAlertMessage(
  payload: TargetPriceAlertPayload,
): string {
  return [
    "股價達標提醒",
    \`股票：\${payload.symbol}\`,
    \`目前股價：\${formatAlertPrice(payload.currentPrice)}\`,
    \`目標股價：\${formatAlertPrice(payload.targetPrice)}\`,
    \`時間：\${formatTriggeredAt(payload.triggeredAt)}\`,
  ].join("\\n");
}

export async function sendTargetPriceNotifications(
  payload: TargetPriceAlertPayload,
): Promise<SendTargetPriceNotificationsResult> {
  const message = buildTargetPriceAlertMessage(payload);

  if (!isTelegramEnabled()) {
    console.error(
      "target notification: telegram env missing (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
    );
    return { ok: false, reason: "no_channels" };
  }

  const result = await sendTelegramText(message);

  if (!result.ok) {
    console.error("target notification failed for telegram");
    return {
      ok: false,
      reason: "send_failed",
      failedChannels: ["telegram"],
    };
  }

  return { ok: true };
}
`;

const CHECK_PRICES_POST_ONLY = `import { NextResponse } from "next/server";

import { WATCHLIST_FETCH_ERROR } from "@/lib/constants";
import { refreshWatchlistPrices } from "@/lib/refresh-watchlist-prices";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/** 前端輪詢；維持不強制 secret。 */
export async function POST() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { items, notificationError } = await refreshWatchlistPrices(supabase);

    return NextResponse.json({ items, notificationError });
  } catch (error) {
    console.error("check-prices failed:", error);
    return NextResponse.json({ error: WATCHLIST_FETCH_ERROR }, { status: 500 });
  }
}
`;

const VERCEL_NO_CRONS = `{
  "framework": "nextjs",
  "buildCommand": "next build --webpack",
  "outputDirectory": ".next"
}
`;

function run(cmd, opts = {}) {
  if (process.argv.includes("--dry-run")) {
    console.log(`[dry-run] ${cmd}`);
    return "";
  }
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: opts.stdio ?? "pipe", ...opts });
}

function getCurrentBranch() {
  return run("git rev-parse --abbrev-ref HEAD").trim();
}

function assertNotOnLiveBuild() {
  const branch = getCurrentBranch();
  if (branch === SOURCE_BRANCH) {
    console.error(
      `Refusing: currently on ${SOURCE_BRANCH}. Checkout another branch first.`,
    );
    process.exit(1);
  }
}

function gitShow(path) {
  return run(`git show ${SOURCE_BRANCH}:${path}`);
}

function setCheckboxes(content, checked) {
  const replacement = checked ? "[x]" : "[ ]";
  return content.replace(/- \[[ x]\]/g, `- ${replacement}`);
}

function stripAcceptanceSection(content) {
  const marker = "#### 驗收說明";
  const idx = content.indexOf(marker);
  if (idx === -1) return content;
  return content.slice(0, idx).trimEnd() + "\n";
}

function processMainUserStories(root, { checked }) {
  for (const rel of MAIN_US_FILES) {
    const full = join(root, rel);
    if (!existsSync(full)) continue;
    let content = readFileSync(full, "utf8");
    content = setCheckboxes(content, checked);
    content = stripAcceptanceSection(content);
    writeFileSync(full, content);
  }
}

function processLinePushUserStories(root) {
  const usDir = join(root, "docs/line-push-vercel-cron/user-stories");
  if (!existsSync(usDir)) return;
  for (const name of readdirSync(usDir)) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    const full = join(usDir, name);
    let content = readFileSync(full, "utf8");
    content = setCheckboxes(content, false);
    writeFileSync(full, content);
  }
  const specPath = join(root, "docs/line-push-vercel-cron/spec.md");
  if (existsSync(specPath)) {
    let content = readFileSync(specPath, "utf8");
    content = setCheckboxes(content, false);
    writeFileSync(specPath, content);
  }
}

function removePath(target) {
  if (!existsSync(target)) return;
  rmSync(target, { recursive: true, force: true });
}

function extractArchivePaths(paths) {
  const staging = join(ROOT, ".bootstrap-staging");
  for (const p of paths) {
    try {
      run(`git archive ${SOURCE_BRANCH} ${p} | tar -x -C "${staging}"`, {
        shell: true,
        maxBuffer: 20 * 1024 * 1024,
      });
    } catch (e) {
      console.warn(`Skip archive ${p}:`, e.message);
    }
  }
}

function copyFileFromSource(staging, rel) {
  try {
    const content = gitShow(rel);
    const dest = join(staging, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
  } catch (e) {
    console.warn(`Skip missing ${rel}:`, e.message);
  }
}

function copyAiAgentFromSource(staging) {
  for (const file of AI_AGENT_CARRY_PATHS.rootFiles) {
    copyFileFromSource(staging, file);
  }
  extractArchivePaths(AI_AGENT_CARRY_PATHS.dirs);
  for (const file of AI_AGENT_CARRY_PATHS.scriptFiles) {
    copyFileFromSource(staging, file);
  }
}

function assertAiAgentFilesPresent(root = ROOT) {
  const missing = [];
  for (const file of AI_AGENT_CARRY_PATHS.rootFiles) {
    if (!existsSync(join(root, file))) missing.push(file);
  }
  for (const dir of AI_AGENT_CARRY_PATHS.dirs) {
    if (!existsSync(join(root, dir))) missing.push(`${dir}/`);
  }
  for (const file of AI_AGENT_CARRY_PATHS.scriptFiles) {
    if (!existsSync(join(root, file))) missing.push(file);
  }
  if (missing.length > 0) {
    console.error(
      `Missing AI agent files on ${SOURCE_BRANCH}: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

function logDryRunAiAgentPaths() {
  console.log(`AI agent paths to carry from ${SOURCE_BRANCH}:`);
  for (const file of AI_AGENT_CARRY_PATHS.rootFiles) console.log(`  ${file}`);
  for (const dir of AI_AGENT_CARRY_PATHS.dirs) console.log(`  ${dir}/`);
  for (const file of AI_AGENT_CARRY_PATHS.scriptFiles) console.log(`  ${file}`);
}

function buildStarterStaging(bootstrapScriptContent) {
  const staging = join(ROOT, ".bootstrap-staging");
  removePath(staging);
  mkdirSync(staging, { recursive: true });

  for (const file of STARTER_KEEP_ROOT) {
    try {
      const content = gitShow(file);
      const dest = join(staging, file);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content);
    } catch (e) {
      console.warn(`Skip missing ${file}:`, e.message);
    }
  }

  try {
    run(`git archive ${SOURCE_BRANCH} app/favicon.ico | tar -x -C "${staging}"`, {
      shell: true,
    });
  } catch {
    console.warn("Skip app/favicon.ico");
  }

  for (const rel of ["app/layout.tsx", "app/globals.css"]) {
    try {
      const content = gitShow(rel);
      const dest = join(staging, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content);
    } catch {
      console.warn(`Skip ${rel}`);
    }
  }

  writeFileSync(join(staging, "app/page.tsx"), STARTER_PAGE);

  extractArchivePaths([
    "docs/user-stories",
    "docs/line-push-vercel-cron",
  ]);

  for (const docPath of ["docs/spec.md", "docs/COURSE-BRANCHES.md", "docs/design.pen"]) {
    try {
      const content = gitShow(docPath);
      const dest = join(staging, docPath);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content);
    } catch (e) {
      console.warn(`Skip doc ${docPath}:`, e.message);
    }
  }

  copyAiAgentFromSource(staging);

  mkdirSync(join(staging, "scripts"), { recursive: true });
  writeFileSync(
    join(staging, "scripts/bootstrap-course-branches.mjs"),
    bootstrapScriptContent,
  );

  return staging;
}

function bootstrapStarter(dryRun) {
  console.log(`Creating ${STARTER_BRANCH} from ${SOURCE_BRANCH}...`);
  if (dryRun) logDryRunAiAgentPaths();

  const bootstrapScriptContent = readFileSync(
    join(ROOT, "scripts/bootstrap-course-branches.mjs"),
    "utf8",
  );

  if (!dryRun) {
    try {
      run(`git fetch origin ${SOURCE_BRANCH}`, { stdio: "inherit" });
    } catch {
      /* offline ok */
    }
    run(`git checkout -f ${SOURCE_BRANCH}`, { stdio: "inherit" });

    const staging = buildStarterStaging(bootstrapScriptContent);

    try {
      run(`git branch -D ${STARTER_BRANCH}`, { stdio: "pipe" });
    } catch {
      /* ignore */
    }
    run(`git checkout --orphan ${STARTER_BRANCH}`, { stdio: "inherit" });
    run("git rm -rf . 2>/dev/null || true", { stdio: "inherit", shell: true });

    for (const entry of readdirSync(staging)) {
      const src = join(staging, entry);
      const dest = join(ROOT, entry);
      if (existsSync(dest)) removePath(dest);
      cpSync(src, dest, { recursive: true });
    }
    removePath(staging);

    for (const rel of STARTER_REMOVE_DOC_DIRS) {
      removePath(join(ROOT, rel));
    }

    processMainUserStories(ROOT, { checked: false });
    processLinePushUserStories(ROOT);

    run("git add -A", { stdio: "inherit" });
    removePath(join(ROOT, ".next"));
    console.log("Installing dependencies...");
    run("npm ci", { stdio: "inherit" });
    console.log("Running typecheck & build...");
    run("npm run typecheck", { stdio: "inherit" });
    run("npm run build", { stdio: "inherit" });
    run(
      'git commit -m "$(cat <<\'EOF\'\nchore(course): add student-starter branch for mainline exercises\n\nDocs-only starter with empty Next.js shell; no migrations or business logic.\nEOF\n)"',
      { stdio: "inherit", shell: true },
    );
  }

  console.log(`Done: ${STARTER_BRANCH}`);
}

function bootstrapAdvanced(dryRun) {
  console.log(`Creating ${ADVANCED_BRANCH} from ${SOURCE_BRANCH}...`);
  if (dryRun) logDryRunAiAgentPaths();

  if (!dryRun) {
    run(`git checkout -f ${SOURCE_BRANCH}`, { stdio: "inherit" });
    run(`git checkout -B ${ADVANCED_BRANCH}`, { stdio: "inherit" });

    assertAiAgentFilesPresent();

    removePath(join(ROOT, "lib/line.ts"));
    removePath(join(ROOT, "app/api/test-line"));
    removePath(join(ROOT, "lib/cron-auth.ts"));
    removePath(join(ROOT, "supabase"));

    writeFileSync(join(ROOT, "lib/stock-notification.ts"), TELEGRAM_ONLY_STOCK_NOTIFICATION);
    writeFileSync(join(ROOT, "app/api/check-prices/route.ts"), CHECK_PRICES_POST_ONLY);
    writeFileSync(join(ROOT, "vercel.json"), VERCEL_NO_CRONS);

    processMainUserStories(ROOT, { checked: true });
    processLinePushUserStories(ROOT);

    const readmePath = join(ROOT, "docs/line-push-vercel-cron/user-stories/README.md");
    if (existsSync(readmePath)) {
      let readme = readFileSync(readmePath, "utf8");
      readme = readme.replace(
        "docs/init-project-features/user-stories",
        "docs/user-stories 主線 US-01～04",
      );
      if (!readme.includes("../../user-stories/")) {
        readme = readme.replace(
          /（隱含前提：[^）]+）/,
          "（隱含前提：主專案已完成 Supabase watchlist、Yahoo 查價、`/api/check-prices` 既有流程 — 見 [`docs/user-stories/`](../../user-stories/) 主線 US-01～04。）",
        );
      }
      writeFileSync(readmePath, readme);
    }

    if (!existsSync(join(ROOT, "docs/COURSE-BRANCHES.md"))) {
      console.warn("docs/COURSE-BRANCHES.md missing on advanced branch");
    }

    run("git add -A", { stdio: "inherit" });
    removePath(join(ROOT, ".next"));
    console.log("Running typecheck & build...");
    run("npm run typecheck", { stdio: "inherit" });
    run("npm run build", { stdio: "inherit" });
    run(
      'git commit -m "$(cat <<\'EOF\'\nchore(course): add student-advanced-features without LINE/Cron impl\n\nMainline MVP complete; LINE Push and Vercel Cron left for bonus US-001~003.\nEOF\n)"',
      { stdio: "inherit", shell: true },
    );
  }

  console.log(`Done: ${ADVANCED_BRANCH}`);
}

const dryRun = process.argv.includes("--dry-run");
const cmd = process.argv.find((a) => a === "starter" || a === "advanced");

if (!cmd) {
  console.error("Usage: node scripts/bootstrap-course-branches.mjs <starter|advanced> [--dry-run]");
  process.exit(1);
}

if (cmd === "starter") {
  bootstrapStarter(dryRun);
} else {
  bootstrapAdvanced(dryRun);
}
