#!/usr/bin/env node
/**
 * Pulls MDX + CMS users from private mllws-blog into this working tree
 * before `tinacms build`.
 *
 * Tina's self-hosted index uses a FilesystemBridge of this repo, not the
 * GitHub API. The public CMS repo only has empty placeholder users, so
 * Vercel must clone mllws-blog or login will hash `{ "users": [] }`.
 *
 * Token: GITHUB_PERSONAL_ACCESS_TOKEN (write PAT already used at runtime).
 * Never print the token. Do not commit the copied content.
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const OWNER = process.env.GITHUB_OWNER || "mllws";
const REPO = process.env.GITHUB_REPO || "mllws-blog";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const COLLECTIONS = ["posts", "events", "stories", "galleries", "users"];

function redact(value) {
  if (!TOKEN) return String(value);
  return String(value).split(TOKEN).join("[redacted]");
}

function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copyCollectionsFrom(root) {
  let copied = 0;
  for (const name of COLLECTIONS) {
    const src = path.join(root, "content", name);
    const dest = path.join(process.cwd(), "content", name);
    if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
      console.log(`[fetch-content] No content/${name}/ in ${REPO} — skipping.`);
      continue;
    }
    copyDir(src, dest);
    copied += 1;
    console.log(`[fetch-content] Copied content/${name}/`);
  }
  return copied;
}

if (!TOKEN) {
  const message =
    "[fetch-content] GITHUB_PERSONAL_ACCESS_TOKEN is required to index users from private mllws-blog.";
  if (process.env.VERCEL) {
    console.error(message);
    process.exit(1);
  }
  console.log(`${message} Skipping (not on Vercel).`);
  process.exit(0);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mllws-blog-"));

try {
  console.log(`[fetch-content] Cloning ${OWNER}/${REPO} (${BRANCH})...`);
  execSync(
    `git clone --depth 1 --branch "${BRANCH}" https://oauth2:${TOKEN}@github.com/${OWNER}/${REPO}.git "${tmpDir}"`,
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    }
  );

  const copied = copyCollectionsFrom(tmpDir);
  if (copied === 0) {
    throw new Error(`No content directories found in ${OWNER}/${REPO}.`);
  }

  const usersFile = path.join(process.cwd(), "content", "users", "index.json");
  if (!fs.existsSync(usersFile)) {
    throw new Error("content/users/index.json missing after clone.");
  }
  const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  const count = Array.isArray(users.users) ? users.users.length : 0;
  if (count === 0) {
    throw new Error(
      "mllws-blog content/users/index.json has no users — production login would fail."
    );
  }
  console.log(`[fetch-content] Indexed ${count} CMS user(s) from ${REPO}.`);
} catch (err) {
  const detail = err.stderr ? String(err.stderr) : String(err.message || err);
  console.error("[fetch-content] Failed:", redact(detail));
  process.exit(1);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
